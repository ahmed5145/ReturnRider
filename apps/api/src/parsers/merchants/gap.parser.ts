import { ParseInput, ParsedReceipt } from '../types';
import { parseMerchantReceipt } from './merchant-parser-base';

export function parseGap(input: ParseInput): ParsedReceipt | null {
  const domain = input.from.toLowerCase().includes('oldnavy') ? 'oldnavy.com' : 'gap.com';
  const name = domain.startsWith('old') ? 'Old Navy' : 'Gap';

  return parseMerchantReceipt(input, {
    merchantName: name,
    merchantDomain: domain,
    orderIdPatterns: [/order\s*#?\s*([0-9]{9,})/i],
  });
}
