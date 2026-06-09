import { getApiOrigin } from './api-base';
import { fetchWithRetry } from './http';

export interface ApiHealth {
  status: string;
  service?: string;
  features?: {
    plaid?: boolean;
    gmail?: boolean;
  };
}

export async function fetchApiHealth(): Promise<ApiHealth> {
  const res = await fetchWithRetry(`${getApiOrigin()}/health`, { method: 'GET' });
  if (!res.ok) {
    throw new Error(`Health check failed (${res.status})`);
  }
  return res.json() as Promise<ApiHealth>;
}
