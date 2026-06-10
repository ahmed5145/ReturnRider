import type { EmailIntent } from './commerce-classifier';

export interface ParseScoreInput {
  intent: EmailIntent;
  merchantSpecific: boolean;
  hasOrderId: boolean;
  hasAmount: boolean;
  hasLabelUrl: boolean;
}

/** Central confidence score — used for auto-create vs review queue (threshold 0.85). */
export function scoreParseConfidence(input: ParseScoreInput): number {
  let score = 0.45;

  if (input.merchantSpecific) score += 0.12;
  if (input.hasOrderId) score += 0.18;

  switch (input.intent) {
    case 'return_label':
      score += 0.28;
      break;
    case 'refund':
      score += 0.22;
      break;
    case 'order_confirm':
      score += 0.12;
      break;
    case 'shipped':
      score -= 0.25;
      break;
    case 'other':
      score -= 0.2;
      break;
  }

  if (input.hasLabelUrl) score += 0.12;
  if (input.hasAmount) score += 0.04;

  return Math.round(Math.min(0.98, Math.max(0.32, score)) * 100) / 100;
}

export const MERCHANT_RETURN_WINDOWS: Record<string, number> = {
  Amazon: 30,
  ASOS: 28,
  Nike: 60,
  Target: 90,
  Walmart: 90,
  'Best Buy': 15,
  Gap: 45,
  'Old Navy': 45,
  Costco: 90,
  'Home Depot': 90,
};

export function returnWindowDaysFor(merchantName: string, fallback = 30): number {
  return MERCHANT_RETURN_WINDOWS[merchantName] ?? fallback;
}
