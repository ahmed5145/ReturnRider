import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';

/** Opens http(s) links — WebBrowser works better than Linking on iOS for API-hosted pages. */
export async function openUrl(url: string): Promise<void> {
  try {
    await WebBrowser.openBrowserAsync(url);
  } catch {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      throw new Error(`Unable to open URL: ${url}`);
    }
    await Linking.openURL(url);
  }
}
