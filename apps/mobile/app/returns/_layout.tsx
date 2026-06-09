import { Stack } from 'expo-router';
import { colors } from '../../lib/theme';

export default function ReturnsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bgCard },
        headerTintColor: colors.text,
        headerBackTitle: 'Back',
        headerShown: true,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="[id]" options={{ title: 'Return details' }} />
    </Stack>
  );
}
