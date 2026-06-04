import { ParseInput, ParsedReceipt } from '../types';
import { extractAmount, extractOrderId, stripHtml, addReturnWindow } from './parser-utils';

export function parseGap(input: ParseInput): ParsedReceipt | null {
  const text = stripHtml(input.htmlBody) || input.textBody;
  const orderId = extractOrderId(text, [/order\s*#?\s*([0-9]{9,})/i]);
  if (!orderId) return null;

  const domain = input.from.toLowerCase().includes('oldnavy') ? 'oldnavy.com' : 'gap.com';
  const name = domain.startsWith('old') ? 'Old Navy' : 'Gap';

  return {
    merchantName: name,
    merchantDomain: domain,
    externalOrderId: orderId,
    totalAmount: extractAmount(text),
    currency: 'USD',
    itemSummary: input.subject.slice(0, 120),
    returnWindowDays: 45,
    returnDeadlineAt: addReturnWindow(new Date(), 45),
    confidence: 0.87,
  };
}
