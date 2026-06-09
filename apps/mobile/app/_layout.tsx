import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
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
