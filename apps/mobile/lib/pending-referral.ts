import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import { api } from './api';

const KEY = 'pending_referral_code';

export function parseReferralFromUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = Linking.parse(url);
    const ref = parsed.queryParams?.ref;
    if (typeof ref === 'string' && ref.trim()) {
      return ref.trim().toUpperCase();
    }
    if (Array.isArray(ref) && ref[0]) {
      return String(ref[0]).trim().toUpperCase();
    }
  } catch {
    return null;
  }
  return null;
}

export async function captureReferralFromUrl(url: string | null): Promise<void> {
  const code = parseReferralFromUrl(url);
  if (code) {
    await SecureStore.setItemAsync(KEY, code);
  }
}

export async function tryApplyPendingReferral(): Promise<boolean> {
  const code = await SecureStore.getItemAsync(KEY);
  if (!code) return false;
  try {
    await api.applyReferralCode(code);
    await SecureStore.deleteItemAsync(KEY);
    return true;
  } catch {
    return false;
  }
}
