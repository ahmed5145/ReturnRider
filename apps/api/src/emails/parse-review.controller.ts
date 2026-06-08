import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ConfirmParseReviewDto } from './dto/confirm-parse-review.dto';
import { EmailSyncService } from './email-sync.service';

@ApiTags('parse-review')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('parse-review')
export class ParseReviewController {
  constructor(private readonly emailSync: EmailSyncService) {}

  @Get()
  @ApiOperation({ summary: 'List receipts pending user review' })
  async list(@CurrentUser() user: User) {
    return this.emailSync.listPendingReviews(user.id);
  }

  @Post(':id/confirm')
  @HttpCode(200)
  @ApiOperation({ summary: 'Confirm a low-confidence parse and create return' })
  async confirm(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfirmParseReviewDto,
  ) {
    return this.emailSync.confirmReview(user.id, id, dto);
  }

  @Post(':id/dismiss')
  @HttpCode(200)
  @ApiOperation({ summary: 'Dismiss — not a return receipt' })
  async dismiss(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.emailSync.dismissReview(user.id, id);
  }
}
