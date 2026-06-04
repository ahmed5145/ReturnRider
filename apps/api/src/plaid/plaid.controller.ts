import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { User } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { PlaidService } from './plaid.service';

class ExchangeTokenDto {
  @IsString()
  public_token!: string;
}

@ApiTags('plaid')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('plaid')
export class PlaidController {
  constructor(private readonly plaidService: PlaidService) {}

  @Post('link-token')
  @ApiOperation({ summary: 'Create Plaid Link token' })
  async linkToken(@CurrentUser() user: User) {
    return this.plaidService.createLinkToken(user.id);
  }

  @Post('exchange')
  async exchange(@CurrentUser() user: User, @Body() dto: ExchangeTokenDto) {
    return this.plaidService.exchangePublicToken(user.id, dto.public_token);
  }

  @Post('sync')
  async sync(@CurrentUser() user: User) {
    return this.plaidService.syncTransactions(user.id);
  }
}
