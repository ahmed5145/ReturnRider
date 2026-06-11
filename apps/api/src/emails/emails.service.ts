import {
  ConflictException,
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { EmailProvider } from '@prisma/client';
import { CryptoService } from '../common/crypto.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailConnectDto } from './dto/email-connect.dto';
import { EmailSyncService } from './email-sync.service';
import { GMAIL_READONLY_SCOPE, GmailService } from './gmail.service';

@Injectable()
export class EmailsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly gmail: GmailService,
    private readonly emailSync: EmailSyncService,
  ) {}

  async connect(userId: string, dto: EmailConnectDto) {
    if (dto.provider !== 'gmail') {
      throw new BadRequestException(`Provider ${dto.provider} not yet supported in API; use email-worker`);
    }

    const tokens = await this.gmail.exchangeCode(
      dto.authorization_code,
      dto.redirect_uri,
      dto.code_verifier,
    );

    const emailAddress =
      dto.email_hint ?? (await this.gmail.getProfileEmail(tokens.refresh_token!));

    const existing = await this.prisma.linkedEmail.findFirst({
      where: { emailAddress, NOT: { userId } },
    });
    if (existing) {
      throw new ConflictException('Email already linked to another user');
    }

    const { ciphertext, keyId } = this.crypto.encrypt(tokens.refresh_token!);

    const syncWindowDays = dto.sync_days === 180 ? 180 : 90;

    const linked = await this.prisma.linkedEmail.upsert({
      where: {
        userId_emailAddress: { userId, emailAddress },
      },
      create: {
        userId,
        provider: EmailProvider.gmail,
        emailAddress,
        status: 'connected',
        oauthRefreshEnc: ciphertext,
        oauthRefreshKeyId: keyId,
        scopesGranted: [GMAIL_READONLY_SCOPE, 'openid', 'email'],
        syncWindowDays,
      },
      update: {
        oauthRefreshEnc: ciphertext,
        oauthRefreshKeyId: keyId,
        status: 'connected',
        scopesGranted: [GMAIL_READONLY_SCOPE, 'openid', 'email'],
        syncWindowDays,
      },
    });

    const job = await this.emailSync.enqueueSync(linked.id);

    return {
      linked_email_id: linked.id,
      email_address: emailAddress,
      provider: dto.provider,
      status: 'syncing' as const,
      sync_job_id: job.id ?? String(job.id),
      scopes_granted: linked.scopesGranted,
      sync_window_days: syncWindowDays,
    };
  }

  async listLinked(userId: string) {
    const emails = await this.prisma.linkedEmail.findMany({
      where: { userId, status: { not: 'revoked' } },
      orderBy: { createdAt: 'desc' },
    });

    const data = await Promise.all(
      emails.map(async (e) => {
        const reviewVisibleSince = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const [reviewPendingCount, returnsFromInbox] = await Promise.all([
          this.prisma.parseReviewQueue.count({
            where: {
              linkedEmailId: e.id,
              userId,
              status: 'pending',
              createdAt: { gte: reviewVisibleSince },
            },
          }),
          this.prisma.order.count({
            where: { linkedEmailId: e.id, userId },
          }),
        ]);
        return {
          id: e.id,
          email_address: e.emailAddress,
          provider: e.provider,
          status: e.status,
          sync_window_days: e.syncWindowDays,
          last_sync_at: e.lastSyncAt?.toISOString() ?? null,
          last_error: e.lastError,
          last_sync_messages_scanned: e.lastSyncMessagesScanned,
          last_sync_returns_created: e.lastSyncReturnsCreated,
          last_sync_review_queued: e.lastSyncReviewQueued,
          review_pending_count: reviewPendingCount,
          returns_from_inbox_count: returnsFromInbox,
        };
      }),
    );

    return { data };
  }

  async triggerSyncAll(userId: string) {
    return this.emailSync.enqueueUserLinkedSyncs(userId);
  }

  async triggerSync(userId: string, linkedEmailId: string) {
    const linked = await this.prisma.linkedEmail.findFirst({
      where: { id: linkedEmailId, userId, status: { not: 'revoked' } },
    });
    if (!linked) throw new NotFoundException('Linked email not found');
    if (linked.status === 'syncing') {
      throw new BadRequestException('Sync already in progress');
    }

    const job = await this.emailSync.enqueueSync(linkedEmailId);
    await this.prisma.linkedEmail.update({
      where: { id: linkedEmailId },
      data: { status: 'syncing' },
    });

    return {
      status: 'syncing' as const,
      sync_job_id: job.id ?? String(job.id),
    };
  }

  async disconnect(userId: string, linkedEmailId: string) {
    const linked = await this.prisma.linkedEmail.findFirst({
      where: { id: linkedEmailId, userId },
    });
    if (!linked) {
      throw new BadRequestException('Linked email not found');
    }
    await this.prisma.linkedEmail.update({
      where: { id: linkedEmailId },
      data: { status: 'revoked' },
    });
    return { disconnected: true };
  }
}
