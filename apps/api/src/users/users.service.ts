import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const REFERRAL_SYNC_BONUS_DAYS = 180;

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
      referral_code: await this.ensureReferralCode(user.id),
      referrals_count: await this.prisma.user.count({
        where: { referredByUserId: user.id },
      }),
      referred_by_applied: !!user.referredByUserId,
    };
  }

  private referralCodeFromId(userId: string): string {
    return userId.replace(/-/g, '').slice(0, 8).toUpperCase();
  }

  async ensureReferralCode(userId: string): Promise<string> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { referralCode: true },
    });
    if (user.referralCode) {
      return user.referralCode;
    }
    const code = this.referralCodeFromId(userId);
    await this.prisma.user.update({
      where: { id: userId },
      data: { referralCode: code },
    });
    return code;
  }

  async applyReferralCode(userId: string, rawCode: string) {
    const code = rawCode.trim().toUpperCase();
    if (!code) {
      throw new BadRequestException('Referral code required');
    }

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { referredByUserId: true },
    });
    if (user.referredByUserId) {
      throw new BadRequestException('You already used a referral code');
    }

    const referrer = await this.prisma.user.findFirst({
      where: { referralCode: code, status: 'active' },
    });
    if (!referrer || referrer.id === userId) {
      throw new BadRequestException('Invalid referral code');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { referredByUserId: referrer.id },
      }),
      this.prisma.linkedEmail.updateMany({
        where: { userId: referrer.id },
        data: { syncWindowDays: REFERRAL_SYNC_BONUS_DAYS },
      }),
    ]);

    return {
      applied: true,
      message: `Thanks! Your friend now gets ${REFERRAL_SYNC_BONUS_DAYS}-day email sync.`,
    };
  }

  async setPushToken(userId: string, token: string, timezone?: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        expoPushToken: token,
        ...(timezone ? this.timezoneUpdate(timezone) : {}),
      },
    });
  }

  async setTimezone(userId: string, timezone: string) {
    const update = this.timezoneUpdate(timezone);
    if (!update) return;
    await this.prisma.user.update({
      where: { id: userId },
      data: update,
    });
  }

  private timezoneUpdate(timezone: string): { timezone: string } | null {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return { timezone };
    } catch {
      return null;
    }
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

  async resetOnboarding(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { onboardingCompletedAt: null },
    });
    return { reset: true };
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
