import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UseGuards,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { Response } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { WalletPassDto } from '../wallet/dto/wallet-pass.dto';
import { WalletService } from '../wallet/wallet.service';
import { ReturnsService } from './returns.service';

@ApiTags('returns')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('returns')
export class WalletReturnsController {
  constructor(
    private readonly returnsService: ReturnsService,
    private readonly walletService: WalletService,
  ) {}

  @Post(':id/wallet-pass')
  @ApiOperation({ summary: 'Generate Apple or Google wallet pass' })
  async createWalletPass(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: WalletPassDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ret = await this.returnsService.loadReturn(user.id, id);
    if (!ret.qrPayload) {
      throw new UnprocessableEntityException('Return has no QR payload');
    }

    const result = await this.walletService.generatePass(ret, dto.platform);

    if (dto.platform === 'apple' && result.pkpassBuffer) {
      res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="return-${id}.pkpass"`,
      );
      res.send(result.pkpassBuffer);
      return;
    }

    return result.response;
  }
}
