import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link, router, useFocusEffect } from 'expo-router';
import { api, ensureAuthToken } from '../lib/api';
import { colors } from '../lib/theme';

interface ReviewItem {
  id: string;
  merchant_guess: string | null;
  raw_snippet: string | null;
  confidence: number;
}

export default function ParseReviewScreen() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    await ensureAuthToken();
    const res = await api.listParseReview();
    setItems(res.data);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );

  const confirm = async (id: string) => {
    setActing(id);
    try {
      await api.confirmParseReview(id, {});
      await load();
      router.replace('/');
    } finally {
      setActing(null);
    }
  };

  const dismiss = async (id: string) => {
    setActing(id);
    try {
      await api.dismissParseReview(id);
      await load();
    } finally {
      setActing(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick review</Text>
      <Text style={styles.sub}>
        We found shopping emails that need a quick look before we track them.
      </Text>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.empty}>Nothing to review — you&apos;re all caught up.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.merchant}>{item.merchant_guess ?? 'Unknown store'}</Text>
            <Text style={styles.snippet} numberOfLines={2}>
              {item.raw_snippet ?? 'Receipt email'}
            </Text>
            <Text style={styles.confidence}>
              {Math.round(item.confidence * 100)}% match — confirm to track
            </Text>
            <View style={styles.row}>
              <Pressable
                style={styles.confirmBtn}
                onPress={() => confirm(item.id)}
                disabled={acting === item.id}
              >
                {acting === item.id ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmText}>Yes, track this</Text>
                )}
              </Pressable>
              <Pressable onPress={() => dismiss(item.id)} disabled={acting === item.id}>
                <Text style={styles.dismiss}>Not a return</Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      <Link href="/" style={styles.back}>
        <Text style={styles.backText}>Back to dashboard</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 24, paddingTop: 56 },
  center: { flex: 1, justifyContent: 'center', backgroundColor: colors.bg },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  sub: { color: colors.textMuted, marginTop: 8, marginBottom: 20, lineHeight: 20 },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  merchant: { color: colors.text, fontWeight: '600', fontSize: 16 },
  snippet: { color: colors.textMuted, marginTop: 6, fontSize: 13 },
  confidence: { color: colors.accent, fontSize: 12, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 },
  confirmBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 130,
    alignItems: 'center',
  },
  confirmText: { color: '#fff', fontWeight: '600' },
  dismiss: { color: colors.textDim, fontSize: 14 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 40 },
  back: { marginTop: 16, alignItems: 'center' },
  backText: { color: colors.textDim },
});
