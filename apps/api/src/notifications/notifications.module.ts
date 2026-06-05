import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationSchedulerService } from './notification-scheduler.service';
import { NotificationsProcessor } from './notifications.processor';
import { PushService } from './push.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'notifications' }), PrismaModule],
  providers: [NotificationSchedulerService, NotificationsProcessor, PushService],
  exports: [NotificationSchedulerService, PushService],
})
export class NotificationsModule {}
