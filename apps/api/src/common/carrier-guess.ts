export function guessCarrier(trackingNumber: string): string {
  const t = trackingNumber.replace(/\s/g, '').toUpperCase();
  if (/^1Z/.test(t)) return 'ups';
  if (/^\d{12,22}$/.test(t) && t.startsWith('9')) return 'usps';
  if (/^\d{15}$/.test(t) || /^\d{20}$/.test(t)) return 'fedex';
  if (/^TBA/.test(t)) return 'amazon';
  return 'unknown';
}
