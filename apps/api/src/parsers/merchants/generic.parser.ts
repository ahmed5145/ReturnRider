import { isCommerceEmail, extractGenericOrderId } from '../commerce-classifier';
import { ParseInput, ParsedReceipt } from '../types';
import { extractAmount, stripHtml } from './parser-utils';

export function parseGeneric(input: ParseInput): ParsedReceipt | null {
  if (!isCommerceEmail(input.from, input.subject)) {
    return null;
  }
  const text = stripHtml(input.htmlBody) || input.textBody;
  const orderId = extractGenericOrderId(text);
  if (!orderId) return null;

  const domainMatch = input.from.match(/@([\w.-]+)/);
  const merchantDomain = domainMatch?.[1];
  const merchantName = merchantDomain?.split('.')[0] ?? 'Unknown';

  return {
    merchantName: merchantName.charAt(0).toUpperCase() + merchantName.slice(1),
    merchantDomain,
    externalOrderId: orderId,
    totalAmount: extractAmount(text),
    currency: 'USD',
    itemSummary: input.subject.slice(0, 120),
    returnWindowDays: 30,
    confidence: 0.75,
  };
}
