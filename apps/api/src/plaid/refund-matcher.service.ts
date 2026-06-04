import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface PlaidTransaction {
  transaction_id: string;
  amount: number;
  name: string;
  date: string;
}

@Injectable()
export class RefundMatcherService {
  private readonly logger = new Logger(RefundMatcherService.name);

  constructor(private readonly prisma: PrismaService) {}

  fuzzyMatchMerchant(transactionName: string, merchantName: string): number {
    const t = transactionName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const m = merchantName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (t.includes(m) || m.includes(t.slice(0, Math.min(m.length, 6)))) {
      return 0.95;
    }
    const words = m.split(/\s+/).filter((w) => w.length > 3);
    const hits = words.filter((w) => t.includes(w)).length;
    return words.length ? hits / words.length : 0;
  }

  async matchTransactions(userId: string, transactions: PlaidTransaction[]) {
    const pending = await this.prisma.refundStatus.findMany({
      where: {
        userId,
        status: { in: ['pending', 'matched'] },
      },
      include: {
        return: {
          include: { order: true },
        },
      },
    });

    const results: { returnId: string; matched: boolean; confidence: number }[] = [];

    for (const refund of pending) {
      const expected = refund.expectedAmount
        ? Number(refund.expectedAmount)
        : refund.return.expectedRefundAmount
          ? Number(refund.return.expectedRefundAmount)
          : null;

      if (!expected) continue;

      const deliveredAt = refund.return.deliveredToMerchantAt;
      const windowStart = deliveredAt ?? refund.return.createdAt;
      const windowEnd = new Date(windowStart);
      windowEnd.setDate(windowEnd.getDate() + 45);

      for (const tx of transactions) {
        if (tx.amount >= 0) continue;
        const creditAmount = Math.abs(tx.amount);
        const amountMatch = Math.abs(creditAmount - expected) <= 1;

        const merchantScore = this.fuzzyMatchMerchant(
          tx.name,
          refund.return.order.merchantName,
        );

        const txDate = new Date(tx.date);
        if (txDate < windowStart || txDate > windowEnd) continue;

        const confidence = amountMatch ? merchantScore * 0.95 + 0.05 : merchantScore * 0.5;

        if (confidence >= 0.9 && amountMatch) {
          await this.prisma.refundStatus.update({
            where: { id: refund.id },
            data: {
              status: 'completed',
              actualAmount: creditAmount,
              plaidTransactionId: tx.transaction_id,
              postedAt: txDate,
              source: 'plaid',
              matchConfidence: confidence,
            },
          });

          await this.prisma.return.update({
            where: { id: refund.returnId },
            data: { status: 'refund_completed' },
          });

          results.push({ returnId: refund.returnId, matched: true, confidence });
          this.logger.log(`Matched refund for return ${refund.returnId}`);
          break;
        } else if (confidence >= 0.7) {
          await this.prisma.refundStatus.update({
            where: { id: refund.id },
            data: {
              status: 'matched',
              matchConfidence: confidence,
              plaidTransactionId: tx.transaction_id,
            },
          });
          results.push({ returnId: refund.returnId, matched: false, confidence });
        }
      }
    }

    return results;
  }
}
