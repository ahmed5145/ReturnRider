import { Body, Controller, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
import { User } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ReturnsService } from './returns.service';

class ConfirmRefundDto {
  @IsNumber()
  amount!: number;
}

@ApiTags('returns')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('returns')
export class RefundsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post(':id/confirm-refund')
  async confirmRefund(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfirmRefundDto,
  ) {
    await this.returnsService.confirmRefund(user.id, id, dto.amount);
    return { status: 'refund_completed' };
  }
}
