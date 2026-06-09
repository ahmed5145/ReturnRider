export function extractAmount(text: string): number | undefined {
  const match = text.match(/\$\s*([\d,]+\.?\d*)/);
  if (!match) return undefined;
  return parseFloat(match[1].replace(/,/g, ''));
}

export function extractOrderId(text: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const m = text.match(pattern);
    if (m?.[1]) return m[1];
  }
  return null;
}

export function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractReturnLabelUrl(html: string, text: string): string | null {
  const combined = `${html} ${text}`;
  const patterns = [
    /href=["'](https?:\/\/[^"']*(?:return|label|rma|ship)[^"']*)["']/i,
    /(https?:\/\/[^\s<>"']+(?:return|label|rma)[^\s<>"']*)/i,
  ];
  for (const pattern of patterns) {
    const m = combined.match(pattern);
    if (m?.[1] && m[1].length < 500) return m[1].replace(/&amp;/g, '&');
  }
  return null;
}

export function addReturnWindow(orderDate: Date, days: number): Date {
  const d = new Date(orderDate);
  d.setDate(d.getDate() + days);
  return d;
}
