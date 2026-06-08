const RETAILER_DOMAINS = [
  'amazon.com',
  'asos.com',
  'nike.com',
  'target.com',
  'walmart.com',
  'bestbuy.com',
  'gap.com',
  'oldnavy.com',
  'homedepot.com',
  'costco.com',
  'shopify.com',
  'ebay.com',
];

const COMMERCE_KEYWORDS =
  /order|receipt|confirmation|return|refund|shipment|tracking|invoice/i;

const RETURN_KEYWORDS =
  /return|refund|exchange|rma|return label|returnable|send back|money back/i;

const PROMO_EXCLUDE =
  /promotional credit|gift card|newsletter|recommendation|deal of|%\s*off|marketing|survey|review your purchase|rate your|password|sign[- ]?in|verify your|security alert/i;

const ORDER_ID_PATTERN =
  /(?:order\s*#?|order\s*number|order\s*id)[:\s#]*([A-Z0-9-]{6,})/i;

export function isPromotionalOrNonReturnEmail(from: string, subject: string): boolean {
  const combined = `${from} ${subject}`.toLowerCase();
  return PROMO_EXCLUDE.test(combined);
}

export function isReturnRelatedSubject(subject: string): boolean {
  return RETURN_KEYWORDS.test(subject);
}

export function isCommerceEmail(from: string, subject: string): boolean {
  if (isPromotionalOrNonReturnEmail(from, subject)) {
    return false;
  }
  const fromLower = from.toLowerCase();
  const domainMatch = RETAILER_DOMAINS.some(
    (d) => fromLower.includes(d) || fromLower.includes('orders@') || fromLower.includes('noreply'),
  );
  const keywordMatch = COMMERCE_KEYWORDS.test(subject);
  return domainMatch || keywordMatch;
}

export function extractGenericOrderId(text: string): string | null {
  const match = text.match(ORDER_ID_PATTERN);
  return match?.[1] ?? null;
}
