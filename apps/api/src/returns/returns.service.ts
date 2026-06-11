import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ReturnStatus } from '@prisma/client';
import { getMerchantReturnUrl, getMerchantSearchUrl } from '../common/merchant-portals';
import { guessCarrier } from '../common/carrier-guess';
import { computeSnoozeDeadline } from '../common/snooze-utils';
import { NotificationSchedulerService } from '../notifications/notification-scheduler.service';
import { PrismaService } from '../prisma/prisma.service';
import { ParseBlocklistService } from '../parsers/parse-blocklist.service';
import { parseReceiptFromOcrText } from '../parsers/receipt-text.parser';

export interface ManualReturnDto {
  merchant_name: string;
  external_order_id: string;
  item_summary: string;
  return_deadline_at?: string;
  return_window_days?: number;
  expected_refund_amount?: number;
  qr_payload?: string;
}

@Injectable()
export class ReturnsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationScheduler: NotificationSchedulerService,
    private readonly parseBlocklist: ParseBlocklistService,
  ) {}

  private async finalizeReturn(
    userId: string,
    returnRecord: Awaited<ReturnType<typeof this.createReturnRecord>>,
  ) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    await this.notificationScheduler.scheduleForReturn(
      { ...returnRecord, order: returnRecord.order },
      user,
    );
    return returnRecord;
  }

  private async createReturnRecord(
    userId: string,
    data: {
      merchantName: string;
      externalOrderId: string;
      itemSummary: string;
      returnDeadlineAt?: Date;
      returnWindowDays?: number;
      expectedRefundAmount?: number;
      qrPayload?: string;
      source: 'manual' | 'email_parse';
    },
  ) {
    const order = await this.prisma.order.upsert({
      where: {
        userId_merchantName_externalOrderId: {
          userId,
          merchantName: data.merchantName,
          externalOrderId: data.externalOrderId,
        },
      },
      create: {
        userId,
        merchantName: data.merchantName,
        externalOrderId: data.externalOrderId,
        totalAmount: data.expectedRefundAmount,
        source: data.source,
      },
      update: {
        totalAmount: data.expectedRefundAmount,
      },
    });

    const existing = await this.prisma.return.findFirst({
      where: { orderId: order.id, userId },
    });
    if (existing) {
      if (existing.status === ReturnStatus.draft && data.source === 'manual') {
        let deadline = data.returnDeadlineAt;
        if (!deadline && data.returnWindowDays) {
          deadline = new Date();
          deadline.setDate(deadline.getDate() + data.returnWindowDays);
        }
        return this.prisma.return.update({
          where: { id: existing.id },
          data: {
            status: ReturnStatus.ready_to_ship,
            itemSummary: data.itemSummary,
            expectedRefundAmount: data.expectedRefundAmount,
            returnDeadlineAt: deadline,
            returnWindowDays: data.returnWindowDays ?? 30,
          },
          include: { order: true },
        });
      }
      return this.prisma.return.findFirstOrThrow({
        where: { id: existing.id },
        include: { order: true },
      });
    }

    let deadline = data.returnDeadlineAt;
    if (!deadline && data.returnWindowDays) {
      deadline = new Date();
      deadline.setDate(deadline.getDate() + data.returnWindowDays);
    }

    const status =
      data.source === 'manual' || data.qrPayload
        ? ReturnStatus.ready_to_ship
        : ReturnStatus.draft;

    return this.prisma.return.create({
      data: {
        userId,
        orderId: order.id,
        status,
        itemSummary: data.itemSummary,
        expectedRefundAmount: data.expectedRefundAmount,
        returnDeadlineAt: deadline,
        returnWindowDays: data.returnWindowDays ?? 30,
        qrPayload: data.qrPayload,
        qrFormat: data.qrPayload ? 'QR_CODE' : undefined,
      },
      include: { order: true },
    });
  }

  async createManual(userId: string, dto: ManualReturnDto) {
    const ret = await this.createReturnRecord(userId, {
      merchantName: dto.merchant_name,
      externalOrderId: dto.external_order_id,
      itemSummary: dto.item_summary,
      returnDeadlineAt: dto.return_deadline_at ? new Date(dto.return_deadline_at) : undefined,
      returnWindowDays: dto.return_window_days ?? 30,
      expectedRefundAmount: dto.expected_refund_amount,
      qrPayload: dto.qr_payload,
      source: 'manual',
    });
    await this.finalizeReturn(userId, ret);
    return ret;
  }

  async parseReceiptText(userId: string, text: string) {
    const parsed = parseReceiptFromOcrText(text);
    if (!parsed) {
      return { parsed: null, message: 'Could not extract order details. Use manual entry.' };
    }
    return {
      parsed: {
        merchant_name: parsed.merchantName,
        external_order_id: parsed.externalOrderId,
        item_summary: parsed.itemSummary ?? 'Receipt item',
        expected_refund_amount: parsed.totalAmount,
        return_window_days: parsed.returnWindowDays ?? 30,
        confidence: parsed.confidence,
      },
    };
  }

  async createFromParsedText(userId: string, text: string) {
    const { parsed } = await this.parseReceiptText(userId, text);
    if (!parsed) {
      throw new BadRequestException('Unable to parse receipt text');
    }
    return this.createManual(userId, {
      merchant_name: parsed.merchant_name,
      external_order_id: parsed.external_order_id,
      item_summary: parsed.item_summary,
      expected_refund_amount: parsed.expected_refund_amount,
      return_window_days: parsed.return_window_days,
    });
  }

  async getStats(userId: string) {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const activeStatuses: ReturnStatus[] = [
      'ready_to_ship',
      'in_transit',
      'delivered_to_merchant',
      'awaiting_refund',
    ];

    const [activeReturns, completedCount, refunds] = await Promise.all([
      this.prisma.return.findMany({
        where: { userId, status: { in: activeStatuses } },
        select: { expectedRefundAmount: true },
      }),
      this.prisma.return.count({
        where: { userId, status: 'refund_completed' },
      }),
      this.prisma.refundStatus.findMany({
        where: {
          userId,
          status: 'completed',
          userConfirmedAt: { not: null },
        },
        select: { actualAmount: true, userConfirmedAt: true },
      }),
    ]);

    const atRiskAmount = activeReturns.reduce(
      (sum, r) => sum + (r.expectedRefundAmount ? Number(r.expectedRefundAmount) : 0),
      0,
    );

    const refundedAllTime = refunds.reduce(
      (sum, r) => sum + (r.actualAmount ? Number(r.actualAmount) : 0),
      0,
    );

    const refundedYtd = refunds
      .filter((r) => r.userConfirmedAt && r.userConfirmedAt >= yearStart)
      .reduce((sum, r) => sum + (r.actualAmount ? Number(r.actualAmount) : 0), 0);

    return {
      at_risk_amount: Math.round(atRiskAmount * 100) / 100,
      active_count: activeReturns.length,
      refunded_ytd: Math.round(refundedYtd * 100) / 100,
      refunded_all_time: Math.round(refundedAllTime * 100) / 100,
      completed_count: completedCount,
    };
  }

  async listCompleted(userId: string, limit = 50) {
    const returns = await this.prisma.return.findMany({
      where: { userId, status: 'refund_completed' },
      include: { order: true, refundStatus: true },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    const data = returns.map((r) => ({
      id: r.id,
      merchant_name: r.order.merchantName,
      item_summary: r.itemSummary,
      status: r.status,
      return_deadline_at: r.returnDeadlineAt?.toISOString() ?? null,
      days_remaining: null,
      has_wallet_pass: !!(r.walletAppleSerial || r.walletGoogleObjectId),
      expected_refund_amount: r.expectedRefundAmount
        ? Number(r.expectedRefundAmount)
        : null,
      refund_amount: r.refundStatus?.actualAmount
        ? Number(r.refundStatus.actualAmount)
        : null,
      refunded_at: r.refundStatus?.userConfirmedAt?.toISOString() ?? null,
      tracking_number: r.trackingNumber,
    }));

    return {
      data,
      meta: { total: data.length, as_of: new Date().toISOString() },
    };
  }

  async listActive(userId: string, _daysAhead = 180, statusFilter?: string) {
    const now = new Date();

    const statuses: ReturnStatus[] =
      statusFilter === 'all_active' || !statusFilter
        ? ['ready_to_ship', 'in_transit', 'delivered_to_merchant', 'awaiting_refund']
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
          { returnDeadlineAt: null },
          { returnDeadlineAt: { gte: now } },
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

  private formatReturnDetail(
    ret: {
      id: string;
      itemSummary: string;
      status: string;
      returnDeadlineAt: Date | null;
      expectedRefundAmount: unknown;
      snoozeCount: number;
      trackingNumber: string | null;
      returnLabelUrl: string | null;
      carrier: string | null;
      walletAppleSerial: string | null;
      walletGoogleObjectId: string | null;
      order: { merchantName: string; externalOrderId: string };
      refundStatus?: {
        status: string;
        actualAmount: unknown;
        userConfirmedAt: Date | null;
      } | null;
      trackingLogs?: Array<{
        status: string;
        statusDetail: string | null;
        carrier: string;
        eventAt: Date;
        locationCity: string | null;
        locationState: string | null;
      }>;
    },
  ) {
    const now = new Date();
    const daysRemaining = ret.returnDeadlineAt
      ? Math.ceil((ret.returnDeadlineAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
      : null;

    return {
      id: ret.id,
      merchant_name: ret.order.merchantName,
      item_summary: ret.itemSummary,
      status: ret.status,
      return_deadline_at: ret.returnDeadlineAt?.toISOString() ?? null,
      days_remaining: daysRemaining,
      expected_refund_amount: ret.expectedRefundAmount
        ? Number(ret.expectedRefundAmount)
        : null,
      snooze_count: ret.snoozeCount,
      snoozes_remaining: Math.max(0, 2 - ret.snoozeCount),
      has_wallet_pass: !!(ret.walletAppleSerial || ret.walletGoogleObjectId),
      tracking_number: ret.trackingNumber,
      return_label_url: ret.returnLabelUrl,
      carrier: ret.carrier,
      tracking_events: (ret.trackingLogs ?? []).map((log) => ({
        status: log.status,
        status_detail: log.statusDetail,
        carrier: log.carrier,
        event_at: log.eventAt.toISOString(),
        location:
          log.locationCity || log.locationState
            ? [log.locationCity, log.locationState].filter(Boolean).join(', ')
            : null,
      })),
      order: {
        merchant_name: ret.order.merchantName,
        external_order_id: ret.order.externalOrderId,
      },
      refund_status: ret.refundStatus
        ? {
            status: ret.refundStatus.status,
            actual_amount: ret.refundStatus.actualAmount
              ? Number(ret.refundStatus.actualAmount)
              : null,
            user_confirmed_at: ret.refundStatus.userConfirmedAt?.toISOString() ?? null,
          }
        : null,
      merchant_return_url:
        getMerchantReturnUrl(ret.order.merchantName) ??
        getMerchantSearchUrl(ret.order.merchantName),
      merchant_portal_curated: !!getMerchantReturnUrl(ret.order.merchantName),
    };
  }

  async loadReturn(userId: string, returnId: string) {
    const ret = await this.prisma.return.findFirst({
      where: { id: returnId, userId },
      include: {
        order: true,
        refundStatus: true,
        trackingLogs: { orderBy: { eventAt: 'desc' } },
      },
    });
    if (!ret) throw new NotFoundException('Return not found');
    return ret;
  }

  async findById(userId: string, returnId: string) {
    return this.formatReturnDetail(await this.loadReturn(userId, returnId));
  }

  async scheduleNotifications(userId: string, returnId: string) {
    const ret = await this.loadReturn(userId, returnId);
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    await this.notificationScheduler.scheduleForReturn(
      { ...ret, order: ret.order },
      user,
    );
  }

  async snooze(
    userId: string,
    returnId: string,
    mode: '24h' | 'weekend' = '24h',
  ) {
    const ret = await this.loadReturn(userId, returnId);
    if (ret.snoozeCount >= 2) {
      throw new BadRequestException('Maximum snoozes reached');
    }
    const newDeadline = computeSnoozeDeadline(ret.returnDeadlineAt, mode);

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
    return this.formatReturnDetail(updated);
  }

  async confirmRefund(userId: string, returnId: string, amount: number) {
    const ret = await this.loadReturn(userId, returnId);
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

  async deleteReturn(userId: string, returnId: string) {
    const ret = await this.loadReturn(userId, returnId);
    const deletable: ReturnStatus[] = [
      ReturnStatus.draft,
      ReturnStatus.cancelled,
      ReturnStatus.expired,
      ReturnStatus.refund_completed,
    ];
    if (!deletable.includes(ret.status)) {
      throw new BadRequestException(
        'Only draft, completed, cancelled, or expired returns can be removed',
      );
    }

    await this.notificationScheduler.cancelForReturn(returnId);
    await this.prisma.return.delete({ where: { id: returnId } });
    return { deleted: true };
  }

  async addTracking(
    userId: string,
    returnId: string,
    trackingNumber: string,
    carrier?: string,
  ) {
    const ret = await this.loadReturn(userId, returnId);
    const resolvedCarrier = carrier ?? guessCarrier(trackingNumber);

    const updated = await this.prisma.return.update({
      where: { id: returnId },
      data: {
        trackingNumber,
        carrier: resolvedCarrier,
        status: ret.status === 'ready_to_ship' ? 'in_transit' : ret.status,
        droppedOffAt: ret.droppedOffAt ?? new Date(),
      },
      include: {
        order: true,
        refundStatus: true,
        trackingLogs: { orderBy: { eventAt: 'desc' } },
      },
    });

    await this.prisma.trackingLog.create({
      data: {
        returnId,
        trackingNumber,
        carrier: resolvedCarrier,
        status: 'in_transit',
        statusDetail: 'Tracking added by user',
        eventAt: new Date(),
        provider: 'manual',
        providerEventId: `manual-${Date.now()}`,
      },
    });

    return this.formatReturnDetail(updated);
  }

  async reportMisparsed(
    userId: string,
    returnId: string,
    reason: 'not_a_return' | 'wrong_deadline' | 'wrong_merchant',
  ) {
    const ret = await this.loadReturn(userId, returnId);

    await this.prisma.parseFeedback.create({
      data: {
        userId,
        returnId,
        merchantName: ret.order.merchantName,
        emailSubject: ret.order.sourceEmailSubject,
        reason,
      },
    });

    if (reason === 'not_a_return') {
      this.parseBlocklist.invalidateUser(userId);
    }

    const removable: ReturnStatus[] = [
      ReturnStatus.draft,
      ReturnStatus.ready_to_ship,
    ];
    if (reason === 'not_a_return' && removable.includes(ret.status)) {
      await this.notificationScheduler.cancelForReturn(returnId);
      await this.prisma.return.delete({ where: { id: returnId } });
      return { reported: true, removed: true };
    }

    return { reported: true, removed: false };
  }
}