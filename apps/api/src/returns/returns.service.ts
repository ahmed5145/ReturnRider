import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ReturnStatus } from '@prisma/client';
import { NotificationSchedulerService } from '../notifications/notification-scheduler.service';
import { PrismaService } from '../prisma/prisma.service';
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

    return this.prisma.return.create({
      data: {
        userId,
        orderId: order.id,
        status: data.qrPayload ? ReturnStatus.ready_to_ship : ReturnStatus.draft,
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

  async listActive(userId: string, daysAhead = 30, statusFilter?: string) {