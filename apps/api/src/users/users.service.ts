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
      has_plaid_linked: !!user.plaidAccessTokenEnc,
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

  async exportUserData(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        linkedEmails: {
          select: {
            emailAddress: true,
            provider: true,
            status: true,
            syncWindowDays: true,
            lastSyncAt: true,
            createdAt: true,
          },
        },
        returns: {
          include: {
            order: {
              select: {
                merchantName: true,
                externalOrderId: true,
                orderDate: true,
                totalAmount: true,
                source: true,
              },
            },
            refundStatus: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        parseFeedback: {
          select: { merchantName: true, reason: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return {
      exported_at: new Date().toISOString(),
      user: {
        email: user.email,
        display_name: user.displayName,
        timezone: user.timezone,
        onboarding_completed_at: user.onboardingCompletedAt?.toISOString() ?? null,
        created_at: user.createdAt.toISOString(),
      },
      linked_emails: user.linkedEmails.map((e) => ({
        email_address: e.emailAddress,
        provider: e.provider,
        status: e.status,
        sync_window_days: e.syncWindowDays,
        last_sync_at: e.lastSyncAt?.toISOString() ?? null,
        connected_at: e.createdAt.toISOString(),
      })),
      returns: user.returns.map((r) => ({
        id: r.id,
        merchant_name: r.order.merchantName,
        item_summary: r.itemSummary,
        status: r.status,
        return_deadline_at: r.returnDeadlineAt?.toISOString() ?? null,
        expected_refund_amount: r.expectedRefundAmount
          ? Number(r.expectedRefundAmount)
          : null,
        tracking_number: r.trackingNumber,
        carrier: r.carrier,
        refund: r.refundStatus
          ? {
              status: r.refundStatus.status,
              actual_amount: r.refundStatus.actualAmount
                ? Number(r.refundStatus.actualAmount)
                : null,
              user_confirmed_at: r.refundStatus.userConfirmedAt?.toISOString() ?? null,
            }
          : null,
        created_at: r.createdAt.toISOString(),
      })),
      parse_feedback: user.parseFeedback.map((f) => ({
        merchant_name: f.merchantName,
        reason: f.reason,
        created_at: f.createdAt.toISOString(),
      })),
    };
  }

  async deleteAccount(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.linkedEmail.updateMany({
        where: { userId },
        data: { status: 'revoked' },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          status: 'deleted',
          deletedAt: now,
          expoPushToken: null,
          plaidAccessTokenEnc: null,
          plaidUserId: null,
          email: `deleted+${userId}@returnrider.invalid`,
          externalAuthId: `deleted:${userId}:${user.externalAuthId}`,
          displayName: null,
          onboardingCompletedAt: null,
        },
      }),
    ]);

    return { deleted: true, deleted_at: now.toISOString() };
  }
}
