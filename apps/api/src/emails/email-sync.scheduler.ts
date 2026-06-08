import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

const SYNC_INTERVAL_MS = 15 * 60 * 1000;

@Injectable()
export class EmailSyncScheduler implements OnModuleInit {
  private readonly logger = new Logger(EmailSyncScheduler.name);

  constructor(@InjectQueue('email-sync') private readonly emailSyncQueue: Queue) {}

  async onModuleInit() {
    if (process.env.EMAIL_SYNC_SCHEDULER_ENABLED === 'false') {
      this.logger.log('Incremental email sync scheduler disabled');
      return;
    }

    await this.emailSyncQueue.add(
      'sync-all-inboxes',
      {},
      {
        repeat: { every: SYNC_INTERVAL_MS },
        jobId: 'repeat-sync-all-inboxes',
      },
    );
    this.logger.log(`Incremental email sync scheduled every ${SYNC_INTERVAL_MS / 60000} minutes`);
  }
}
