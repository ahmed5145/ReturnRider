import { Stack } from 'expo-router';
import { useTheme } from '../../lib/ThemeProvider';

export default function ReturnsLayout() {
  const { colors } = useTheme();

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
