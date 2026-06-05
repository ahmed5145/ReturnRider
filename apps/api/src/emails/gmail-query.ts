export function buildCommerceQuery(syncWindowDays: 90 | 180 = 90): string {
  const window = syncWindowDays === 180 ? '180d' : '90d';
  return `newer_than:${window} (subject:(order OR receipt OR confirmation OR return OR refund OR shipment OR tracking) OR from:(noreply OR no-reply OR orders OR shipping OR returns))`;
}

export const GMAIL_COMMERCE_QUERY = buildCommerceQuery(90);
