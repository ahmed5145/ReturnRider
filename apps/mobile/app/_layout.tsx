import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from '../lib/ThemeProvider';
import { captureReferralFromUrl } from '../lib/pending-referral';

function RootNavigator() {
  const { colors, mode } = useTheme();

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { returnId?: string };
      if (data?.returnId) {
        router.push(`/returns/${data.returnId}`);
      }
    });

    return () => sub.remove();
  }, []);

  useEffect(() => {
    let sub: { remove: () => void } | undefined;
    void (async () => {
      const initial = await Linking.getInitialURL();
      await captureReferralFromUrl(initial);
      sub = Linking.addEventListener('url', (event) => {
        void captureReferralFromUrl(event.url);
      });
    })();
    return () => sub?.remove();
  }, []);

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bgCard },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="returns" options={{ headerShown: false }} />
        <Stack.Screen
          name="add-return"
          options={{ title: 'Add return', headerBackTitle: 'Dashboard' }}
        />
        <Stack.Screen
          name="parse-review"
          options={{ title: 'Review emails', headerBackTitle: 'Dashboard' }}
        />
        <Stack.Screen
          name="scan-receipt"
          options={{ title: 'Scan receipt', headerBackTitle: 'Dashboard' }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <RootNavigator />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
