import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';
const TOKEN_KEY = 'auth_token';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  if (res.headers.get('content-type')?.includes('application/json')) {
    return res.json();
  }
  return {} as T;
}

export async function getAuthToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setAuthToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
    }
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export const api = {
  devToken: (sub: string, email: string) =>
    request<{ token: string }>('/auth/dev-token', {
      method: 'POST',
      body: JSON.stringify({ sub, email }),
    }),

  getActiveReturns: () =>
    request<{ data: Array<{
      id: string;
      merchant_name: string;
      item_summary: string;
      status: string;
      days_remaining: number | null;
    }> }>('/returns/active'),

  getReturn: (id: string) => request<Record<string, unknown>>(`/returns/${id}`),

  connectEmail: (payload: {
    provider: string;
    authorization_code: string;
    redirect_uri: string;
    code_verifier: string;
    email_hint?: string;
  }) =>
    request('/emails/connect', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  createWalletPass: (id: string, platform: 'apple' | 'google') =>
    request<{ google_save_url?: string }>(`/returns/${id}/wallet-pass`, {
      method: 'POST',
      body: JSON.stringify({ platform }),
    }),

  plaidLinkToken: () => request<{ link_token: string }>('/plaid/link-token', { method: 'POST' }),
};
