import { ParseInput, ParsedReceipt } from '../types';
import { parseMerchantReceipt } from './merchant-parser-base';

export function parseWalmart(input: ParseInput): ParsedReceipt | null {
  return parseMerchantReceipt(input, {
    merchantName: 'Walmart',
    merchantDomain: 'walmart.com',
    orderIdPatterns: [/order\s*#?\s*([0-9]{6,})/i],
  });
}
