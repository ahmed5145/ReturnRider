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

const ORDER_ID_PATTERN =
  /(?:order\s*#?|order\s*number|order\s*id)[:\s#]*([A-Z0-9-]{6,})/i;

export function isCommerceEmail(from: string, subject: string): boolean {
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
