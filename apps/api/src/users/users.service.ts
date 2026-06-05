import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        linkedEmails: {
          select: {
            id: true,
            emailAddress: true,
            provider: true,
            status: true,
            syncWindowDays: true,
            lastSyncAt: true,
          },
        },
        _count: { select: { returns: true } },
      },
    });

    return {
      id: user.id,
      email: user.email,
      display_name: user.displayName,
      onboarding_completed: !!user.onboardingCompletedAt,
      linked_emails: user.linkedEmails,
      returns_count: user._count.returns,
      has_push_token: !!user.expoPushToken,
    };
  }

  async setPushToken(userId: string, token: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { expoPushToken: token },
    });
  }

  async completeOnboarding(userId: string, displayName?: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        onboardingCompletedAt: new Date(),
        ...(displayName ? { displayName } : {}),
      },
    });
  }
}
