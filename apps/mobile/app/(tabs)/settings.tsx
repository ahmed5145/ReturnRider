import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { legalUrl } from '../../lib/api-base';
import { router } from 'expo-router';
import { api, clearAuthToken, ensureAuthToken } from '../../lib/api';
import { getInviteShareMessage } from '../../lib/invite';
import { openUrl } from '../../lib/open-url';
import { connectPlaidBank } from '../../lib/plaid-link';
import { registerForPushNotifications } from '../../lib/notifications';
import { colors } from '../../lib/theme';

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
  const [hasPush, setHasPush] = useState(false);
  const [hasPlaid, setHasPlaid] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [plaidLoading, setPlaidLoading] = useState(false);

  const load = async () => {
    await ensureAuthToken();
    const [res, me] = await Promise.all([api.listEmails(), api.getMe()]);
    setEmails(res.data);
    setHasPush(me.has_push_token);
    setHasPlaid(me.has_plaid_linked);
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

  const enablePush = async () => {
    setPushLoading(true);
    const token = await registerForPushNotifications();
    setHasPush(!!token);
    setPushLoading(false);
    if (!token) {
      Alert.alert(
        'Notifications need dev build',
        'Expo Go cannot receive push on SDK 53+. Use your Android dev build APK.',
      );
    }
  };

  const sendTestPush = async () => {
    setPushLoading(true);
    try {
      const res = await api.testPush();
      if (res.sent) {
        Alert.alert('Sent', 'Check your notification tray.');
      } else {
        Alert.alert('Not sent', res.reason ?? 'Enable notifications first.');
      }
    } catch (e) {
      Alert.alert('Failed', e instanceof Error ? e.message : 'Try again');
    } finally {
      setPushLoading(false);
    }
  };

  const linkBank = async () => {
    setPlaidLoading(true);
    try {
      const ok = await connectPlaidBank();
      if (ok) {
        Alert.alert('Bank linked', 'We\'ll scan for refunds and match them to your returns.');
        await load();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Try again';
      Alert.alert(
        'Bank linking unavailable',
        msg.includes('not configured') || msg.includes('503')
          ? 'Plaid sandbox is not set up on the server yet. Sandbox is free at dashboard.plaid.com — add PLAID_CLIENT_ID and PLAID_SECRET on Render.'
          : msg,
      );
    } finally {
      setPlaidLoading(false);
    }
  };

  const inviteFriends = async () => {
    await Share.share({ message: getInviteShareMessage() });
  };

  const openLegal = async (path: 'privacy' | 'terms') => {
    try {
      await openUrl(legalUrl(path));
    } catch (e) {
      Alert.alert('Could not open link', e instanceof Error ? e.message : 'Try again');
    }
  };

  const resetSession = async () => {
    await clearAuthToken();
    router.replace('/');
  };

  const downloadMyData = async () => {
    try {
      const data = await api.exportMyData();
      const json = JSON.stringify(data, null, 2);
      await Share.share({
        message: json,
        title: 'ReturnRider data export',
      });
    } catch (e) {
      Alert.alert('Export failed', e instanceof Error ? e.message : 'Try again');
    }
  };

  const deleteMyAccount = () => {
    Alert.alert(
      'Delete account?',
      'This disconnects Gmail, removes your profile, and signs you out. Returns stay in our backup for 30 days per our privacy policy, then are purged.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.deleteAccount();
              if (!res.deleted) {
                Alert.alert('Not deleted', res.error ?? 'Try again');
                return;
              }
              await clearAuthToken();
              Alert.alert('Account deleted', 'You have been signed out.');
              router.replace('/welcome');
            } catch (e) {
              Alert.alert('Failed', e instanceof Error ? e.message : 'Try again');
            }
          },
        },
      ],
    );
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

      <Text style={styles.section}>Invite</Text>
      <Pressable style={styles.inviteCard} onPress={inviteFriends}>
        <Text style={styles.inviteTitle}>Protect a friend&apos;s refund</Text>
        <Text style={styles.hint}>Share ReturnRider — help someone never miss a deadline.</Text>
      </Pressable>

      <Text style={styles.section}>Account</Text>
      <Pressable style={styles.inviteCard} onPress={resetSession}>
        <Text style={styles.inviteTitle}>Reset session</Text>
        <Text style={styles.hint}>
          Use after switching API (local ↔ staging). Clears saved login and signs in again.
        </Text>
      </Pressable>

      <Text style={styles.section}>Privacy & data</Text>
      <View style={styles.privacyCard}>
        <Text style={styles.privacyItem}>✓ Read-only Gmail — shopping mail only</Text>
        <Text style={styles.privacyItem}>✓ We never sell your email data</Text>
        <Text style={styles.privacyItem}>✓ Disconnect any inbox anytime</Text>
        <Pressable onPress={() => openLegal('privacy')}>
          <Text style={styles.legalLink}>Privacy Policy →</Text>
        </Pressable>
        <Pressable onPress={() => openLegal('terms')}>
          <Text style={styles.legalLink}>Terms of Service →</Text>
        </Pressable>
        <Pressable onPress={downloadMyData} style={styles.dataAction}>
          <Text style={styles.legalLink}>Download my data (JSON) →</Text>
        </Pressable>
        <Pressable onPress={deleteMyAccount} style={styles.dataAction}>
          <Text style={styles.dangerLink}>Delete account →</Text>
        </Pressable>
      </View>

      <Text style={styles.section}>Notifications</Text>
      <View style={styles.notifCard}>
        <Text style={styles.notifStatus}>
          {hasPush ? '✓ Push reminders enabled' : 'Push reminders off'}
        </Text>
        <Text style={styles.hint}>
          T-7, T-3, and T-24h alerts. Requires Android dev build (not Expo Go).
        </Text>
        <View style={styles.row}>
          {!hasPush && (
            <Pressable onPress={enablePush} disabled={pushLoading}>
              <Text style={styles.syncLink}>
                {pushLoading ? 'Enabling…' : 'Enable notifications'}
              </Text>
            </Pressable>
          )}
          {hasPush && (
            <Pressable onPress={sendTestPush} disabled={pushLoading}>
              <Text style={styles.syncLink}>Send test push</Text>
            </Pressable>
          )}
        </View>
      </View>

      <Text style={styles.section}>Refund radar (optional)</Text>
      <View style={styles.notifCard}>
        <Text style={styles.notifStatus}>
          {hasPlaid ? '✓ Bank linked' : 'Not connected'}
        </Text>
        <Text style={styles.hint}>
          Auto-detect when refunds hit your account. Uses Plaid sandbox in dev.
        </Text>
        <View style={styles.row}>
          {!hasPlaid && (
            <Pressable onPress={linkBank} disabled={plaidLoading}>
              <Text style={styles.syncLink}>
                {plaidLoading ? 'Opening…' : 'Connect bank'}
              </Text>
            </Pressable>
          )}
          {hasPlaid && (
            <Pressable
              onPress={async () => {
                try {
                  const res = await api.plaidSync();
                  Alert.alert(
                    'Sync complete',
                    `Scanned ${res.synced} txs · ${res.matches?.length ?? 0} matches.`,
                  );
                } catch (e) {
                  Alert.alert('Sync failed', e instanceof Error ? e.message : 'Try again');
                }
              }}
            >
              <Text style={styles.syncLink}>Sync refunds now</Text>
            </Pressable>
          )}
        </View>
      </View>

      <Text style={styles.section}>Connected emails</Text>
      <Text style={styles.hint}>
        Read-only shopping mail. Disconnect anytime.
      </Text>
    </>
  );

  const footer = (
    <Link href="/onboarding/connect" style={styles.addBtn}>
      <Text style={styles.addBtnText}>+ Add another email</Text>
    </Link>
  );

  return (
    <View style={styles.container}>
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
  scroll: { padding: 24, paddingTop: 56, paddingBottom: 24 },
  privacyCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  inviteCard: {
    backgroundColor: colors.accentSoft,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  inviteTitle: { color: colors.text, fontWeight: '700', fontSize: 15 },
  privacyItem: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
  notifCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  notifStatus: { color: colors.text, fontWeight: '600', fontSize: 14 },
  legalLink: { color: colors.accent, fontWeight: '600', fontSize: 14, marginTop: 8 },
  dataAction: { marginTop: 4 },
  dangerLink: { color: '#ff6b6b', fontWeight: '600', fontSize: 14, marginTop: 8 },
  center: { flex: 1, justifyContent: 'center', backgroundColor: colors.bg },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 16 },
  section: { color: colors.text, fontWeight: '600', fontSize: 16, marginTop: 4 },
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
    marginBottom: 16,
  },
  addBtnText: { color: colors.accent, fontWeight: '600' },
});
