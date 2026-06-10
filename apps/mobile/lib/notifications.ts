import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api } from './api';
import { getDeviceTimezone } from './device-timezone';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function getExpoProjectId(): string | undefined {
  return (
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId
  );
}

/** Remote push is not available in Expo Go (SDK 53+). Use a dev build. */
export function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  if (isExpoGo()) {
    return null;
  }

  const projectId = getExpoProjectId();
  if (!projectId) {
    console.warn(
      'Push skipped: no EAS projectId. Run `npx eas init` in apps/mobile, then set EXPO_PUBLIC_EAS_PROJECT_ID in .env',
    );
    return null;
  }

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    await api.registerPushToken(token, getDeviceTimezone());
    return token;
  } catch (err) {
    console.warn('Push registration failed:', err);
    return null;
  }
}
