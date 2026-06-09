import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Platform } from 'react-native';

export default function RootLayout() {
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

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#1a2332' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: '#0f1419' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Dashboard', headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="returns" options={{ headerShown: false }} />
        <Stack.Screen
          name="settings"
          options={{ title: 'Settings', headerBackTitle: 'Dashboard' }}
        />
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
