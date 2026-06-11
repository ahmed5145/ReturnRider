import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Prisma } from '@prisma/client';
import { CryptoService } from '../common/crypto.service';
import {
  classifyEmailIntent,
  intentCreatesReturn,
  isCommerceEmail,
  isReturnRelatedSubject,
} from '../parsers/commerce-classifier';
import {
  addReturnWindow,
  parseGmailInternalDate,
} from '../parsers/merchants/parser-utils';
import { parseReceipt } from '../parsers/merchants';
import { ParsedReceipt } from '../parsers/types';
import { NotificationSchedulerService } from '../notifications/notification-scheduler.service';
import { PrismaService } from '../prisma/prisma.service';
import { explainParseConfidence } from '../common/parse-confidence';
import { ConfirmParseReviewDto } from './dto/confirm-parse-review.dto';
import { ParseBlocklistService } from '../parsers/parse-blocklist.service';
import { GmailService } from './gmail.service';

const REVIEW_THRESHOLD = 0.85;
const REVIEW_AUTO_DISMISS_DAYS = 7;

@Injectable()
export class EmailSyncService {
  private readonly logger = new Logger(EmailSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly gmail: GmailService,
    private readonly notificationScheduler: NotificationSchedulerService,
    private readonly parseBlocklist: ParseBlocklistService,
    @InjectQueue('email-sync') private readonly emailSyncQueue: Queue,
  ) {}

  async enqueueSync(linkedEmailId: string) {
    return this.emailSyncQueue.add(
      'sync-linked-email',
      { linkedEmailId },
      { jobId: `sync-${linkedEmailId}-${Date.now()}` },
    );
  }

  async enqueueAllLinkedSyncs() {
    await this.dismissStaleReviews();
    const inboxes = await this.prisma.linkedEmail.findMany({
      where: { status: { in: ['connected', 'error'] } },
      select: { id: true },
    });
    for (const inbox of inboxes) {
      await this.enqueueSync(inbox.id);
    }
    return { queued: inboxes.length };
  }

  async enqueueUserLinkedSyncs(userId: string) {
    const inboxes = await this.prisma.linkedEmail.findMany({
      where: { userId, status: { in: ['connected', 'error'] } },
      select: { id: true },
    });
    for (const inbox of inboxes) {
      await this.enqueueSync(inbox.id);
      await this.prisma.linkedEmail.update({
        where: { id: inbox.id },
        data: { status: 'syncing' },
      });
    }
    return { queued: inboxes.length };
  }

  /** Passive review queue: auto-dismiss items older than 7 days. */
  async dismissStaleReviews(): Promise<number> {
    const cutoff = new Date(Date.now() - REVIEW_AUTO_DISMISS_DAYS * 24 * 60 * 60 * 1000);
    const result = await this.prisma.parseReviewQueue.updateMany({
      where: { status: 'pending', createdAt: { lt: cutoff } },
      data: { status: 'dismissed' },
    });
    if (result.count > 0) {
      this.logger.log(`Auto-dismissed ${result.count} stale parse review item(s)`);
    }
    return result.count;
  }

