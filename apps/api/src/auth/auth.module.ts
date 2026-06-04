import { Module } from '@nestjs/common';
import { CryptoService } from '../common/crypto.service';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { DevAuthController } from './dev-auth.controller';

@Module({
  controllers: [DevAuthController],
  providers: [AuthService, AuthGuard, CryptoService],
  exports: [AuthService, AuthGuard, CryptoService],
})
export class AuthModule {}
