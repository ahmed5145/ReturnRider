import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link, router } from 'expo-router';
import { api, ensureAuthToken } from '../lib/api';
import { registerForPushNotifications } from '../lib/notifications';

interface ReturnSummary {
  id: string;
  merchant_name: string;
  item_summary: string;
  status: string;
  return_deadline_at: string | null;
  days_remaining: number | null;
  has_wallet_pass: boolean;
  expected_refund_amount: number | null;
}

export default function HomeScreen() {
  const [returns, setReturns] = useState<ReturnSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await ensureAuthToken();
        const me = await api.getMe();
        if (!me.onboarding_completed) {
          router.replace('/welcome');
          return;
        }
        await registerForPushNotifications();
        const res = await api.getActiveReturns();
        setReturns(res.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#e94560" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ReturnRider</Text>
        <Link href="/settings">
          <Text style={styles.settings}>Settings</Text>
        </Link>
      </View>
      <Text style={styles.subtitle}>Active returns & deadlines</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={returns}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No returns yet</Text>
            <Text style={styles.empty}>
              Connect Gmail to auto-import from receipts, or add a return manually if you
              have a paper receipt.
            </Text>
            <Link href="/onboarding/connect" style={styles.emptyLink}>
              Connect email
            </Link>
            <Link href="/add-return" style={styles.emptyLink}>
              Add manually
            </Link>
            <Link href="/scan-receipt" style={styles.emptyLink}>
              Scan receipt
            </Link>
          </View>
        }
        renderItem={({ item }) => (
          <Link href={`/returns/${item.id}`} asChild>
            <Pressable style={styles.card}>
              <Text style={styles.merchant}>{item.merchant_name}</Text>
              <Text style={styles.item}>{item.item_summary}</Text>
              <Text style={styles.meta}>
                {item.days_remaining != null
                  ? `${item.days_remaining} days left`
                  : item.status}
              </Text>
            </Pressable>
          </Link>
        )}
      />

      <View style={styles.actions}>
        <Link href="/add-return" style={styles.actionBtn}>
          <Text style={styles.actionText}>+ Add return</Text>
        </Link>
        <Link href="/scan-receipt" style={[styles.actionBtn, styles.actionSecondary]}>
          <Text style={styles.actionText}>Scan receipt</Text>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: '#16213e' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#16213e' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: '#fff' },
  settings: { color: '#e94560', fontSize: 14 },
  subtitle: { fontSize: 14, color: '#a0a0b0', marginBottom: 20, marginTop: 4 },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#e94560',
  },
  merchant: { fontSize: 18, fontWeight: '600', color: '#fff' },
  item: { fontSize: 14, color: '#c0c0d0', marginTop: 4 },
  meta: { fontSize: 12, color: '#e94560', marginTop: 8 },
  emptyBox: { padding: 20, alignItems: 'center' },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 8 },
  empty: { color: '#888', textAlign: 'center', lineHeight: 22, marginBottom: 16 },
  emptyLink: { color: '#e94560', marginVertical: 6, fontSize: 15 },
  error: { color: '#ff6b6b', marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  actionBtn: {
    flex: 1,
    backgroundColor: '#e94560',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionSecondary: { backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#e94560' },
  actionText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
