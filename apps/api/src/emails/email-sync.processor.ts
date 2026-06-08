import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EmailSyncService } from './email-sync.service';

@Processor('email-sync')
export class EmailSyncProcessor extends WorkerHost {
  constructor(private readonly emailSyncService: EmailSyncService) {
    super();
  }

  async process(job: Job<{ linkedEmailId?: string }>) {
    if (job.name === 'sync-linked-email' && job.data.linkedEmailId) {
      await this.emailSyncService.syncLinkedEmail(job.data.linkedEmailId);
    }
    if (job.name === 'sync-all-inboxes') {
      await this.emailSyncService.enqueueAllLinkedSyncs();
    }
  }
}
