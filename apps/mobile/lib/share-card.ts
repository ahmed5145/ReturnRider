import { getInviteShareMessage } from './invite';

/** Formatted share text for refund wins (MKT-01). */
export function buildRefundShareMessage(
  amount: number,
  merchant: string,
  refundedYtd?: number,
): string {
  const lines = [
    '💰 Refund secured with ReturnRider',
    '',
    `$${amount.toFixed(2)} back from ${merchant}`,
  ];
  if (refundedYtd != null && refundedYtd > 0) {
    lines.push(`$${refundedYtd.toFixed(0)} protected YTD`);
  }
  lines.push('', getInviteShareMessage());
  return lines.join('\n');
}
