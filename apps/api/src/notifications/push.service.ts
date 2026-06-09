import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

function isExpoPushToken(token: string): boolean {
  return /^Expo(nent)?PushToken\[/i.test(token);
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(private readonly prisma: PrismaService) {}

  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string | number | boolean>,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.expoPushToken || !isExpoPushToken(user.expoPushToken)) {
      this.logger.warn(`No valid Expo push token for user ${userId}`);
      return { sent: false, reason: 'no_token' };
    }

    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: user.expoPushToken,
          sound: 'default',
          title,
          body,
          data,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        this.logger.error(`Push failed for ${userId}: ${JSON.stringify(result)}`);
        return { sent: false, reason: 'send_failed', result };
      }

      this.logger.log(`Push sent to ${userId}: ${title}`);
      return { sent: true, result };
    } catch (err) {
      this.logger.error(`Push failed for ${userId}: ${err}`);
      return { sent: false, reason: 'send_failed' };
    }
  }
}
