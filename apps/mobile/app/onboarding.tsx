import { StyleSheet, Text, View, Pressable, Linking } from 'react-native';
import { Link } from 'expo-router';

export default function OnboardingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connect your email</Text>
      <Text style={styles.body}>
        We only read shopping-related emails using read-only access. Your personal
        messages are never sold or used for advertising.
      </Text>
      <Text style={styles.scopes}>
        Gmail scope: gmail.readonly{'\n'}
        Filters: order, receipt, return, tracking
      </Text>

      <Pressable
        style={styles.button}
        onPress={() =>
          Linking.openURL(
            'https://accounts.google.com/o/oauth2/v2/auth?scope=gmail.readonly',
          )
        }
      >
        <Text style={styles.buttonText}>Connect Gmail (OAuth)</Text>
      </Pressable>

      <Link href="/" style={styles.back}>
        <Text style={styles.backText}>Back to dashboard</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 80, backgroundColor: '#16213e' },
  title: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 16 },
  body: { fontSize: 16, color: '#c0c0d0', lineHeight: 24, marginBottom: 20 },
  scopes: {
    fontSize: 13,
    color: '#888',
    fontFamily: 'monospace',
    marginBottom: 32,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#4285F4',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  back: { marginTop: 24, alignItems: 'center' },
  backText: { color: '#e94560' },
});
