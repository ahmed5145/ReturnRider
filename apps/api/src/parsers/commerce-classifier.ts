/** Known retailer domains (from address or body links). */
export const RETAILER_DOMAINS = [
  'amazon.com',
  'asos.com',
  'nike.com',
  'target.com',
  'walmart.com',
  'bestbuy.com',
  'gap.com',
  'oldnavy.com',
  'bananarepublic.com',
  'athleta.com',
  'homedepot.com',
  'costco.com',
  'shopify.com',
  'myshopify.com',
  'ebay.com',
  'etsy.com',
  'kohls.com',
  'macys.com',
  'nordstrom.com',
  'wayfair.com',
  'ikea.com',
  'sephora.com',
  'ulta.com',
  'chewy.com',
];

const COMMERCE_KEYWORDS =
  /order|receipt|confirmation|return|refund|shipment|tracking|invoice|delivered/i;

const RETURN_KEYWORDS =
  /return|refund|exchange|rma|return label|returnable|send back|money back/i;

/** Marketing, account, and non-purchase mail — never parse as returns. */
const PROMO_EXCLUDE =
  /promotional credit|gift card balance|newsletter|recommendation|deal of the day|deal of|%\s*off|save up to|shop now|limited time|ends tonight|your daily|picked for you|deals for you|top deals|amazon recommends|sponsored|marketing|survey|review your purchase|rate your|password|sign[- ]?in|verify your|security alert|unsubscribe|view in browser|daily digest|weekly digest|abandoned cart|items? (you|we) (love|picked)|still interested|price drop|back in stock|members? only|exclusive offer|flash sale|clearance event|last chance|don't miss|trending now|new arrivals|shop our|special offer/i;

const MARKETING_SENDER =
  /(?:^|[<\s])(?:deals|marketing|promo|newsletter|offers|sale)@/i;

const SHIPPED_ONLY_SUBJECT =
  /^(your )?(package|order|item).*(shipped|on the way|out for delivery|has shipped|is on its way)/i;

const ORDER_ID_PATTERN =
  /(?:order\s*#?|order\s*number|order\s*id|confirmation\s*#?)[:\s#]*([A-Z0-9-]{6,})/i;

export type EmailIntent =
  | 'return_label'
  | 'refund'
  | 'order_confirm'
  | 'shipped'
  | 'other';

export function isPromotionalOrNonReturnEmail(from: string, subject: string): boolean {
  const combined = `${from} ${subject}`.toLowerCase();
  if (PROMO_EXCLUDE.test(combined)) {
    return true;
  }
  if (MARKETING_SENDER.test(from) && !isReturnRelatedSubject(subject)) {
    return true;
  }
  return false;
}

export function isReturnRelatedSubject(subject: string): boolean {
  return RETURN_KEYWORDS.test(subject);
}

export function fromKnownRetailer(from: string): boolean {
  const fromLower = from.toLowerCase();
  return RETAILER_DOMAINS.some((d) => fromLower.includes(d));
}

/**
 * Gmail already pre-filters; this is a second pass before parsing.
 * Removed blanket `noreply` match — that caused marketing false positives.
 */
export function isCommerceEmail(from: string, subject: string): boolean {
  if (isPromotionalOrNonReturnEmail(from, subject)) {
    return false;
  }

  if (fromKnownRetailer(from)) {
    return true;
  }

  const keywordMatch = COMMERCE_KEYWORDS.test(subject);
  if (!keywordMatch) {
    return false;
  }

  // Unknown sender: only continue if subject looks return/refund related.
  return isReturnRelatedSubject(subject);
}

export function classifyEmailIntent(subject: string, bodyText = ''): EmailIntent {
  const combined = `${subject} ${bodyText}`.slice(0, 2000).toLowerCase();

  if (
    /return label|start (a |your )?return|return authorization|return instructions|print your label|rma\b|return shipping label/i.test(
      combined,
    )
  ) {
    return 'return_label';
  }

  if (/refund (issued|processed|complete)|your refund|money back|reimbursement/i.test(combined)) {
    return 'refund';
  }

  if (
    /order confirm|thank you for (your )?order|order receipt|order placed|order received|we received your order|thanks for your order/i.test(
      combined,
    )
  ) {
    return 'order_confirm';
  }

  if (
    SHIPPED_ONLY_SUBJECT.test(subject) ||
    /out for delivery|delivered today|package arrived|on its way to you/i.test(subject)
  ) {
    return 'shipped';
  }

  if (isReturnRelatedSubject(subject)) {
    return 'return_label';
  }

  return 'other';
}

/** Whether this intent should create a tracked return with a deadline. */
export function intentCreatesReturn(intent: EmailIntent): boolean {
  return intent === 'return_label' || intent === 'refund' || intent === 'order_confirm';
}

export function extractGenericOrderId(text: string): string | null {
  const match = text.match(ORDER_ID_PATTERN);
  return match?.[1] ?? null;
}
