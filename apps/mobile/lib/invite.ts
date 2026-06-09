import { getApiOrigin } from './api-base';

const MARKETING_URL = process.env.EXPO_PUBLIC_MARKETING_URL ?? getApiOrigin();

export function getMarketingUrl(): string {
  return MARKETING_URL;
}

export function getReferralLink(code: string): string {
  const base = MARKETING_URL.replace(/\/$/, '');
  return `${base}?ref=${encodeURIComponent(code)}`;
}

export function getInviteShareMessage(referralCode?: string): string {
  const link = referralCode ? getReferralLink(referralCode) : MARKETING_URL;
  return (
    `I use ReturnRider to track return deadlines and never miss a refund. ` +
    `Check it out: ${link}`
  );
}
