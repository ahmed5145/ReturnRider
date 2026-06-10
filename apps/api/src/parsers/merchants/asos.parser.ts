import { ParseInput, ParsedReceipt } from '../types';
import { parseMerchantReceipt } from './merchant-parser-base';

export function parseAsos(input: ParseInput): ParsedReceipt | null {
  return parseMerchantReceipt(input, {
    merchantName: 'ASOS',
    merchantDomain: 'asos.com',
    orderIdPatterns: [/order\s*(?:number|no\.?)[:\s#]*([A-Z0-9]{6,})/i],
  });
}
