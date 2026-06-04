import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { NotificationSchedulerService } from './notification-scheduler.service';
import { NotificationsProcessor } from './notifications.processor';

@Module({
  imports: [BullModule.registerQueue({ name: 'notifications' })],
  providers: [NotificationSchedulerService, NotificationsProcessor],
  exports: [NotificationSchedulerService],
})
export class NotificationsModule {}
