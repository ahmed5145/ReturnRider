import { ParseInput, ParsedReceipt } from '../types';
import { extractGenericOrderId, isCommerceEmail } from './commerce-classifier';
import { extractAmount } from './merchants/parser-utils';
import { parseReceipt } from './merchants/index';

export function parseReceiptText(text: string, subject = 'Receipt'): ParsedReceipt | null {
  const synthetic: ParseInput = {
    from: 'receipt@scan.local',
    subject,
    htmlBody: '',
    textBody: text,
  };

  if (text.includes('@')) {
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch) synthetic.from = emailMatch[0];
  }

  const parsed = parseReceipt(synthetic);
  if (parsed) return parsed;

  if (!isCommerceEmail(synthetic.from, subject) && !extractGenericOrderId(text)) {
    return null;
  }

  const orderId = extractGenericOrderId(text) ?? `MANUAL-${Date.now()}`;
  return {
    merchantName: 'Unknown Store',
    externalOrderId: orderId,
    totalAmount: extractAmount(text),
    currency: 'USD',
    itemSummary: subject.slice(0, 120) || 'Scanned receipt',
    returnWindowDays: 30,
    confidence: 0.7,
  };
}

export function parseReceiptFromOcrText(rawText: string): ParsedReceipt | null {
  return parseReceiptText(rawText, 'Scanned receipt');
}
