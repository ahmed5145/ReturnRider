import { ParseInput, ParsedReceipt } from '../types';
import { parseMerchantReceipt } from './merchant-parser-base';

export function parseTarget(input: ParseInput): ParsedReceipt | null {
  return parseMerchantReceipt(input, {
    merchantName: 'Target',
    merchantDomain: 'target.com',
    orderIdPatterns: [/order\s*#?\s*([0-9]{8,})/i],
  });
}
