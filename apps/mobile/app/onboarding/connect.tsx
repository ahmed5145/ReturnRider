import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { connectGmail } from '../../lib/google-auth';

export default function ConnectEmailScreen() {
  const [loading, setLoading] = useState(false);
  const [sync180, setSync180] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      await connectGmail(sync180 ? 180 : 90);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connect Gmail</Text>
      <Text style={styles.body}>
        One-time read-only connection. We only fetch shopping-related messages—not personal
        mail. You can disconnect anytime in Settings.
      </Text>

      <View style={styles.row}>
        <Text style={styles.rowLabel}>Scan last 180 days (optional)</Text>
        <Switch value={sync180} onValueChange={setSync180} />
      </View>
      <Text style={styles.hint}>
        Default is 90 days. Enabling 180 imports more history but reads more email.
      </Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.btn} onPress={onConnect} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Connect with Google</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#16213e', padding: 24, paddingTop: 40 },
  title: { fontSize: 22, fontWeight: '700', color: '#fff' },
  body: { color: '#c0c0d0', lineHeight: 22, marginVertical: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  rowLabel: { color: '#fff', flex: 1, paddingRight: 12 },
  hint: { color: '#888', fontSize: 12, marginTop: 8 },
  error: { color: '#ff6b6b', marginTop: 12 },
  btn: {
    backgroundColor: '#4285F4',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
  },
  btnText: { color: '#fff', fontWeight: '600' },
});
