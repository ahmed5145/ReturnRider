import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from './push.service';

@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pushService: PushService,
  ) {
    super();
  }

  async process(
    job: Job<{
      returnId: string;
      userId: string;
      triggerId: string;
      message: string;
    }>,
  ) {
    if (job.name !== 'send-return-reminder') return;

    const ret = await this.prisma.return.findUnique({
      where: { id: job.data.returnId },
      include: { order: true },
    });

    if (!ret || ['refund_completed', 'cancelled', 'expired'].includes(ret.status)) {
      return;
    }

    const title =
      job.data.triggerId === 'RET_T24H'
        ? 'Return due tomorrow'
        : job.data.triggerId === 'RET_T7'
          ? '7 days left to return'
          : 'Return reminder';

    await this.pushService.sendToUser(job.data.userId, title, job.data.message, {
      returnId: job.data.returnId,
      triggerId: job.data.triggerId,
    });

    this.logger.log(`Push [${job.data.triggerId}] user=${job.data.userId}: ${job.data.message}`);

    await this.prisma.notificationJob.updateMany({
      where: {
        returnId: job.data.returnId,
        triggerId: job.data.triggerId,
        status: 'pending',
      },
      data: { status: 'sent' },
    });
  }
}
