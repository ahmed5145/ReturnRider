import {
  Body,
  Controller,
  Headers,
  Post,
  RawBodyRequest,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiExcludeController, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { TrackingWebhookPayload } from './dto/tracking-webhook.dto';
import { TrackingService } from './tracking.service';

@ApiTags('webhooks')
@ApiExcludeController(false)
@Controller('webhooks/tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post('easypost')
  async easypost(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-hmac-signature') signature: string,
    @Body() body: Record<string, unknown>,
  ) {
    const raw = req.rawBody ?? Buffer.from(JSON.stringify(body));
    if (!this.trackingService.verifyHmac(raw, signature)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const normalized = this.trackingService.mapEasyPostToInternal(body);
    if (!normalized) {
      return { received: true, matched: false, reason: 'unparseable payload' };
    }

    return this.trackingService.handleNormalizedWebhook(normalized);
  }

  @Post('normalized')
  async normalized(@Body() body: TrackingWebhookPayload) {
    return this.trackingService.handleNormalizedWebhook(body);
  }
}
