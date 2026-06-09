import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'returnrider-api',
      features: {
        plaid: this.isConfigured('PLAID_CLIENT_ID', 'PLAID_SECRET'),
        gmail: this.isConfigured('GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'),
      },
    };
  }

  private isConfigured(...keys: string[]): boolean {
    return keys.every((k) => Boolean(process.env[k]?.trim()));
  }
}
