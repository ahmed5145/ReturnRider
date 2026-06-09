import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ReturnsService } from './returns.service';

@ApiTags('returns')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('returns')
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Get('active')
  @ApiOperation({ summary: 'List returns with upcoming deadlines' })
  @ApiQuery({ name: 'days_ahead', required: false, type: Number })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['ready_to_ship', 'in_transit', 'awaiting_refund', 'all_active'],
  })
  async listActive(
    @CurrentUser() user: User,
    @Query('days_ahead') daysAhead?: string,
    @Query('status') status?: string,
  ) {
    return this.returnsService.listActive(
      user.id,
      daysAhead ? parseInt(daysAhead, 10) : 30,
      status,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get return details' })
  async getOne(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.returnsService.findById(user.id, id);
  }

  @Post(':id/schedule-notifications')
  @ApiOperation({ summary: 'Schedule return deadline notifications' })
  async schedule(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.returnsService.scheduleNotifications(user.id, id);
    return { scheduled: true };
  }

  @Post(':id/snooze')
  async snooze(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.returnsService.snooze(user.id, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a draft or completed return' })
  async deleteOne(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.returnsService.deleteReturn(user.id, id);
  }
}
