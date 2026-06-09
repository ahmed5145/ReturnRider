import { Stack } from 'expo-router';
import { colors } from '../../lib/theme';

export default function ReturnsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bgCard },
        headerTintColor: colors.text,
        headerBackTitle: 'Dashboard',
        contentStyle: { backgroundColor: colors.bg },
      }}
    />
  );
}
