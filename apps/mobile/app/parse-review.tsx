import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, Stack, useFocusEffect } from 'expo-router';
import { trackEvent } from '../lib/analytics';
import { api, ensureAuthToken, formatNetworkError } from '../lib/api';
import { colors } from '../lib/theme';

interface ReviewItem {
  id: string;
  merchant_guess: string | null;
  raw_snippet: string | null;
  confidence: number;
  confidence_reason?: string;
}

export default function ParseReviewScreen() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      await ensureAuthToken();
      const res = await api.listParseReview();
      setItems(res.data);
    } catch (e) {
      Alert.alert('Could not load', formatNetworkError(e));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      void load().catch(() => {});
    }, []),
  );

  const confirm = async (id: string) => {
    setActing(id);
    try {
      const res = await api.confirmParseReview(id, {});
      trackEvent('parse_review_confirmed');
      await load();
      if (res.return_created) {
        Alert.alert('Added', 'Return is now on your dashboard.');
        router.replace('/');
      } else {
        Alert.alert(
          'Already tracked',
          'This order was already on your account. Try another item or add manually.',
        );
      }
    } catch (e) {
      Alert.alert('Could not add', e instanceof Error ? e.message : 'Try again');
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

  const dismissAll = () => {
    Alert.alert(
      'Clear review queue?',
      'This marks all pending items as not returns. Use this to clear marketing emails from a prior sync.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear all',
          style: 'destructive',
          onPress: async () => {
            setActing('all');
            try {
              const res = await api.dismissAllParseReview();
              await load();
              Alert.alert('Cleared', `${res.dismissed} items dismissed.`);
            } finally {
              setActing(null);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Review receipts' }} />
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Review receipts' }} />
      <Text style={styles.sub}>
        Only confirm emails that are real return or refund receipts. Everything else → Not a return.
      </Text>

      {items.length > 0 && (
        <Pressable style={styles.clearAll} onPress={dismissAll} disabled={acting === 'all'}>
          <Text style={styles.clearAllText}>
            {acting === 'all' ? 'Clearing…' : `Clear all ${items.length} (not returns)`}
          </Text>
        </Pressable>
      )}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>Nothing to review — you&apos;re all caught up.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.merchant}>{item.merchant_guess ?? 'Unknown store'}</Text>
            <Text style={styles.snippet}>{item.raw_snippet ?? 'Receipt email'}</Text>
            <Text style={styles.confidence}>
              {item.confidence_reason ??
                `${Math.round(item.confidence * 100)}% match — verify before tracking`}
            </Text>
            <View style={styles.row}>
              <Pressable
                style={styles.confirmBtn}
                onPress={() => confirm(item.id)}
                disabled={!!acting}
              >
                {acting === item.id ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmText}>Track return</Text>
                )}
              </Pressable>
              <Pressable onPress={() => dismiss(item.id)} disabled={!!acting}>
                <Text style={styles.dismiss}>Not a return</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', backgroundColor: colors.bg },
  sub: {
    color: colors.textMuted,
    paddingHorizontal: 24,
    paddingTop: 8,
    lineHeight: 20,
    fontSize: 14,
  },
  clearAll: {
    marginHorizontal: 24,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  clearAllText: { color: colors.textDim, fontWeight: '600', fontSize: 13 },
  list: { padding: 24, paddingTop: 16, paddingBottom: 40 },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  merchant: { color: colors.text, fontWeight: '600', fontSize: 16 },
  snippet: { color: colors.textMuted, marginTop: 6, fontSize: 13, lineHeight: 18 },
  confidence: { color: colors.textDim, fontSize: 12, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 },
  confirmBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  confirmText: { color: '#fff', fontWeight: '600' },
  dismiss: { color: colors.textDim, fontSize: 14 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 40 },
});
