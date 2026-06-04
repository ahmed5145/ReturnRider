import { ParseInput, ParsedReceipt } from '../types';
import { extractAmount, extractOrderId, stripHtml, addReturnWindow } from './parser-utils';

export function parseWalmart(input: ParseInput): ParsedReceipt | null {
  const text = stripHtml(input.htmlBody) || input.textBody;
  const orderId = extractOrderId(text, [/order\s*#?\s*([0-9]{6,})/i]);
  if (!orderId) return null;

  return {
    merchantName: 'Walmart',
    merchantDomain: 'walmart.com',
    externalOrderId: orderId,
    totalAmount: extractAmount(text),
    currency: 'USD',
    itemSummary: input.subject.slice(0, 120),
    returnWindowDays: 90,
    returnDeadlineAt: addReturnWindow(new Date(), 90),
    confidence: 0.88,
  };
}
