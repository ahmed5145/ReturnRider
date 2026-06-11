import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const CACHE_TTL_MS = 60_000;

export function normalizeMerchantName(name: string | null | undefined): string | null {
  if (!name?.trim()) return null;
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Per-user merchant skip list built from "not a return" reports.
 * Only consulted for {@link ParsedReceipt.parserTier} === `generic` during sync —
 * never for dedicated merchant parsers (Amazon order confirms must still flow).
 */
@Injectable()
export class ParseBlocklistService {
  private readonly cache = new Map<string, { names: Set<string>; expiresAt: number }>();

  constructor(private readonly prisma: PrismaService) {}

  invalidateUser(userId: string): void {
    this.cache.delete(userId);
  }

  async listBlockedMerchants(userId: string): Promise<
    Array<{ merchant_name: string; email_subject: string | null; reported_at: string }>
  > {
    const rows = await this.prisma.parseFeedback.findMany({
      where: { userId, reason: 'not_a_return', merchantName: { not: null } },
      select: { merchantName: true, emailSubject: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    const seen = new Set<string>();
    const result: Array<{
      merchant_name: string;
      email_subject: string | null;
      reported_at: string;
    }> = [];

    for (const row of rows) {
      const key = normalizeMerchantName(row.merchantName);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      result.push({
        merchant_name: row.merchantName!,
        email_subject: row.emailSubject,
        reported_at: row.createdAt.toISOString(),
      });
    }
    return result;
  }

  async unblockMerchant(userId: string, merchantName: string): Promise<{ unblocked: boolean }> {
    const normalized = normalizeMerchantName(merchantName);
    if (!normalized) return { unblocked: false };

    const rows = await this.prisma.parseFeedback.findMany({
      where: { userId, reason: 'not_a_return', merchantName: { not: null } },
      select: { id: true, merchantName: true },
    });

    const ids = rows
      .filter((r) => normalizeMerchantName(r.merchantName) === normalized)
      .map((r) => r.id);

    if (ids.length === 0) return { unblocked: false };

    await this.prisma.parseFeedback.deleteMany({ where: { id: { in: ids } } });
    this.invalidateUser(userId);
    return { unblocked: true };
  }

  async isMerchantBlocked(userId: string, merchantName: string | null | undefined): Promise<boolean> {
    const normalized = normalizeMerchantName(merchantName);
    if (!normalized) return false;
    const blocked = await this.getBlockedMerchants(userId);
    return blocked.has(normalized);
  }

  private async getBlockedMerchants(userId: string): Promise<Set<string>> {
    const cached = this.cache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.names;
    }

    const rows = await this.prisma.parseFeedback.findMany({
      where: {
        userId,
        reason: 'not_a_return',
        merchantName: { not: null },
      },
      select: { merchantName: true },
      distinct: ['merchantName'],
    });

    const names = new Set<string>();
    for (const row of rows) {
      const key = normalizeMerchantName(row.merchantName);
      if (key) names.add(key);
    }

    this.cache.set(userId, { names, expiresAt: Date.now() + CACHE_TTL_MS });
    return names;
  }
}
