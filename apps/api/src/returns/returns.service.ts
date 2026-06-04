import { Injectable, NotFoundException } from '@nestjs/common';
import { ReturnStatus, User } from '@prisma/client';
import { NotificationSchedulerService } from '../notifications/notification-scheduler.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReturnsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationScheduler: NotificationSchedulerService,
  ) {}

  async listActive(userId: string, daysAhead = 30, statusFilter?: string) {
    const now = new Date();
    const until = new Date(now);
    until.setDate(until.getDate() + daysAhead);

    const statuses: ReturnStatus[] =
      statusFilter === 'all_active' || !statusFilter
        ? ['draft', 'ready_to_ship', 'in_transit', 'delivered_to_merchant', 'awaiting_refund']
        : statusFilter === 'ready_to_ship'
          ? ['ready_to_ship']
          : statusFilter === 'in_transit'
            ? ['in_transit']
            : statusFilter === 'awaiting_refund'
              ? ['awaiting_refund']
              : ['draft', 'ready_to_ship', 'in_transit', 'delivered_to_merchant', 'awaiting_refund'];

    const returns = await this.prisma.return.findMany({
      where: {
        userId,
        status: { in: statuses },
        OR: [
          { returnDeadlineAt: { gte: now, lte: until } },
          { returnDeadlineAt: null },
          { status: { in: ['in_transit', 'awaiting_refund', 'delivered_to_merchant'] } },
        ],
      },
      include: { order: true },
      orderBy: { returnDeadlineAt: 'asc' },
    });

    const data = returns.map((r) => {
      const daysRemaining = r.returnDeadlineAt
        ? Math.ceil((r.returnDeadlineAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
        : null;

      return {
        id: r.id,
        merchant_name: r.order.merchantName,
        item_summary: r.itemSummary,
        status: r.status,
        return_deadline_at: r.returnDeadlineAt?.toISOString() ?? null,
        days_remaining: daysRemaining,
        has_wallet_pass: !!(r.walletAppleSerial || r.walletGoogleObjectId),
        expected_refund_amount: r.expectedRefundAmount
          ? Number(r.expectedRefundAmount)
          : null,
        tracking_number: r.trackingNumber,
      };
    });

    return {
      data,
      meta: { total: data.length, as_of: new Date().toISOString() },
    };
  }

  async findById(userId: string, returnId: string) {
    const ret = await this.prisma.return.findFirst({
      where: { id: returnId, userId },
      include: { order: true, refundStatus: true, trackingLogs: { orderBy: { eventAt: 'desc' } } },
    });
    if (!ret) throw new NotFoundException('Return not found');
    return ret;
  }

  async scheduleNotifications(userId: string, returnId: string) {
    const ret = await this.findById(userId, returnId);
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    await this.notificationScheduler.scheduleForReturn(
      { ...ret, order: ret.order },
      user,
    );
  }

  async snooze(userId: string, returnId: string) {
    const ret = await this.findById(userId, returnId);
    if (ret.snoozeCount >= 2) {
      throw new Error('Maximum snoozes reached');
    }
    const newDeadline = ret.returnDeadlineAt
      ? new Date(ret.returnDeadlineAt.getTime() + 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 24 * 60 * 60 * 1000);

    const updated = await this.prisma.return.update({
      where: { id: returnId },
      data: {
        returnDeadlineAt: newDeadline,
        snoozeCount: { increment: 1 },
      },
      include: { order: true },
    });

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    await this.notificationScheduler.scheduleForReturn(updated, user);
    return updated;
  }

  async confirmRefund(userId: string, returnId: string, amount: number) {
    const ret = await this.findById(userId, returnId);
    await this.prisma.refundStatus.upsert({
      where: { returnId },
      create: {
        returnId,
        userId,
        status: 'completed',
        actualAmount: amount,
        expectedAmount: ret.expectedRefundAmount,
        source: 'user',
        userConfirmedAt: new Date(),
        postedAt: new Date(),
        matchConfidence: 1,
      },
      update: {
        status: 'completed',
        actualAmount: amount,
        source: 'user',
        userConfirmedAt: new Date(),
        postedAt: new Date(),
      },
    });

    await this.prisma.return.update({
      where: { id: returnId },
      data: { status: 'refund_completed' },
    });

    await this.notificationScheduler.cancelForReturn(returnId);
  }
}
