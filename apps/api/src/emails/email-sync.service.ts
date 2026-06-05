import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Prisma } from '@prisma/client';
import { CryptoService } from '../common/crypto.service';
import { isCommerceEmail } from '../parsers/commerce-classifier';
import { parseReceipt } from '../parsers/merchants';
import { NotificationSchedulerService } from '../notifications/notification-scheduler.service';
import { PrismaService } from '../prisma/prisma.service';
import { GmailService } from './gmail.service';

const REVIEW_THRESHOLD = 0.85;

@Injectable()
export class EmailSyncService {
  private readonly logger = new Logger(EmailSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly gmail: GmailService,
    private readonly notificationScheduler: NotificationSchedulerService,
    @InjectQueue('email-sync') private readonly emailSyncQueue: Queue,
  ) {}

  async enqueueSync(linkedEmailId: string) {
    return this.emailSyncQueue.add(
      'sync-linked-email',
      { linkedEmailId },
      { jobId: `sync-${linkedEmailId}-${Date.now()}` },
    );
  }

  async syncLinkedEmail(linkedEmailId: string) {
    const linked = await this.prisma.linkedEmail.findUnique({
      where: { id: linkedEmailId },
    });
    if (!linked) return;

    await this.prisma.linkedEmail.update({
      where: { id: linkedEmailId },
      data: { status: 'syncing' },
    });

    try {
      const refreshToken = this.crypto.decrypt(linked.oauthRefreshEnc);
      const syncDays = (linked.syncWindowDays === 180 ? 180 : 90) as 90 | 180;
      let pageToken: string | undefined;
      let processed = 0;

      do {
        const list = await this.gmail.listCommerceMessages(refreshToken, syncDays, pageToken);
        const messages = list.messages ?? [];

        for (const msg of messages) {
          if (!msg.id) continue;
          await this.processMessage(linkedEmailId, linked.userId, refreshToken, msg.id);
          processed++;
        }

        pageToken = list.nextPageToken ?? undefined;
      } while (pageToken && processed < 500);

      await this.prisma.linkedEmail.update({
        where: { id: linkedEmailId },
        data: {
          status: 'connected',
          lastSyncAt: new Date(),
          lastError: null,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      this.logger.error(`Sync failed for ${linkedEmailId}: ${message}`);
      await this.prisma.linkedEmail.update({
        where: { id: linkedEmailId },
        data: { status: 'error', lastError: message },
      });
    }
  }

  private async processMessage(
    linkedEmailId: string,
    userId: string,
    refreshToken: string,
    messageId: string,
  ) {
    const raw = await this.gmail.getMessage(refreshToken, messageId);
    const headers = raw.payload?.headers ?? [];
    const from = headers.find((h) => h.name?.toLowerCase() === 'from')?.value ?? '';
    const subject = headers.find((h) => h.name?.toLowerCase() === 'subject')?.value ?? '';

    if (!isCommerceEmail(from, subject)) return;

    const { html, text } = this.extractBodies(raw.payload);
    const parsed = parseReceipt({ from, subject, htmlBody: html, textBody: text });
    if (!parsed) return;

    if (parsed.confidence < REVIEW_THRESHOLD) {
      await this.prisma.parseReviewQueue.upsert({
        where: {
          linkedEmailId_messageId: { linkedEmailId, messageId },
        },
        create: {
          linkedEmailId,
          userId,
          messageId,
          merchantGuess: parsed.merchantName,
          rawSnippet: subject,
          confidence: new Prisma.Decimal(parsed.confidence),
          status: 'pending',
        },
        update: {
          confidence: new Prisma.Decimal(parsed.confidence),
          merchantGuess: parsed.merchantName,
        },
      });
      return;
    }

    await this.persistOrderAndReturn(linkedEmailId, userId, parsed);
  }

  private extractBodies(payload: { body?: { data?: string | null }; parts?: { mimeType?: string | null; body?: { data?: string | null }; parts?: unknown[] }[] } | null | undefined): { html: string; text: string } {
    let html = '';
    let text = '';

    const walk = (part: { mimeType?: string | null; body?: { data?: string | null }; parts?: unknown[] }) => {
      if (part.mimeType === 'text/html' && part.body?.data) {
        html += Buffer.from(part.body.data, 'base64url').toString('utf8');
      }
      if (part.mimeType === 'text/plain' && part.body?.data) {
        text += Buffer.from(part.body.data, 'base64url').toString('utf8');
      }
      if (part.parts) {
        for (const p of part.parts) {
          walk(p as { mimeType?: string | null; body?: { data?: string | null }; parts?: unknown[] });
        }
      }
    };

    if (payload) {
      if (payload.body?.data) {
        text = Buffer.from(payload.body.data, 'base64url').toString('utf8');
      }
      if (payload.parts) {
        for (const p of payload.parts) {
          walk(p as { mimeType?: string | null; body?: { data?: string | null }; parts?: unknown[] });
        }
      }
    }
    return { html, text };
  }

  private async persistOrderAndReturn(
    linkedEmailId: string,
    userId: string,
    parsed: ReturnType<typeof parseReceipt>,
  ) {
    if (!parsed) return;

    const order = await this.prisma.order.upsert({
      where: {
        userId_merchantName_externalOrderId: {
          userId,
          merchantName: parsed.merchantName,
          externalOrderId: parsed.externalOrderId,
        },
      },
      create: {
        userId,
        linkedEmailId,
        merchantName: parsed.merchantName,
        merchantDomain: parsed.merchantDomain,
        externalOrderId: parsed.externalOrderId,
        orderDate: parsed.orderDate,
        totalAmount: parsed.totalAmount,
        currency: parsed.currency ?? 'USD',
        rawConfidence: parsed.confidence,
        source: 'email_parse',
      },
      update: {
        totalAmount: parsed.totalAmount,
        rawConfidence: parsed.confidence,
      },
    });

    const isReturnEmail = /return/i.test(parsed.itemSummary ?? '');
    if (isReturnEmail || parsed.returnDeadlineAt) {
      const existing = await this.prisma.return.findFirst({
        where: { orderId: order.id, userId },
      });
      if (!existing) {
        const created = await this.prisma.return.create({
          data: {
            userId,
            orderId: order.id,
            status: parsed.qrPayload ? 'ready_to_ship' : 'draft',
            itemSummary: parsed.itemSummary ?? `Order ${parsed.externalOrderId}`,
            expectedRefundAmount: parsed.totalAmount,
            returnDeadlineAt: parsed.returnDeadlineAt,
            returnWindowDays: parsed.returnWindowDays,
            qrPayload: parsed.qrPayload,
            qrFormat: parsed.qrFormat,
          },
          include: { order: true },
        });
        const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
        await this.notificationScheduler.scheduleForReturn(created, user);
      }
    }
  }
}
