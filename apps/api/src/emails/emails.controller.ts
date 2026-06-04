import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
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
}
