import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { EmailsModule } from './emails/emails.module';
import { HealthController } from './health.controller';
import { LegalModule } from './legal/legal.module';
import { MarketingModule } from './marketing/marketing.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PlaidModule } from './plaid/plaid.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReturnsModule } from './returns/returns.module';
import { TrackingModule } from './tracking/tracking.module';
import { UsersModule } from './users/users.module';
import { WalletModule } from './wallet/wallet.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Load apps/api/.env even when started from monorepo root (npm run api:dev)
      envFilePath: [join(__dirname, '..', '.env'), '.env'],
    }),
    BullModule.forRoot({
      connection: {
        url: process.env.REDIS_URL ?? 'redis://localhost:6379',
      },
    }),
    BullModule.registerQueue({ name: 'email-sync' }),
    PrismaModule,
    AuthModule,
    EmailsModule,
    ReturnsModule,
    WalletModule,
    TrackingModule,
    PlaidModule,
    NotificationsModule,
    LegalModule,
    MarketingModule,
    UsersModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
