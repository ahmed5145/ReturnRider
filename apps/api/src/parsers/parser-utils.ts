import type { ParsedReceipt } from './types';

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

/** Gmail API internalDate is milliseconds since epoch as string. */
export function parseGmailInternalDate(internalDate: string | null | undefined): Date | undefined {
  if (internalDate == null || internalDate === '') return undefined;
  const ms = Number(internalDate);
  if (!Number.isFinite(ms) || ms <= 0) return undefined;
  return new Date(ms);
}

export function resolveOrderDate(emailDate?: Date): Date {
  if (emailDate && !Number.isNaN(emailDate.getTime())) {
    return emailDate;
  }
  return new Date();
}

/** Recompute deadline from email order date (not sync time). */
export function applyEmailDateToReceipt(parsed: ParsedReceipt, emailDate?: Date): ParsedReceipt {
  const orderDate = resolveOrderDate(emailDate ?? parsed.orderDate);
  const windowDays = parsed.returnWindowDays ?? 30;
  return {
    ...parsed,
    orderDate,
    returnDeadlineAt: parsed.returnDeadlineAt
      ? addReturnWindow(orderDate, windowDays)
      : parsed.returnDeadlineAt,
  };
}
