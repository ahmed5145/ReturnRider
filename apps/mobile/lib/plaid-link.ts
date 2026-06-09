import { Alert } from 'react-native';
import { api } from './api';

type PlaidSdk = {
  create: (config: { token: string }) => void;
  open: (config: {
    onSuccess: (success: { publicToken: string }) => void;
    onExit: () => void;
  }) => void;
};

function loadPlaidSdk(): PlaidSdk | null {
  try {
    return require('react-native-plaid-link-sdk') as PlaidSdk;
  } catch {
    return null;
  }
}

export async function connectPlaidBank(): Promise<boolean> {
  const sdk = loadPlaidSdk();
  if (!sdk) {
    Alert.alert(
      'Dev build required',
      'Bank linking uses Plaid native SDK. Install your Android dev build (not Expo Go), then try again.',
    );
    return false;
  }

  let link_token: string;
  try {
    ({ link_token } = await api.plaidLinkToken());
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg.includes('not configured') || msg.includes('503')) {
      Alert.alert(
        'Plaid not configured',
        'Add PLAID_CLIENT_ID and PLAID_SECRET on the API server. Plaid sandbox is free for development.',
      );
      return false;
    }
    throw e;
  }

  return new Promise((resolve) => {
    sdk.create({ token: link_token });
    sdk.open({
      onSuccess: async (success) => {
        try {
          await api.plaidExchange(success.publicToken);
          resolve(true);
        } catch (e) {
          Alert.alert('Link failed', e instanceof Error ? e.message : 'Try again');
          resolve(false);
        }
      },
      onExit: () => resolve(false),
    });
  });
}
