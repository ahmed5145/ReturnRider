import { getApiOrigin } from './api-base';

export interface ApiHealth {
  status: string;
  service?: string;
  features?: {
    plaid?: boolean;
    gmail?: boolean;
  };
}

export async function fetchApiHealth(): Promise<ApiHealth> {
  const res = await fetch(`${getApiOrigin()}/health`);
  if (!res.ok) {
    throw new Error(`Health check failed (${res.status})`);
  }
  return res.json() as Promise<ApiHealth>;
}
