import {
  classifyEmailIntent,
  intentCreatesReturn,
  isPromotionalOrNonReturnEmail,
} from '../commerce-classifier';
import { scoreParseConfidence } from '../parse-scoring';
import { ParseInput, ParsedReceipt } from '../types';
import {
  extractAmount,
  extractOrderId,
  extractReturnLabelUrl,
  stripHtml,
  addReturnWindow,
  resolveOrderDate,
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

  const intent = classifyEmailIntent(input.subject, text);
  if (intent === 'shipped' || intent === 'other') {
    return null;
  }

  if (!intentCreatesReturn(intent)) {
    return null;
  }

  const isReturn = intent === 'return_label' || intent === 'refund';
  const total = extractAmount(text);
  const labelUrl = isReturn ? extractReturnLabelUrl(input.htmlBody, text) : undefined;
  const orderDate = resolveOrderDate(input.emailDate);

  const confidence = scoreParseConfidence({
    intent,
    merchantSpecific: true,
    hasOrderId: true,
    hasAmount: total != null,
    hasLabelUrl: !!labelUrl,
  });

  return {
    merchantName: 'Amazon',
    merchantDomain: 'amazon.com',
    externalOrderId: orderId,
    orderDate,
    totalAmount: total,
    currency: 'USD',
    itemSummary: input.subject.replace(/^Amazon\.com\s*[-:]?\s*/i, '').slice(0, 120),
    returnWindowDays: 30,
    returnDeadlineAt: addReturnWindow(orderDate, 30),
    returnLabelUrl: labelUrl ?? undefined,
    emailIntent: intent,
    parserTier: 'merchant',
    confidence,
  };
}
