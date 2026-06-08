import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { api } from './api';
import {
  getAppReturnUri,
  getGoogleRedirectUri,
  getProxyStartUrl,
  isExpoGo,
} from './google-redirect';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '';

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

function formatAuthFailure(result: AuthSession.AuthSessionResult): string {
  if (result.type === 'error') {
    const msg = result.error?.message ?? result.params?.error_description ?? result.params?.error;
    if (msg) return `Gmail OAuth error: ${msg}`;
  }
  if (result.type === 'success' && result.error) {
    return `Gmail OAuth error: ${result.error.message ?? 'state mismatch'}`;
  }
  if (result.type === 'dismiss') {
    return (
      'Gmail sign-in closed before finishing. In Expo Go this often means the auth redirect failed. ' +
      'Try again, or use a development build (see docs/GOOGLE_OAUTH_SETUP.md).'
    );
  }
  if (result.type === 'cancel') {
    return 'Gmail sign-in was cancelled.';
  }
  return `Gmail connection failed (${result.type}).`;
}

async function promptGoogleAuth(
  request: AuthSession.AuthRequest,
): Promise<AuthSession.AuthSessionResult> {
  await request.makeAuthUrlAsync(discovery);
  const authUrl = request.url;
  if (!authUrl) {
    throw new Error('Failed to build Google authorization URL');
  }

  const googleRedirectUri = getGoogleRedirectUri();

  if (isExpoGo()) {
    const appReturnUri = getAppReturnUri();
    const startUrl = getProxyStartUrl(authUrl, googleRedirectUri, appReturnUri);

    if (__DEV__) {
      console.log('[Gmail OAuth] proxy start:', startUrl);
      console.log('[Gmail OAuth] app return:', appReturnUri);
      console.log('[Gmail OAuth] google redirect:', googleRedirectUri);
    }

    const browser = await WebBrowser.openAuthSessionAsync(startUrl, appReturnUri);
    if (browser.type !== 'success' || !browser.url) {
      return { type: browser.type === 'success' ? 'dismiss' : browser.type };
    }
    return request.parseReturnUrl(browser.url);
  }

  return request.promptAsync(discovery);
}

export async function connectGmail(syncDays: 90 | 180 = 90) {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error(
      'Set EXPO_PUBLIC_GOOGLE_CLIENT_ID in apps/mobile/.env (Google Cloud OAuth client)',
    );
  }

  const redirectUri = getGoogleRedirectUri();

  const request = new AuthSession.AuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    redirectUri,
    scopes: ['openid', 'email', 'https://www.googleapis.com/auth/gmail.readonly'],
    usePKCE: true,
    responseType: AuthSession.ResponseType.Code,
    extraParams: { access_type: 'offline', prompt: 'consent' },
  });

  const result = await promptGoogleAuth(request);

  if (result.type !== 'success' || !result.params.code) {
    throw new Error(formatAuthFailure(result));
  }

  return api.connectEmail({
    provider: 'gmail',
    authorization_code: result.params.code,
    redirect_uri: redirectUri,
    code_verifier: request.codeVerifier ?? '',
    sync_days: syncDays,
  });
}
