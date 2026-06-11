import { Controller, Get } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from './prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('email-sync') private readonly emailSyncQueue: Queue,
  ) {}

  @Get()
  async check() {
    const [database, redis] = await Promise.all([this.checkDatabase(), this.checkRedis()]);
    const ok = database.ok && redis.ok;

    // Always HTTP 200 so Render / UptimeRobot keep-warm probes stay green.
    return {
      status: ok ? 'ok' : 'degraded',
      service: 'returnrider-api',
      features: {
        plaid: this.isConfigured('PLAID_CLIENT_ID', 'PLAID_SECRET'),
        gmail: this.isConfigured('GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'),
      },
      sync_interval_minutes: this.syncIntervalMinutes(),
      checks: { database, redis },
    };
  }

  private async checkDatabase(): Promise<{ ok: boolean; latency_ms?: number; error?: string }> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { ok: true, latency_ms: Date.now() - start };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Database unreachable',
      };
    }
  }

  private async checkRedis(): Promise<{ ok: boolean; latency_ms?: number; error?: string }> {
    const start = Date.now();
    try {
      // BullMQ Queue API — avoids IRedisClient.ping() which is not on the type surface.
      await this.emailSyncQueue.getJobCounts();
      return { ok: true, latency_ms: Date.now() - start };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Redis unreachable',
      };
    }
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
