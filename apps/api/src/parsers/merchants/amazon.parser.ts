import { isPromotionalOrNonReturnEmail } from '../commerce-classifier';
import { ParseInput, ParsedReceipt } from '../types';
import {
  extractAmount,
  extractOrderId,
  extractReturnLabelUrl,
  stripHtml,
  addReturnWindow,
} from './parser-utils';

export function parseAmazon(input: ParseInput): ParsedReceipt | null {
  if (isPromotionalOrNonReturnEmail(input.from, input.subject)) {
    return null;
  }

  const text = stripHtml(input.htmlBody) || input.textBody;
  const orderId = extractOrderId(text, [
    /Order\s*#\s*([\d-]{3}-\d{7}-\d{7})/i,
    /order\s+([\d-]{3}-\d{7}-\d{7})/i,
  ]);
  if (!orderId) return null;

  const isReturn = /return|return label|rma/i.test(input.subject);
  const isShipped = /shipped|delivery|out for delivery/i.test(input.subject);
  const isOrderConfirm = /order|ordered|confirmation|receipt/i.test(input.subject);

  if (!isReturn && !isOrderConfirm && !isShipped) {
    return null;
  }

  const total = extractAmount(text);
  const labelUrl = isReturn ? extractReturnLabelUrl(input.htmlBody, text) : undefined;

  return {
    merchantName: 'Amazon',
    merchantDomain: 'amazon.com',
    externalOrderId: orderId,
    totalAmount: total,
    currency: 'USD',
    itemSummary: input.subject.replace(/^Amazon\.com\s*[-:]?\s*/i, '').slice(0, 120),
    returnWindowDays: isReturn ? 30 : undefined,
    returnDeadlineAt: isReturn ? addReturnWindow(new Date(), 30) : undefined,
    returnLabelUrl: labelUrl ?? undefined,
    confidence: isReturn ? 0.92 : 0.88,
  };
}
