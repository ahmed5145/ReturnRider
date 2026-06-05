import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { api, ensureAuthToken } from '../lib/api';

interface LinkedEmail {
  id: string;
  email_address: string;
  provider: string;
  status: string;
  sync_window_days?: number;
}

export default function SettingsScreen() {
  const [emails, setEmails] = useState<LinkedEmail[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    await ensureAuthToken();
    const res = await api.listEmails();
    setEmails(res.data);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );

  const disconnect = async (id: string) => {
    await api.disconnectEmail(id);
    load();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#e94560" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <Text style={styles.section}>Connected emails</Text>
      <Text style={styles.hint}>
        Connect once per inbox. All accounts sync into one dashboard.
      </Text>

      <FlatList
        data={emails}
        keyExtractor={(e) => e.id}
        ListEmptyComponent={<Text style={styles.empty}>No emails connected yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.email}>{item.email_address}</Text>
            <Text style={styles.meta}>
              {item.provider} · {item.status}
              {item.sync_window_days ? ` · ${item.sync_window_days}d scan` : ''}
            </Text>
            <Pressable onPress={() => disconnect(item.id)}>
              <Text style={styles.disconnect}>Disconnect</Text>
            </Pressable>
          </View>
        )}
      />

      <Link href="/onboarding/connect" style={styles.addBtn}>
        <Text style={styles.addBtnText}>+ Add another email</Text>
      </Link>

      <Link href="/" style={styles.back}>
        <Text style={styles.backText}>Back to dashboard</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#16213e', padding: 24, paddingTop: 60 },
  center: { flex: 1, justifyContent: 'center', backgroundColor: '#16213e' },
  title: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 24 },
  section: { color: '#fff', fontWeight: '600', fontSize: 16 },
  hint: { color: '#888', fontSize: 13, marginBottom: 12, marginTop: 4 },
  card: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  email: { color: '#fff', fontWeight: '600' },
  meta: { color: '#888', fontSize: 12, marginTop: 4 },
  disconnect: { color: '#ff6b6b', marginTop: 8, fontSize: 14 },
  empty: { color: '#666', marginVertical: 16 },
  addBtn: {
    borderWidth: 1,
    borderColor: '#e94560',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  addBtnText: { color: '#e94560', fontWeight: '600' },
  back: { marginTop: 24, alignItems: 'center' },
  backText: { color: '#aaa' },
});
