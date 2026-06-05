import { Injectable, Logger } from '@nestjs/common';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly expo = new Expo();

  constructor(private readonly prisma: PrismaService) {}

  async sendToUser(userId: string, title: string, body: string, data?: Record<string, string>) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.expoPushToken || !Expo.isExpoPushToken(user.expoPushToken)) {
      this.logger.warn(`No valid Expo push token for user ${userId}`);
      return { sent: false, reason: 'no_token' };
    }

    const message: ExpoPushMessage = {
      to: user.expoPushToken,
      sound: 'default',
      title,
      body,
      data,
    };

    try {
      const tickets = await this.expo.sendPushNotificationsAsync([message]);
      this.logger.log(`Push sent to ${userId}: ${title}`);
      return { sent: true, tickets };
    } catch (err) {
      this.logger.error(`Push failed for ${userId}: ${err}`);
      return { sent: false, reason: 'send_failed' };
    }
  }
}
