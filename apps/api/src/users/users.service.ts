import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        linkedEmails: {
          select: {
            id: true,
            emailAddress: true,
            provider: true,
            status: true,
            syncWindowDays: true,
            lastSyncAt: true,
            lastError: true,
            lastSyncMessagesScanned: true,
            lastSyncReturnsCreated: true,
            lastSyncReviewQueued: true,
          },
        },
        _count: { select: { returns: true } },
      },
    });

    const reviewPendingCount = await this.prisma.parseReviewQueue.count({
      where: { userId, status: 'pending' },
    });

    const anySyncing = user.linkedEmails.some((e) => e.status === 'syncing');

    return {
      id: user.id,
      email: user.email,
      display_name: user.displayName,
      onboarding_completed: !!user.onboardingCompletedAt,
      linked_emails: user.linkedEmails.map((e) => ({
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
      })),
      returns_count: user._count.returns,
      review_pending_count: reviewPendingCount,
      inbox_syncing: anySyncing,
      has_push_token: !!user.expoPushToken,
    };
  }

  async setPushToken(userId: string, token: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { expoPushToken: token },
    });
  }

  async completeOnboarding(userId: string, displayName?: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        onboardingCompletedAt: new Date(),
        ...(displayName ? { displayName } : {}),
      },
    });
  }
}
