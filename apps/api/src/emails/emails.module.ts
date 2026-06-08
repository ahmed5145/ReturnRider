import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailSyncProcessor } from './email-sync.processor';
import { EmailSyncScheduler } from './email-sync.scheduler';
import { EmailSyncService } from './email-sync.service';
import { EmailsController } from './emails.controller';
import { EmailsService } from './emails.service';
import { GmailService } from './gmail.service';
import { ParseReviewController } from './parse-review.controller';

@Module({
  imports: [
    AuthModule,
    NotificationsModule,
    BullModule.registerQueue({ name: 'email-sync' }),
    BullModule.registerQueue({ name: 'notifications' }),
  ],
  controllers: [EmailsController, ParseReviewController],
  providers: [
    EmailsService,
    GmailService,
    EmailSyncService,
    EmailSyncProcessor,
    EmailSyncScheduler,
  ],
  exports: [EmailsService, GmailService, EmailSyncService],
})
export class EmailsModule {}
