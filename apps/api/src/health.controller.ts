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
      sync_interval_minutes: this.syncIntervalMinutes(),
    };
  }

  private isConfigured(...keys: string[]): boolean {
    return keys.every((k) => Boolean(process.env[k]?.trim()));
  }

  private syncIntervalMinutes(): number {
    const minutes = Number(process.env.EMAIL_SYNC_INTERVAL_MINUTES ?? '5');
    if (!Number.isFinite(minutes) || minutes < 1) return 5;
    return Math.min(minutes, 60);
  }
}
