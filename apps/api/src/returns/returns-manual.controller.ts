import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, MinLength } from 'class-validator';
import { User } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ReturnsService } from './returns.service';

class ManualReturnBody {
  @IsString()
  @MinLength(1)
  merchant_name!: string;

  @IsString()
  @MinLength(1)
  external_order_id!: string;

  @IsString()
  @MinLength(1)
  item_summary!: string;

  @IsOptional()
  @IsString()
  return_deadline_at?: string;

  @IsOptional()
  @IsNumber()
  return_window_days?: number;

  @IsOptional()
  @IsNumber()
  expected_refund_amount?: number;

  @IsOptional()
  @IsString()
  qr_payload?: string;
}

class ParseReceiptTextBody {
  @IsString()
  @MinLength(10)
  text!: string;
}

@ApiTags('returns')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('returns')
export class ReturnsManualController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post('manual')
  async createManual(@CurrentUser() user: User, @Body() body: ManualReturnBody) {
    const ret = await this.returnsService.createManual(user.id, body);
    return { id: ret.id, status: ret.status };
  }

  @Post('parse-receipt-text')
  async parseText(@CurrentUser() user: User, @Body() body: ParseReceiptTextBody) {
    return this.returnsService.parseReceiptText(user.id, body.text);
  }

  @Post('from-receipt-text')
  async createFromText(@CurrentUser() user: User, @Body() body: ParseReceiptTextBody) {
    const ret = await this.returnsService.createFromParsedText(user.id, body.text);
    return { id: ret.id, status: ret.status };
  }
}
