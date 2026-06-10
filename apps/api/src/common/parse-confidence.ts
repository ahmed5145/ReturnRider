import type { EmailIntent } from '../parsers/commerce-classifier';

const INTENT_LABELS: Record<EmailIntent, string> = {
  return_label: 'return label mail',
  refund: 'refund confirmation',
  order_confirm: 'order confirmation',
  shipped: 'shipping update',
  other: 'shopping mail',
};

/** Human-readable explanation for parse-review confidence scores. */
export function explainParseConfidence(
  confidence: number,
  merchantGuess: string | null,
  emailIntent?: EmailIntent | null,
): string {
  const pct = Math.round(confidence * 100);
  const store = merchantGuess ? `${merchantGuess}` : 'unknown store';
  const intentLabel = emailIntent ? INTENT_LABELS[emailIntent] : 'return-related subject';

  if (pct >= 80) {
    return `High confidence (${pct}%) — ${intentLabel} from ${store}.`;
  }
  if (pct >= 50) {
    return `Medium confidence (${pct}%) — looks like ${intentLabel} but some details were unclear. Please verify.`;
  }
  return `Low confidence (${pct}%) — weak return signals from ${store}. Dismiss if this is marketing or a newsletter.`;
}
