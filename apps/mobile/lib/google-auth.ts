import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { api } from './api';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '';

export async function connectGmail(syncDays: 90 | 180 = 90) {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error(
      'Set EXPO_PUBLIC_GOOGLE_CLIENT_ID in apps/mobile/.env (Google Cloud OAuth client)',
    );
  }

  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'returnrider' });
  const discovery = {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
  };

  const request = new AuthSession.AuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    redirectUri,
    scopes: ['openid', 'email', 'https://www.googleapis.com/auth/gmail.readonly'],
    usePKCE: true,
    responseType: AuthSession.ResponseType.Code,
    extraParams: { access_type: 'offline', prompt: 'consent' },
  });

  await request.makeAuthUrlAsync(discovery);
  const result = await request.promptAsync(discovery);

  if (result.type !== 'success' || !result.params.code) {
    throw new Error('Gmail connection cancelled or failed');
  }

  return api.connectEmail({
    provider: 'gmail',
    authorization_code: result.params.code,
    redirect_uri: redirectUri,
    code_verifier: request.codeVerifier ?? '',
    sync_days: syncDays,
  });
}
