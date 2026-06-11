import { Body, Controller, Delete, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { User } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { PushService } from '../notifications/push.service';
import { UsersService } from './users.service';

class PushTokenDto {
  @IsString()
  expo_push_token!: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

class TimezoneDto {
  @IsString()
  timezone!: string;
}

class OnboardingDto {
  @IsOptional()
  @IsString()
  display_name?: string;
}

class DeleteAccountDto {
  @IsString()
  confirm!: string;
}

class ApplyReferralDto {
  @IsString()
  code!: string;
}

class UnblockMerchantDto {
  @IsString()
  merchant_name!: string;
}

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly pushService: PushService,
  ) {}

  @Get('me')
  async me(@CurrentUser() user: User) {
    return this.usersService.getProfile(user.id);
  }

  @Post('push-token')
  async pushToken(@CurrentUser() user: User, @Body() dto: PushTokenDto) {
    await this.usersService.setPushToken(user.id, dto.expo_push_token, dto.timezone);
    return { registered: true };
  }

  @Post('timezone')
  async timezone(@CurrentUser() user: User, @Body() dto: TimezoneDto) {
    await this.usersService.setTimezone(user.id, dto.timezone);
    return { updated: true };
  }

  @Post('test-push')
  async testPush(@CurrentUser() user: User) {
    return this.pushService.sendToUser(
      user.id,
      'ReturnRider',
      'Push works! We\'ll remind you before return deadlines.',
      { type: 'test' },
    );
  }

  @Post('onboarding-complete')
  async onboardingComplete(@CurrentUser() user: User, @Body() dto: OnboardingDto) {
    return this.usersService.completeOnboarding(user.id, dto.display_name);
  }

  @Post('onboarding-reset')
  async onboardingReset(@CurrentUser() user: User) {
    return this.usersService.resetOnboarding(user.id);
  }

  @Get('me/export')
  async exportData(@CurrentUser() user: User) {
    return this.usersService.exportUserData(user.id);
  }

  @Post('referral/apply')
  async applyReferral(@CurrentUser() user: User, @Body() dto: ApplyReferralDto) {
    return this.usersService.applyReferralCode(user.id, dto.code);
  }

  @Get('me/blocked-merchants')
  async blockedMerchants(@CurrentUser() user: User) {
    return this.usersService.listBlockedMerchants(user.id);
  }

  @Post('me/blocked-merchants/unblock')
  async unblockMerchant(@CurrentUser() user: User, @Body() dto: UnblockMerchantDto) {
    return this.usersService.unblockMerchant(user.id, dto.merchant_name);
  }

  @Delete('me')
  @HttpCode(200)
  async deleteAccount(@CurrentUser() user: User, @Body() dto: DeleteAccountDto) {
    if (dto.confirm !== 'DELETE') {
      return { deleted: false, error: 'Send { "confirm": "DELETE" } to confirm' };
    }
    return this.usersService.deleteAccount(user.id);
  }
}
