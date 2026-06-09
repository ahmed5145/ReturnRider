import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';
import { AuthService } from './auth.service';

class DevTokenDto {
  @IsString()
  sub!: string;

  @IsEmail()
  email!: string;
}

@ApiTags('auth')
@Controller('auth')
export class DevAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('dev-token')
  devToken(@Body() dto: DevTokenDto) {
    const allowStaging =
      process.env.ALLOW_DEV_AUTH === 'true' || process.env.ALLOW_DEV_AUTH === '1';
    if (process.env.NODE_ENV === 'production' && !allowStaging) {
      return { error: 'Not available in production' };
    }
    return { token: this.authService.signDevToken(dto.sub, dto.email) };
  }
}