  async syncLinkedEmail(linkedEmailId: string) {
    const linked = await this.prisma.linkedEmail.findUnique({
      where: { id: linkedEmailId },
    });
    if (!linked || linked.status === 'revoked') return;

    await this.prisma.linkedEmail.update({
      where: { id: linkedEmailId },
      data: { status: 'syncing' },
    });

    let messagesScanned = 0;
    let returnsCreated = 0;
    let reviewQueued = 0;

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
          const outcome = await this.processMessage(
            linkedEmailId,
            linked.userId,
            refreshToken,
            msg.id,
          );
          messagesScanned++;
          if (outcome.reviewQueued) reviewQueued++;
          if (outcome.returnCreated) returnsCreated++;
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
          lastSyncMessagesScanned: messagesScanned,
          lastSyncReturnsCreated: returnsCreated,
          lastSyncReviewQueued: reviewQueued,
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

  async listPendingReviews(userId: string) {
    await this.dismissStaleReviews();
    const items = await this.prisma.parseReviewQueue.findMany({
      where: { userId, status: 'pending' },
      orderBy: { createdAt: 'desc' },
    });
    return {
      data: items.map((item) => ({
        id: item.id,
        linked_email_id: item.linkedEmailId,
        message_id: item.messageId,
        merchant_guess: item.merchantGuess,
        raw_snippet: item.rawSnippet,
        confidence: Number(item.confidence),
        confidence_reason: explainParseConfidence(
          Number(item.confidence),
          item.merchantGuess,
          null,
        ),
        status: item.status,
        created_at: item.createdAt.toISOString(),
      })),
    };
  }

  async dismissAllReviews(userId: string) {
    const result = await this.prisma.parseReviewQueue.updateMany({
      where: { userId, status: 'pending' },
      data: { status: 'dismissed' },
    });
    return { dismissed: result.count };
  }

  async dismissReview(userId: string, reviewId: string) {
    const item = await this.prisma.parseReviewQueue.findFirst({
      where: { id: reviewId, userId, status: 'pending' },
    });
    if (!item) throw new NotFoundException('Review item not found');
    await this.prisma.parseReviewQueue.update({
      where: { id: reviewId },
      data: { status: 'dismissed' },
    });
    return { dismissed: true };
  }

  async confirmReview(userId: string, reviewId: string, dto: ConfirmParseReviewDto) {
    const item = await this.prisma.parseReviewQueue.findFirst({
      where: { id: reviewId, userId, status: 'pending' },
    });
    if (!item) throw new NotFoundException('Review item not found');

    const linked = await this.prisma.linkedEmail.findFirst({
      where: { id: item.linkedEmailId, userId },
    });
    if (!linked) throw new BadRequestException('Linked inbox not found');

    const refreshToken = this.crypto.decrypt(linked.oauthRefreshEnc);
    let parsed = await this.fetchAndParseMessage(refreshToken, item.messageId);
    if (!parsed) {
      parsed = {
        merchantName: item.merchantGuess ?? 'Unknown',
        externalOrderId: `review-${item.messageId.slice(0, 12)}`,
        itemSummary: item.rawSnippet ?? 'Return receipt',
        confidence: 1,
        returnWindowDays: 30,
        returnDeadlineAt: addReturnWindow(new Date(), 30),
      };
    }

    const merged: ParsedReceipt = {
      ...parsed,
      merchantName: dto.merchant_name ?? parsed.merchantName,
      externalOrderId: dto.external_order_id ?? parsed.externalOrderId,
      itemSummary: dto.item_summary ?? parsed.itemSummary,
      totalAmount: dto.expected_refund_amount ?? parsed.totalAmount,
      returnDeadlineAt: dto.return_deadline_at
        ? new Date(dto.return_deadline_at)
        : parsed.returnDeadlineAt,
      confidence: 1,
    };

    if (!merged.externalOrderId) {
      merged.externalOrderId = `review-${item.messageId.slice(0, 12)}`;
    }
    if (!merged.returnDeadlineAt) {
      merged.returnDeadlineAt = addReturnWindow(
        merged.orderDate ?? new Date(),
        merged.returnWindowDays ?? 30,
      );
    }

    const returnCreated = await this.persistOrderAndReturn(
      item.linkedEmailId,
      userId,
      merged,
      { forceReturn: true, sourceEmailSubject: item.rawSnippet ?? undefined },
    );

    await this.prisma.parseReviewQueue.update({
      where: { id: reviewId },
      data: { status: 'confirmed' },
    });

    return { confirmed: true, return_created: returnCreated };
  }

  private async fetchAndParseMessage(
    refreshToken: string,
    messageId: string,
  ): Promise<ParsedReceipt | null> {
    const raw = await this.gmail.getMessage(refreshToken, messageId);
    const headers = raw.payload?.headers ?? [];
    const from = headers.find((h) => h.name?.toLowerCase() === 'from')?.value ?? '';
    const subject = headers.find((h) => h.name?.toLowerCase() === 'subject')?.value ?? '';
    const { html, text } = this.extractBodies(raw.payload);
    const emailDate = parseGmailInternalDate(raw.internalDate);
    return parseReceipt({ from, subject, htmlBody: html, textBody: text, emailDate });
  }

  private async processMessage(
    linkedEmailId: string,
    userId: string,
    refreshToken: string,
    messageId: string,
  ): Promise<{ reviewQueued: boolean; returnCreated: boolean }> {
    const raw = await this.gmail.getMessage(refreshToken, messageId);
    const headers = raw.payload?.headers ?? [];
    const from = headers.find((h) => h.name?.toLowerCase() === 'from')?.value ?? '';
    const subject = headers.find((h) => h.name?.toLowerCase() === 'subject')?.value ?? '';

    if (!isCommerceEmail(from, subject)) {
      return { reviewQueued: false, returnCreated: false };
    }

    const { html, text } = this.extractBodies(raw.payload);
    const emailDate = parseGmailInternalDate(raw.internalDate);
    const parsed = parseReceipt({ from, subject, htmlBody: html, textBody: text, emailDate });
    if (!parsed) {
      return { reviewQueued: false, returnCreated: false };
    }

    // Blocklist applies only to generic-parser mail (e.g. Kohl's promos). Dedicated merchants
    // (Amazon, Target, …) are never skipped — marking one bad email must not block real orders.
    if (
      parsed.parserTier === 'generic' &&
      (await this.parseBlocklist.isMerchantBlocked(userId, parsed.merchantName))
    ) {
      return { reviewQueued: false, returnCreated: false };
    }

    // Dedicated merchant parsers auto-create; queue only generic / low-confidence unknowns.
    if (parsed.parserTier === 'merchant') {
      const returnCreated = await this.persistOrderAndReturn(linkedEmailId, userId, parsed, {
        sourceEmailSubject: subject,
      });
      return { reviewQueued: false, returnCreated };
    }

    if (parsed.confidence < REVIEW_THRESHOLD) {
      if (!isReturnRelatedSubject(subject)) {
        return { reviewQueued: false, returnCreated: false };
      }
      const existing = await this.prisma.parseReviewQueue.findUnique({
        where: { linkedEmailId_messageId: { linkedEmailId, messageId } },
      });
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
          rawSnippet: subject,
        },
      });
      return { reviewQueued: !existing || existing.status === 'pending', returnCreated: false };
    }

    const returnCreated = await this.persistOrderAndReturn(linkedEmailId, userId, parsed, {
      sourceEmailSubject: subject,
    });
    return { reviewQueued: false, returnCreated };
  }

  private extractBodies(payload: {
    body?: { data?: string | null };
    parts?: { mimeType?: string | null; body?: { data?: string | null }; parts?: unknown[] }[];
  } | null | undefined): { html: string; text: string } {
    let html = '';
    let text = '';

    const walk = (part: {
      mimeType?: string | null;
      body?: { data?: string | null };
      parts?: unknown[];
    }) => {
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
    parsed: ParsedReceipt,
    options?: { forceReturn?: boolean; sourceEmailSubject?: string },
  ): Promise<boolean> {
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
        sourceEmailSubject: options?.sourceEmailSubject,
      },
      update: {
        totalAmount: parsed.totalAmount,
        rawConfidence: parsed.confidence,
        ...(options?.sourceEmailSubject
          ? { sourceEmailSubject: options.sourceEmailSubject }
          : {}),
      },
    });

    const intent = parsed.emailIntent ?? classifyEmailIntent(parsed.itemSummary ?? '');
    const isReturnEmail = /return|refund|rma/i.test(parsed.itemSummary ?? '');
    const shouldCreateReturn =
      options?.forceReturn ||
      isReturnEmail ||
      (intentCreatesReturn(intent) && !!parsed.returnDeadlineAt);
    if (!shouldCreateReturn) {
      return false;
    }

    const existing = await this.prisma.return.findFirst({
      where: { orderId: order.id, userId },
    });
    if (existing) return false;

    let returnDeadlineAt = parsed.returnDeadlineAt;
    if (!returnDeadlineAt && (options?.forceReturn || isReturnEmail)) {
      returnDeadlineAt = addReturnWindow(
        parsed.orderDate ?? new Date(),
        parsed.returnWindowDays ?? 30,
      );
    }

    const status =
      parsed.qrPayload || parsed.returnLabelUrl || options?.forceReturn
        ? 'ready_to_ship'
        : 'draft';

    const created = await this.prisma.return.create({
      data: {
        userId,
        orderId: order.id,
        status,
        itemSummary: parsed.itemSummary ?? `Order ${parsed.externalOrderId}`,
        expectedRefundAmount: parsed.totalAmount,
        returnDeadlineAt,
        returnWindowDays: parsed.returnWindowDays,
        qrPayload: parsed.qrPayload,
        qrFormat: parsed.qrFormat,
        returnLabelUrl: parsed.returnLabelUrl,
      },
      include: { order: true },
    });
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    await this.notificationScheduler.scheduleForReturn(created, user);
    return true;
  }
}
