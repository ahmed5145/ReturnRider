import { Injectable, Logger } from '@nestjs/common';
import { Return } from '@prisma/client';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generatePass(
    ret: Return & { order?: { merchantName: string; externalOrderId: string } },
    platform: 'apple' | 'google',
  ) {
    const serial = ret.walletAppleSerial ?? `return-${ret.id}`;
    const googleObjectId = ret.walletGoogleObjectId ?? `return_${ret.id}`;

    if (platform === 'apple') {
      const pkpassBuffer = this.generateApplePass(ret, serial);
      await this.prisma.return.update({
        where: { id: ret.id },
        data: { walletAppleSerial: serial },
      });
      return {
        pkpassBuffer,
        response: {
          platform: 'apple',
          apple_pkpass_url: `/api/v1/returns/${ret.id}/wallet-pass`,
          google_save_url: null,
          serial_number: serial,
          expires_at: ret.qrExpiresAt?.toISOString() ?? null,
        },
      };
    }

    const saveUrl = await this.generateGoogleSaveUrl(ret, googleObjectId);
    await this.prisma.return.update({
      where: { id: ret.id },
      data: { walletGoogleObjectId: googleObjectId },
    });

    return {
      pkpassBuffer: null,
      response: {
        platform: 'google',
        apple_pkpass_url: null,
        google_save_url: saveUrl,
        serial_number: googleObjectId,
        expires_at: ret.qrExpiresAt?.toISOString() ?? null,
      },
    };
  }

  private generateApplePass(
    ret: Return & { order?: { merchantName: string; externalOrderId: string } },
    serial: string,
  ): Buffer {
    const certPath = process.env.APPLE_PASS_CERT_PATH;
    if (certPath && fs.existsSync(certPath)) {
      this.logger.log('Apple certs present; use passkit signing pipeline in production');
    } else {
      this.logger.warn('Apple certs missing; returning JSON pass stub (configure certs for signed .pkpass)');
    }

    const passJson = {
      formatVersion: 1,
      passTypeIdentifier:
        process.env.APPLE_PASS_TYPE_ID ?? 'pass.com.returnrider.return',
      serialNumber: serial,
      teamIdentifier: process.env.APPLE_TEAM_ID ?? 'TEAMID',
      organizationName: 'ReturnRider',
      description: 'Return Pass',
      barcode: ret.qrPayload
        ? {
            message: ret.qrPayload,
            format: 'PKBarcodeFormatQR',
            messageEncoding: 'iso-8859-1',
          }
        : undefined,
      generic: {
        primaryFields: [
          {
            key: 'merchant',
            label: 'Merchant',
            value: ret.order?.merchantName ?? 'Return',
          },
        ],
        secondaryFields: [
          {
            key: 'orderNumber',
            label: 'Order',
            value: ret.order?.externalOrderId ?? '',
          },
        ],
        auxiliaryFields: [
          {
            key: 'returnBy',
            label: 'Return by',
            value: ret.returnDeadlineAt?.toLocaleDateString() ?? 'See email',
          },
        ],
      },
    };

    return Buffer.from(JSON.stringify(passJson, null, 2));
  }

  private async generateGoogleSaveUrl(
    ret: Return & { order?: { merchantName: string; externalOrderId: string } },
    objectId: string,
  ): Promise<string> {
    const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID ?? '3388000000022345678';
    const classId = `${issuerId}.returnrider_return_v1`;
    const fullObjectId = `${issuerId}.${objectId}`;

    const serviceAccountPath = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountPath || !fs.existsSync(serviceAccountPath)) {
      return `https://pay.google.com/gp/v/save/${fullObjectId}?dev=1`;
    }

    const sa = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    const objectPayload = {
      id: fullObjectId,
      classId,
      state: 'ACTIVE',
      barcode: {
        type: 'QR_CODE',
        value: ret.qrPayload ?? '',
      },
      cardTitle: {
        defaultValue: { language: 'en-US', value: ret.order?.merchantName ?? 'Return' },
      },
      subheader: {
        defaultValue: {
          language: 'en-US',
          value: `Order ${ret.order?.externalOrderId ?? ''}`,
        },
      },
    };

    const claims = {
      iss: sa.client_email,
      aud: 'google',
      origins: ['https://returnrider.com'],
      typ: 'savetowallet',
      payload: {
        genericObjects: [objectPayload],
      },
    };

    const token = jwt.sign(claims, sa.private_key, { algorithm: 'RS256' });
    return `https://pay.google.com/gp/v/save/${token}`;
  }
}
