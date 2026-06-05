import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { EmailConnectDto } from './dto/email-connect.dto';
import { EmailsService } from './emails.service';

@ApiTags('emails')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('emails')
export class EmailsController {
  constructor(private readonly emailsService: EmailsService) {}

  @Post('connect')
  @HttpCode(201)
  @ApiOperation({ summary: 'Link email provider via OAuth tokens' })
  async connect(@CurrentUser() user: User, @Body() dto: EmailConnectDto) {
    return this.emailsService.connect(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List linked email accounts' })
  async list(@CurrentUser() user: User) {
    return this.emailsService.listLinked(user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Disconnect linked email' })
  async disconnect(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.emailsService.disconnect(user.id, id);
  }
}
