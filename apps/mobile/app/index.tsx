import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link } from 'expo-router';
import { api, getAuthToken, setAuthToken } from '../lib/api';

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
      let token = await getAuthToken();
      if (!token) {
        const dev = await api.devToken('dev-user', 'dev@returnrider.com');
        await setAuthToken(dev.token);
        token = dev.token;
      }
      try {
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
      <Text style={styles.title}>ReturnRider</Text>
      <Text style={styles.subtitle}>Active returns & deadlines</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={returns}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No active returns. Connect your email to get started.
          </Text>
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

      <Link href="/onboarding" style={styles.cta}>
        <Text style={styles.ctaText}>Connect Email</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#16213e' },
  title: { fontSize: 28, fontWeight: '700', color: '#fff' },
  subtitle: { fontSize: 14, color: '#a0a0b0', marginBottom: 20 },
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
  empty: { color: '#888', textAlign: 'center', marginTop: 40 },
  error: { color: '#ff6b6b', marginBottom: 12 },
  cta: {
    backgroundColor: '#e94560',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  ctaText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
