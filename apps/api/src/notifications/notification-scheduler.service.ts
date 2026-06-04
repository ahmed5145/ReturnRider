import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Return, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface NotificationTrigger {
  triggerId: string;
  offsetMs: number;
  messageTemplate: string;
}

/** T-7 @ 09:00, T-3 @ 09:00, T-24h @ 09:00, T-6h, T+1 overdue */
export const NOTIFICATION_TRIGGERS: NotificationTrigger[] = [
  {
    triggerId: 'RET_T7',
    offsetMs: 7 * 24 * 60 * 60 * 1000,
    messageTemplate: '7 days left to return {item} to {merchant}.',
  },
  {
    triggerId: 'RET_T3',
    offsetMs: 3 * 24 * 60 * 60 * 1000,
    messageTemplate: '3 days left — QR ready in Wallet.',
  },
  {
    triggerId: 'RET_T24H',
    offsetMs: 24 * 60 * 60 * 1000,
    messageTemplate: 'Return due tomorrow for {order_id}.',
  },
  {
    triggerId: 'RET_T6H',
    offsetMs: 6 * 60 * 60 * 1000,
    messageTemplate: 'Final hours: drop off {merchant} return.',
  },
  {
    triggerId: 'RET_OVERDUE',
    offsetMs: -24 * 60 * 60 * 1000,
    messageTemplate: 'Window closed — archive or dispute?',
  },
];

const TERMINAL_STATUSES = [
  'refund_completed',
  'cancelled',
  'expired',
] as const;

@Injectable()
export class NotificationSchedulerService {
  private readonly logger = new Logger(NotificationSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('notifications') private readonly notificationsQueue: Queue,
  ) {}

  async scheduleForReturn(returnRecord: Return & { order?: { merchantName: string; externalOrderId: string } }, user: User) {
    if (!returnRecord.returnDeadlineAt) return;
    if (TERMINAL_STATUSES.includes(returnRecord.status as typeof TERMINAL_STATUSES[number])) {
      return;
    }

    await this.cancelForReturn(returnRecord.id);

    const deadline = returnRecord.returnDeadlineAt.getTime();
    const now = Date.now();
    const discoveryGap = deadline - now;

    for (const trigger of NOTIFICATION_TRIGGERS) {
      if (trigger.triggerId === 'RET_T7' && discoveryGap < 7 * 24 * 60 * 60 * 1000) {
        continue;
      }

      let scheduledAt: Date;
      if (trigger.triggerId === 'RET_OVERDUE') {
        scheduledAt = new Date(deadline + 24 * 60 * 60 * 1000);
        scheduledAt.setHours(10, 0, 0, 0);
      } else {
        scheduledAt = new Date(deadline - trigger.offsetMs);
        scheduledAt.setHours(9, 0, 0, 0);
      }

      if (scheduledAt.getTime() <= now + 60 * 60 * 1000) {
        continue;
      }

      const job = await this.notificationsQueue.add(
        'send-return-reminder',
        {
          returnId: returnRecord.id,
          userId: user.id,
          triggerId: trigger.triggerId,
          message: this.formatMessage(trigger, returnRecord),
        },
        {
          delay: scheduledAt.getTime() - now,
          jobId: `${returnRecord.id}-${trigger.triggerId}`,
        },
      );

      await this.prisma.notificationJob.create({
        data: {
          returnId: returnRecord.id,
          userId: user.id,
          triggerId: trigger.triggerId,
          scheduledAt,
          status: 'pending',
          bullJobId: job.id,
        },
      });
    }
  }

  async cancelForReturn(returnId: string) {
    const jobs = await this.prisma.notificationJob.findMany({
      where: { returnId, status: 'pending' },
    });

    for (const j of jobs) {
      if (j.bullJobId) {
        const bullJob = await this.notificationsQueue.getJob(j.bullJobId);
        if (bullJob) await bullJob.remove();
      }
    }

    await this.prisma.notificationJob.updateMany({
      where: { returnId, status: 'pending' },
      data: { status: 'cancelled' },
    });
  }

  private formatMessage(trigger: NotificationTrigger, ret: Return & { order?: { merchantName: string; externalOrderId: string } }) {
    const merchant = ret.order?.merchantName ?? 'merchant';
    const orderId = ret.order?.externalOrderId ?? '';
    return trigger.messageTemplate
      .replace('{item}', ret.itemSummary)
      .replace('{merchant}', merchant)
      .replace('{order_id}', orderId);
  }
}
