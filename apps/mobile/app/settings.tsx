import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link, router, Stack, useFocusEffect } from 'expo-router';
import { legalUrl } from '../lib/api-base';
import { api, ensureAuthToken } from '../lib/api';
import { colors } from '../lib/theme';

interface LinkedEmail {
  id: string;
  email_address: string;
  provider: string;
  status: string;
  sync_window_days?: number;
  last_sync_at?: string | null;
  last_error?: string | null;
  review_pending_count?: number;
  last_sync_messages_scanned?: number;
  last_sync_returns_created?: number;
}

export default function SettingsScreen() {
  const [emails, setEmails] = useState<LinkedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);

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

  const syncNow = async (id: string) => {
    setSyncingId(id);
    try {
      await api.syncEmail(id);
      await load();
    } finally {
      setSyncingId(null);
    }
  };

  const disconnect = async (id: string) => {
    await api.disconnectEmail(id);
    load();
  };

  const formatLastSync = (iso: string | null | undefined) => {
    if (!iso) return 'Never synced';
    const d = new Date(iso);
    const mins = Math.round((Date.now() - d.getTime()) / 60000);
    if (mins < 2) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
    return d.toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const header = (
    <>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.section}>Privacy & data</Text>
      <View style={styles.privacyCard}>
        <Text style={styles.privacyItem}>✓ Read-only Gmail — shopping mail only</Text>
        <Text style={styles.privacyItem}>✓ We never sell your email data</Text>
        <Text style={styles.privacyItem}>✓ Disconnect any inbox anytime</Text>
        <Pressable onPress={() => Linking.openURL(legalUrl('privacy'))}>
          <Text style={styles.legalLink}>Privacy Policy →</Text>
        </Pressable>
        <Pressable onPress={() => Linking.openURL(legalUrl('terms'))}>
          <Text style={styles.legalLink}>Terms of Service →</Text>
        </Pressable>
      </View>
      <Text style={styles.section}>Connected emails</Text>
      <Text style={styles.hint}>
        Read-only shopping mail. Disconnect anytime — we never sell your data.
      </Text>
    </>
  );

  const footer = (
    <>
      <Link href="/onboarding/connect" style={styles.addBtn}>
        <Text style={styles.addBtnText}>+ Add another email</Text>
      </Link>
      <Pressable style={styles.back} onPress={() => router.replace('/')}>
        <Text style={styles.backText}>Back to dashboard</Text>
      </Pressable>
    </>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Settings' }} />
      <FlatList
        data={emails}
        keyExtractor={(e) => e.id}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        ListEmptyComponent={<Text style={styles.empty}>No emails connected yet.</Text>}
        contentContainerStyle={styles.scroll}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.email}>{item.email_address}</Text>
            <Text style={styles.meta}>
              {item.provider} · {item.status}
              {item.sync_window_days ? ` · ${item.sync_window_days}d scan` : ''}
            </Text>
            <Text style={styles.meta}>Last sync: {formatLastSync(item.last_sync_at)}</Text>
            {item.last_sync_messages_scanned != null && item.status === 'connected' && (
              <Text style={styles.meta}>
                Scanned {item.last_sync_messages_scanned} emails · {item.last_sync_returns_created}{' '}
                returns · {item.review_pending_count ?? 0} to review
              </Text>
            )}
            {item.last_error && (
              <Text style={styles.errorText}>Sync error: {item.last_error}</Text>
            )}
            <View style={styles.row}>
              <Pressable onPress={() => syncNow(item.id)} disabled={syncingId === item.id}>
                {syncingId === item.id ? (
                  <ActivityIndicator color={colors.accent} />
                ) : (
                  <Text style={styles.syncLink}>Sync now</Text>
                )}
              </Pressable>
              <Pressable onPress={() => disconnect(item.id)}>
                <Text style={styles.disconnect}>Disconnect</Text>
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
  scroll: { padding: 24, paddingTop: 16, paddingBottom: 40 },
  privacyCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  privacyItem: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
  legalLink: { color: colors.accent, fontWeight: '600', fontSize: 14, marginTop: 8 },
  center: { flex: 1, justifyContent: 'center', backgroundColor: colors.bg },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 24 },
  section: { color: colors.text, fontWeight: '600', fontSize: 16 },
  hint: { color: colors.textMuted, fontSize: 13, marginBottom: 12, marginTop: 4, lineHeight: 18 },
  card: {
    backgroundColor: colors.bgCard,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  email: { color: colors.text, fontWeight: '600' },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  errorText: { color: '#ff6b6b', fontSize: 12, marginTop: 6 },
  row: { flexDirection: 'row', gap: 20, marginTop: 10, alignItems: 'center' },
  syncLink: { color: colors.accent, fontWeight: '600', fontSize: 14 },
  disconnect: { color: '#ff6b6b', fontSize: 14 },
  empty: { color: colors.textDim, marginVertical: 16 },
  addBtn: {
    borderWidth: 1,
    borderColor: colors.accent,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  addBtnText: { color: colors.accent, fontWeight: '600' },
  back: { marginTop: 24, alignItems: 'center' },
  backText: { color: colors.textDim },
});
