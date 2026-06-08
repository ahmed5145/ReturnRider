import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

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

export async function ensureAuthToken(): Promise<string> {
  let token = await getAuthToken();
  if (!token) {
    const dev = await api.devToken('dev-user', 'dev@returnrider.com');
    await setAuthToken(dev.token);
    token = dev.token;
  }
  return token;
}

export const api = {
  devToken: (sub: string, email: string) =>
    request<{ token: string }>('/auth/dev-token', {
      method: 'POST',
      body: JSON.stringify({ sub, email }),
    }),

  getMe: () =>
    request<{
      onboarding_completed: boolean;
      linked_emails: Array<{
        id: string;
        email_address: string;
        status: string;
        last_sync_at?: string | null;
        last_error?: string | null;
      }>;
      returns_count: number;
      review_pending_count: number;
      inbox_syncing: boolean;
      has_push_token: boolean;
    }>('/users/me'),

  completeOnboarding: () =>
    request('/users/onboarding-complete', { method: 'POST', body: '{}' }),

  registerPushToken: (expo_push_token: string) =>
    request('/users/push-token', {
      method: 'POST',
      body: JSON.stringify({ expo_push_token }),
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

  createManualReturn: (payload: {
    merchant_name: string;
    external_order_id: string;
    item_summary: string;
    return_deadline_at?: string;
    return_window_days?: number;
    expected_refund_amount?: number;
  }) =>
    request<{ id: string }>('/returns/manual', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  parseReceiptText: (text: string) =>
    request<{ parsed: Record<string, unknown> | null; message?: string }>(
      '/returns/parse-receipt-text',
      { method: 'POST', body: JSON.stringify({ text }) },
    ),

  createFromReceiptText: (text: string) =>
    request<{ id: string }>('/returns/from-receipt-text', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  listEmails: () =>
    request<{
      data: Array<{
        id: string;
        email_address: string;
        provider: string;
        status: string;
        sync_window_days?: number;
        last_sync_at?: string | null;
        last_error?: string | null;
        last_sync_messages_scanned?: number;
        last_sync_returns_created?: number;
        last_sync_review_queued?: number;
        review_pending_count?: number;
        returns_from_inbox_count?: number;
      }>;
    }>('/emails'),

  syncEmail: (id: string) =>
    request<{ status: string; sync_job_id: string }>(`/emails/${id}/sync`, { method: 'POST' }),

  listParseReview: () =>
    request<{
      data: Array<{
        id: string;
        merchant_guess: string | null;
        raw_snippet: string | null;
        confidence: number;
        created_at: string;
      }>;
    }>('/parse-review'),

  confirmParseReview: (
    id: string,
    payload?: {
      merchant_name?: string;
      external_order_id?: string;
      item_summary?: string;
      expected_refund_amount?: number;
      return_deadline_at?: string;
    },
  ) =>
    request<{ confirmed: boolean; return_created: boolean }>(`/parse-review/${id}/confirm`, {
      method: 'POST',
      body: JSON.stringify(payload ?? {}),
    }),

  dismissParseReview: (id: string) =>
    request<{ dismissed: boolean }>(`/parse-review/${id}/dismiss`, { method: 'POST' }),

  disconnectEmail: (id: string) =>
    request(`/emails/${id}`, { method: 'DELETE' }),

  connectEmail: (payload: {
    provider: string;
    authorization_code: string;
    redirect_uri: string;
    code_verifier: string;
    email_hint?: string;
    sync_days?: 90 | 180;
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
