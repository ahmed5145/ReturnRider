import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailSyncProcessor } from './email-sync.processor';
import { EmailSyncService } from './email-sync.service';
import { EmailsController } from './emails.controller';
import { EmailsService } from './emails.service';
import { GmailService } from './gmail.service';

@Module({
  imports: [
    AuthModule,
    NotificationsModule,
    BullModule.registerQueue({ name: 'email-sync' }),
    BullModule.registerQueue({ name: 'notifications' }),
  ],
  controllers: [EmailsController],
  providers: [
    EmailsService,
    GmailService,
    EmailSyncService,
    EmailSyncProcessor,
  ],
  exports: [EmailsService, GmailService, EmailSyncService],
})
export class EmailsModule {}
