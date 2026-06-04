import { Injectable, Logger } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { TrackingStatus } from '@prisma/client';
import { NotificationSchedulerService } from '../notifications/notification-scheduler.service';
import { PrismaService } from '../prisma/prisma.service';
import { TrackingWebhookPayload } from './dto/tracking-webhook.dto';

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationScheduler: NotificationSchedulerService,
  ) {}

  verifyHmac(rawBody: Buffer, signatureHeader: string | undefined): boolean {
    const secret = process.env.EASYPOST_WEBHOOK_SECRET;
    if (!secret) {
      this.logger.warn('EASYPOST_WEBHOOK_SECRET not set; skipping verification in dev');
      return true;
    }
    if (!signatureHeader?.startsWith('sha256=')) return false;
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    const provided = signatureHeader.slice(7);
    try {
      return timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
    } catch {
      return false;
    }
  }

  mapEasyPostToInternal(payload: Record<string, unknown>): TrackingWebhookPayload | null {
    const result = payload.result as Record<string, unknown> | undefined;
    if (!result) return null;

    const trackingCode = String(result.tracking_code ?? '');
    const status = String(result.status ?? '');
    const statusDetail = String(result.status_detail ?? '');

    let internalStatus = 'in_transit';
    if (
      status === 'delivered' &&
      /return|merchant|destination|receiver/i.test(statusDetail)
    ) {
      internalStatus = 'delivered_to_merchant';
    } else if (status === 'delivered') {
      internalStatus = 'delivered';
    } else if (status === 'pre_transit') {
      internalStatus = 'pre_transit';
    }

    return {
      event_id: String(payload.id ?? cryptoRandomId()),
      event_type: 'tracking.status_updated',
      emitted_at: new Date().toISOString(),
      provider: 'easypost',
      tracker: {
        tracking_number: trackingCode,
        carrier: String((result.carrier as string) ?? 'unknown').toLowerCase(),
        status: internalStatus,
        status_detail: statusDetail,
        event_at: String(result.updated_at ?? new Date().toISOString()),
      },
      raw: { easypost_tracker_id: result.id, easypost_status: status, easypost_status_detail: statusDetail },
    };
  }

  async handleNormalizedWebhook(body: TrackingWebhookPayload) {
    let ret = body.tracker.return_id
      ? await this.prisma.return.findUnique({ where: { id: body.tracker.return_id } })
      : null;

    if (!ret) {
      ret = await this.prisma.return.findFirst({
        where: { trackingNumber: body.tracker.tracking_number },
      });
    }

    if (!ret) {
      this.logger.warn(`No return for tracking ${body.tracker.tracking_number}`);
      return { received: true, matched: false };
    }

    const statusMap: Record<string, TrackingStatus> = {
      pre_transit: 'pre_transit',
      in_transit: 'in_transit',
      out_for_delivery: 'out_for_delivery',
      delivered: 'delivered',
      delivered_to_merchant: 'delivered_to_merchant',
      exception: 'exception',
      return_to_sender: 'return_to_sender',
    };

    const status = statusMap[body.tracker.status] ?? 'unknown';

    await this.prisma.trackingLog.upsert({
      where: {
        returnId_providerEventId: {
          returnId: ret.id,
          providerEventId: body.event_id,
        },
      },
      create: {
        returnId: ret.id,
        trackingNumber: body.tracker.tracking_number,
        carrier: body.tracker.carrier,
        status,
        statusDetail: body.tracker.status_detail,
        locationCity: body.tracker.location?.city,
        locationState: body.tracker.location?.state,
        eventAt: new Date(body.tracker.event_at),
        provider: body.provider,
        providerEventId: body.event_id,
        rawPayload: body.raw as object,
      },
      update: {
        status,
        statusDetail: body.tracker.status_detail,
        eventAt: new Date(body.tracker.event_at),
      },
    });

    if (status === 'delivered_to_merchant') {
      await this.prisma.return.update({
        where: { id: ret.id },
        data: {
          status: 'awaiting_refund',
          deliveredToMerchantAt: new Date(body.tracker.event_at),
        },
      });

      await this.prisma.refundStatus.upsert({
        where: { returnId: ret.id },
        create: {
          returnId: ret.id,
          userId: ret.userId,
          status: 'pending',
          expectedAmount: ret.expectedRefundAmount,
        },
        update: {},
      });

      await this.notificationScheduler.cancelForReturn(ret.id);
    } else if (status === 'in_transit') {
      await this.prisma.return.update({
        where: { id: ret.id },
        data: { status: 'in_transit' },
      });
    }

    return { received: true, matched: true };
  }
}

function cryptoRandomId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
