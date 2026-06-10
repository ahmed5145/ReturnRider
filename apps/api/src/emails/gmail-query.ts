export function buildCommerceQuery(syncWindowDays: 90 | 180 = 90): string {
  const window = syncWindowDays === 180 ? '180d' : '90d';
  const subjectClause =
    'subject:(order OR receipt OR confirmation OR return OR refund OR shipment OR tracking OR delivered)';
  const fromClause =
    'from:(amazon OR target OR walmart OR bestbuy OR nike OR asos OR gap OR oldnavy OR homedepot OR costco OR kohls OR macys OR wayfair OR ebay OR etsy OR shopify)';
  const exclude = '-category:promotions -category:social -category:updates';
  return `newer_than:${window} (${subjectClause} OR ${fromClause}) ${exclude}`;
}

export const GMAIL_COMMERCE_QUERY = buildCommerceQuery(90);
