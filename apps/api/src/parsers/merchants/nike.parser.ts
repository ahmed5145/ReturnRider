import { ParseInput, ParsedReceipt } from '../types';
import { extractAmount, extractOrderId, stripHtml, addReturnWindow } from './parser-utils';

export function parseNike(input: ParseInput): ParsedReceipt | null {
  const text = stripHtml(input.htmlBody) || input.textBody;
  const orderId = extractOrderId(text, [/order\s*#?\s*([A-Z0-9]{8,})/i]);
  if (!orderId) return null;

  return {
    merchantName: 'Nike',
    merchantDomain: 'nike.com',
    externalOrderId: orderId,
    totalAmount: extractAmount(text),
    currency: 'USD',
    itemSummary: input.subject.slice(0, 120),
    returnWindowDays: 60,
    returnDeadlineAt: addReturnWindow(new Date(), 60),
    confidence: 0.9,
  };
}
