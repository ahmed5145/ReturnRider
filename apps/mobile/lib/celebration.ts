import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const KEY = 'celebrated_first_return';

export async function hasCelebratedFirstReturn(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return typeof localStorage !== 'undefined' && localStorage.getItem(KEY) === '1';
  }
  const v = await SecureStore.getItemAsync(KEY);
  return v === '1';
}

export async function markFirstReturnCelebrated(): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, '1');
    return;
  }
  await SecureStore.setItemAsync(KEY, '1');
}
