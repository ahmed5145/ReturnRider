import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PlaidController } from './plaid.controller';
import { PlaidService } from './plaid.service';
import { RefundMatcherService } from './refund-matcher.service';

@Module({
  imports: [AuthModule],
  controllers: [PlaidController],
  providers: [PlaidService, RefundMatcherService],
  exports: [PlaidService, RefundMatcherService],
})
export class PlaidModule {}
