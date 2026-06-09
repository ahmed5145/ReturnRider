import Constants from 'expo-constants';
import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';

export function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

/**
 * URI registered in Google Console (http/https only for Web clients).
 */
export function getGoogleRedirectUri(): string {
  if (process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI) {
    return process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI;
  }

  if (Platform.OS === 'web') {
    return AuthSession.makeRedirectUri({ preferLocalhost: true });
  }

  if (isExpoGo()) {
    const owner = Constants.expoConfig?.owner ?? 'ahmed5145';
    const slug = Constants.expoConfig?.slug ?? 'returnrider';
    return `https://auth.expo.io/@${owner}/${slug}`;
  }

  return AuthSession.makeRedirectUri({ scheme: 'returnrider', path: 'oauth' });
}

/**
 * Where Expo Go / dev client expects the browser to land after auth.expo.io forwards the code.
 */
export function getAppReturnUri(): string {
  return AuthSession.getDefaultReturnUrl();
}

export function getProxyStartUrl(authUrl: string, googleRedirectUri: string, appReturnUri: string): string {
  const params = new URLSearchParams({ authUrl, returnUrl: appReturnUri });
  return `${googleRedirectUri}/start?${params.toString()}`;
}
