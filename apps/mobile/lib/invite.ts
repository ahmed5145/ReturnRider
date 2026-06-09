import { getApiOrigin } from './api-base';

const MARKETING_URL = process.env.EXPO_PUBLIC_MARKETING_URL ?? getApiOrigin();

export function getInviteShareMessage(): string {
  return (
    `I use ReturnRider to track return deadlines and never miss a refund. ` +
    `Check it out: ${MARKETING_URL}`
  );
}
