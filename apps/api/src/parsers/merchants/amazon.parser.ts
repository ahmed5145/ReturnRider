import { ParseInput, ParsedReceipt } from '../types';
import { extractAmount, extractOrderId, stripHtml, addReturnWindow } from './parser-utils';

export function parseAmazon(input: ParseInput): ParsedReceipt | null {
  const text = stripHtml(input.htmlBody) || input.textBody;
  const orderId = extractOrderId(text, [
    /Order\s*#\s*([\d-]{3}-\d{7}-\d{7})/i,
    /order\s+([\d-]{3}-\d{7}-\d{7})/i,
  ]);
  if (!orderId) return null;

  const isReturn = /return|return label/i.test(input.subject);
  const total = extractAmount(text);

  return {
    merchantName: 'Amazon',
    merchantDomain: 'amazon.com',
    externalOrderId: orderId,
    totalAmount: total,
    currency: 'USD',
    itemSummary: input.subject.replace(/^Amazon\.com\s*[-:]?\s*/i, '').slice(0, 120),
    returnWindowDays: 30,
    returnDeadlineAt: addReturnWindow(new Date(), 30),
    confidence: isReturn ? 0.92 : 0.9,
  };
}
