import { ParseInput, ParsedReceipt } from '../types';
import { parseMerchantReceipt } from './merchant-parser-base';

export function parseBestBuy(input: ParseInput): ParsedReceipt | null {
  return parseMerchantReceipt(input, {
    merchantName: 'Best Buy',
    merchantDomain: 'bestbuy.com',
    orderIdPatterns: [/order\s*#?\s*([A-Z]{2,}[0-9]{6,})/i, /BBY\d{2}-\d+/i],
  });
}
