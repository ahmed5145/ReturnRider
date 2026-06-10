import { ParseInput, ParsedReceipt } from '../types';
import { parseMerchantReceipt } from './merchant-parser-base';

export function parseNike(input: ParseInput): ParsedReceipt | null {
  return parseMerchantReceipt(input, {
    merchantName: 'Nike',
    merchantDomain: 'nike.com',
    orderIdPatterns: [/order\s*#?\s*([A-Z0-9]{8,})/i],
  });
}
