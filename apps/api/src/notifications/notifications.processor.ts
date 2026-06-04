import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(private readonly prisma: PrismaService) {
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
    });

    if (!ret || ['refund_completed', 'cancelled', 'expired'].includes(ret.status)) {
      return;
    }

    this.logger.log(
      `Push [${job.data.triggerId}] user=${job.data.userId}: ${job.data.message}`,
    );

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
