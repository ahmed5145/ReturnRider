import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { User } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsersService } from './users.service';

class PushTokenDto {
  @IsString()
  expo_push_token!: string;
}

class OnboardingDto {
  @IsOptional()
  @IsString()
  display_name?: string;
}

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async me(@CurrentUser() user: User) {
    return this.usersService.getProfile(user.id);
  }

  @Post('push-token')
  async pushToken(@CurrentUser() user: User, @Body() dto: PushTokenDto) {
    await this.usersService.setPushToken(user.id, dto.expo_push_token);
    return { registered: true };
  }

  @Post('onboarding-complete')
  async onboardingComplete(@CurrentUser() user: User, @Body() dto: OnboardingDto) {
    return this.usersService.completeOnboarding(user.id, dto.display_name);
  }
}
