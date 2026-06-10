import {
  classifyEmailIntent,
  extractGenericOrderId,
  fromKnownRetailer,
  intentCreatesReturn,
  isCommerceEmail,
  isReturnRelatedSubject,
} from '../commerce-classifier';
import { scoreParseConfidence } from '../parse-scoring';
import { ParseInput, ParsedReceipt } from '../types';
import {
  extractAmount,
  extractReturnLabelUrl,
  stripHtml,
  addReturnWindow,
  resolveOrderDate,
} from './parser-utils';

/** Generic parser — always below auto-create threshold unless user confirms in review. */
const GENERIC_AUTO_THRESHOLD_CAP = 0.84;

export function parseGeneric(input: ParseInput): ParsedReceipt | null {
  if (!isCommerceEmail(input.from, input.subject)) {
    return null;
  }

  const text = stripHtml(input.htmlBody) || input.textBody;
  const intent = classifyEmailIntent(input.subject, text);

  if (intent === 'shipped') {
    return null;
  }

  if (!isReturnRelatedSubject(input.subject) && intent === 'other') {
    return null;
  }

  if (!intentCreatesReturn(intent) && !isReturnRelatedSubject(input.subject)) {
    return null;
  }

  const orderId = extractGenericOrderId(text);
  if (!orderId) return null;

  const domainMatch = input.from.match(/@([\w.-]+)/);
  const merchantDomain = domainMatch?.[1];
  const merchantName = merchantDomain?.split('.')[0] ?? 'Unknown';
  const displayName =
    merchantName.charAt(0).toUpperCase() + merchantName.slice(1).replace(/-/g, ' ');

  const totalAmount = extractAmount(text);
  const returnLabelUrl = extractReturnLabelUrl(input.htmlBody, text) ?? undefined;
  const orderDate = resolveOrderDate(input.emailDate);

  let confidence = scoreParseConfidence({
    intent: intent === 'other' ? 'return_label' : intent,
    merchantSpecific: fromKnownRetailer(input.from),
    hasOrderId: true,
    hasAmount: totalAmount != null,
    hasLabelUrl: !!returnLabelUrl,
  });

  confidence = Math.min(confidence, GENERIC_AUTO_THRESHOLD_CAP);

  return {
    merchantName: displayName,
    merchantDomain,
    externalOrderId: orderId,
    orderDate,
    totalAmount,
    currency: 'USD',
    itemSummary: input.subject.slice(0, 120),
    returnWindowDays: 30,
    returnDeadlineAt: addReturnWindow(orderDate, 30),
    returnLabelUrl,
    emailIntent: intent === 'other' ? 'return_label' : intent,
    parserTier: 'generic',
    confidence,
  };
}
