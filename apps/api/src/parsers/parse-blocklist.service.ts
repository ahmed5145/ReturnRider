import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const CACHE_TTL_MS = 60_000;

export function normalizeMerchantName(name: string | null | undefined): string | null {
  if (!name?.trim()) return null;
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

@Injectable()
export class ParseBlocklistService {
  private readonly cache = new Map<string, { names: Set<string>; expiresAt: number }>();

  constructor(private readonly prisma: PrismaService) {}

  invalidateUser(userId: string): void {
    this.cache.delete(userId);
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
