import { ParseInput, ParsedReceipt } from '../types';
import { extractAmount, extractOrderId, stripHtml, addReturnWindow } from './parser-utils';

export function parseBestBuy(input: ParseInput): ParsedReceipt | null {
  const text = stripHtml(input.htmlBody) || input.textBody;
  const orderId = extractOrderId(text, [/order\s*#?\s*([A-Z]{2,}[0-9]{6,})/i, /BBY\d{2}-\d+/i]);
  if (!orderId) return null;

  return {
    merchantName: 'Best Buy',
    merchantDomain: 'bestbuy.com',
    externalOrderId: orderId,
    totalAmount: extractAmount(text),
    currency: 'USD',
    itemSummary: input.subject.slice(0, 120),
    returnWindowDays: 15,
    returnDeadlineAt: addReturnWindow(new Date(), 15),
    confidence: 0.9,
  };
}
