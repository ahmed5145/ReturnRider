import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WalletModule } from '../wallet/wallet.module';
import { ReturnsManualController } from './returns-manual.controller';
import { ReturnsController } from './returns.controller';
import { ReturnsService } from './returns.service';
import { RefundsController } from './refunds.controller';
import { WalletReturnsController } from './wallet-returns.controller';

@Module({
  imports: [AuthModule, NotificationsModule, forwardRef(() => WalletModule)],
  controllers: [ReturnsManualController, ReturnsController, WalletReturnsController, RefundsController],
  providers: [ReturnsService],
  exports: [ReturnsService],
})
export class ReturnsModule {}
