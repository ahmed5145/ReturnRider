import { ParseInput, ParsedReceipt } from '../types';
import { extractAmount, extractOrderId, stripHtml, addReturnWindow } from './parser-utils';

export function parseAsos(input: ParseInput): ParsedReceipt | null {
  const text = stripHtml(input.htmlBody) || input.textBody;
  const orderId = extractOrderId(text, [/order\s*(?:number|no\.?)[:\s#]*([A-Z0-9]{6,})/i]);
  if (!orderId) return null;

  return {
    merchantName: 'ASOS',
    merchantDomain: 'asos.com',
    externalOrderId: orderId,
    totalAmount: extractAmount(text),
    currency: 'USD',
    itemSummary: input.subject.slice(0, 120),
    returnWindowDays: 28,
    returnDeadlineAt: addReturnWindow(new Date(), 28),
    confidence: 0.91,
  };
}
