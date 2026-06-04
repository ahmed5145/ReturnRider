import { Injectable } from '@nestjs/common';
import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  Products,
  CountryCode,
} from 'plaid';
import { CryptoService } from '../common/crypto.service';
import { PrismaService } from '../prisma/prisma.service';
import { RefundMatcherService, PlaidTransaction } from './refund-matcher.service';

@Injectable()
export class PlaidService {
  private client: PlaidApi;

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly refundMatcher: RefundMatcherService,
  ) {
    const env = process.env.PLAID_ENV ?? 'sandbox';
    const configuration = new Configuration({
      basePath: PlaidEnvironments[env as keyof typeof PlaidEnvironments],
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID ?? '',
          'PLAID-SECRET': process.env.PLAID_SECRET ?? '',
        },
      },
    });
    this.client = new PlaidApi(configuration);
  }

  async createLinkToken(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const response = await this.client.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: 'ReturnRider',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    });
    return { link_token: response.data.link_token };
  }

  async exchangePublicToken(userId: string, publicToken: string) {
    const exchange = await this.client.itemPublicTokenExchange({
      public_token: publicToken,
    });
    const accessToken = exchange.data.access_token;
    const itemId = exchange.data.item_id;

    const { ciphertext, keyId } = this.crypto.encrypt(accessToken);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        plaidUserId: itemId,
        plaidAccessTokenEnc: ciphertext,
      },
    });

    await this.syncTransactions(userId);
    return { item_id: itemId, key_id: keyId };
  }

  async syncTransactions(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.plaidAccessTokenEnc) {
      return { synced: 0 };
    }

    const accessToken = this.crypto.decrypt(user.plaidAccessTokenEnc);
    const start = new Date();
    start.setDate(start.getDate() - 90);
    const end = new Date();

    const response = await this.client.transactionsGet({
      access_token: accessToken,
      start_date: start.toISOString().slice(0, 10),
      end_date: end.toISOString().slice(0, 10),
    });

    const transactions: PlaidTransaction[] = response.data.transactions.map((t) => ({
      transaction_id: t.transaction_id,
      amount: t.amount,
      name: t.name,
      date: t.date,
    }));

    const results = await this.refundMatcher.matchTransactions(userId, transactions);
    return { synced: transactions.length, matches: results };
  }
}
