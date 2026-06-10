import {
  classifyEmailIntent,
  intentCreatesReturn,
  isPromotionalOrNonReturnEmail,
} from '../commerce-classifier';
import { returnWindowDaysFor, scoreParseConfidence } from '../parse-scoring';
import { ParseInput, ParsedReceipt } from '../types';
import {
  addReturnWindow,
  extractAmount,
  extractOrderId,
  extractReturnLabelUrl,
  resolveOrderDate,
  stripHtml,
} from './parser-utils';

export interface MerchantParserConfig {
  merchantName: string;
  merchantDomain: string;
  orderIdPatterns: RegExp[];
  /** Override default from MERCHANT_RETURN_WINDOWS */
  returnWindowDays?: number;
  subjectPrefix?: RegExp;
}

/**
 * Shared merchant parser — order confirmations and return mail only.
 * Skips shipped-only notifications and promotional mail.
 */
export function parseMerchantReceipt(
  input: ParseInput,
  config: MerchantParserConfig,
): ParsedReceipt | null {
  if (isPromotionalOrNonReturnEmail(input.from, input.subject)) {
    return null;
  }

  const text = stripHtml(input.htmlBody) || input.textBody;
  const orderId = extractOrderId(text, config.orderIdPatterns);
  if (!orderId) {
    return null;
  }

  const intent = classifyEmailIntent(input.subject, text);
  if (intent === 'shipped' || intent === 'other') {
    return null;
  }

  if (!intentCreatesReturn(intent)) {
    return null;
  }

  const returnWindowDays =
    config.returnWindowDays ?? returnWindowDaysFor(config.merchantName);
  const totalAmount = extractAmount(text);
  const returnLabelUrl =
    intent === 'return_label'
      ? (extractReturnLabelUrl(input.htmlBody, text) ?? undefined)
      : undefined;

  const confidence = scoreParseConfidence({
    intent,
    merchantSpecific: true,
    hasOrderId: true,
    hasAmount: totalAmount != null,
    hasLabelUrl: !!returnLabelUrl,
  });

  let itemSummary = input.subject;
  if (config.subjectPrefix) {
    itemSummary = itemSummary.replace(config.subjectPrefix, '').trim();
  }
  itemSummary = itemSummary.slice(0, 120);

  const orderDate = resolveOrderDate(input.emailDate);

  return {
    merchantName: config.merchantName,
    merchantDomain: config.merchantDomain,
    externalOrderId: orderId,
    orderDate,
    totalAmount,
    currency: 'USD',
    itemSummary,
    returnWindowDays,
    returnDeadlineAt: addReturnWindow(orderDate, returnWindowDays),
    returnLabelUrl,
    emailIntent: intent,
    parserTier: 'merchant',
    confidence,
  };
}
