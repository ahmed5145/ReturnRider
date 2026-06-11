import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

function syncIntervalMs(): number {
  const minutes = Number(process.env.EMAIL_SYNC_INTERVAL_MINUTES ?? '5');
  if (!Number.isFinite(minutes) || minutes < 1) {
    return 5 * 60 * 1000;
  }
  return Math.min(minutes, 60) * 60 * 1000;
}

@Injectable()
export class EmailSyncScheduler implements OnModuleInit {
  private readonly logger = new Logger(EmailSyncScheduler.name);

  constructor(@InjectQueue('email-sync') private readonly emailSyncQueue: Queue) {}

  async onModuleInit() {
    if (process.env.EMAIL_SYNC_SCHEDULER_ENABLED === 'false') {
      this.logger.log('Incremental email sync scheduler disabled');
      return;
    }

    const intervalMs = syncIntervalMs();
    await this.emailSyncQueue.add(
      'sync-all-inboxes',
      {},
      {
        repeat: { every: intervalMs },
        jobId: 'repeat-sync-all-inboxes',
      },
    );
    this.logger.log(`Incremental email sync scheduled every ${intervalMs / 60000} minutes`);
  }
}
