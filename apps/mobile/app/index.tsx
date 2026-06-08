import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link, router, useFocusEffect } from 'expo-router';
import { trackEvent } from '../lib/analytics';
import { api, ensureAuthToken } from '../lib/api';
import { hasCelebratedFirstReturn, markFirstReturnCelebrated } from '../lib/celebration';
import { registerForPushNotifications } from '../lib/notifications';
import { colors } from '../lib/theme';
import { formatDaysRemaining, getUrgencyColor } from '../lib/urgency';

type StatusFilter = 'all_active' | 'ready_to_ship' | 'awaiting_refund';

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all_active', label: 'All' },
  { id: 'ready_to_ship', label: 'Ship soon' },
  { id: 'awaiting_refund', label: 'Awaiting refund' },
];

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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewPending, setReviewPending] = useState(0);
  const [inboxSyncing, setInboxSyncing] = useState(false);
  const [linkedCount, setLinkedCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all_active');
  const [showCelebration, setShowCelebration] = useState(false);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      await ensureAuthToken();
      const me = await api.getMe();
      if (!me.onboarding_completed) {
        router.replace('/welcome');
        return;
      }
      setReviewPending(me.review_pending_count ?? 0);
      setInboxSyncing(me.inbox_syncing ?? false);
      setLinkedCount(me.linked_emails?.length ?? 0);
      await registerForPushNotifications();
      const res = await api.getActiveReturns(
        statusFilter === 'all_active' ? undefined : statusFilter,
      );
      setReturns(res.data);
      if (res.data.length > 0 && !(await hasCelebratedFirstReturn())) {
        trackEvent('first_return_visible', { count: res.data.length });
        await markFirstReturnCelebrated();
        setShowCelebration(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [statusFilter]),
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const refundTotal = returns.reduce((sum, r) => sum + (r.expected_refund_amount ?? 0), 0);

  const nextDeadline = returns
    .filter((r) => r.days_remaining != null && r.days_remaining >= 0)
    .sort((a, b) => (a.days_remaining ?? 999) - (b.days_remaining ?? 999))[0];

  return (
    <View style={styles.container}>
      <Modal visible={showCelebration} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalEmoji}>🎉</Text>
            <Text style={styles.modalTitle}>You&apos;re protected</Text>
            <Text style={styles.modalBody}>
              We&apos;ll remind you before your return deadlines — so refunds don&apos;t slip away.
            </Text>
            <Pressable style={styles.modalBtn} onPress={() => setShowCelebration(false)}>
              <Text style={styles.modalBtnText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <View style={styles.header}>
        <Text style={styles.title}>ReturnRider</Text>
        <Link href="/settings">
          <Text style={styles.settings}>Settings</Text>
        </Link>
      </View>

      {inboxSyncing && (
        <View style={styles.syncChip}>
          <Text style={styles.syncChipText}>Scanning shopping mail…</Text>
        </View>
      )}

      {nextDeadline && nextDeadline.days_remaining != null && nextDeadline.days_remaining <= 7 && (
        <Link href={`/returns/${nextDeadline.id}`} asChild>
          <Pressable style={styles.deadlineBanner}>
            <Text style={styles.deadlineBannerTitle}>
              Next up: {nextDeadline.merchant_name} — {formatDaysRemaining(nextDeadline.days_remaining)}
            </Text>
            <Text style={styles.deadlineBannerSub}>
              Tap for details · Push reminders need the ReturnRider app (not Expo Go)
            </Text>
          </Pressable>
        </Link>
      )}

      {reviewPending > 0 && (
        <Link href="/parse-review" asChild>
          <Pressable style={styles.reviewBanner}>
            <Text style={styles.reviewBannerTitle}>
              {reviewPending} receipt{reviewPending === 1 ? '' : 's'} need a quick look
            </Text>
            <Text style={styles.reviewBannerSub}>Tap to confirm and start tracking</Text>
          </Pressable>
        </Link>
      )}

      <Text style={styles.subtitle}>
        {refundTotal > 0
          ? `$${refundTotal.toFixed(0)} in refunds to protect`
          : 'Active returns & deadlines'}
      </Text>

      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.id}
            style={[styles.filterChip, statusFilter === f.id && styles.filterChipActive]}
            onPress={() => setStatusFilter(f.id)}
          >
            <Text
              style={[
                styles.filterText,
                statusFilter === f.id && styles.filterTextActive,
              ]}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={returns}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.accent} />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            {inboxSyncing ? (
              <>
                <Text style={styles.emptyTitle}>Scanning your inboxes</Text>
                <Text style={styles.empty}>
                  We&apos;re reading the last 90 days of shopping mail. Returns and review items
                  will appear here shortly.
                </Text>
              </>
            ) : linkedCount > 0 ? (
              <>
                <Text style={styles.emptyTitle}>No returns on your dashboard yet</Text>
                <Text style={styles.empty}>
                  Sync finished but we didn&apos;t auto-detect return deadlines. Check review
                  items above, or add a return manually.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.emptyTitle}>No returns yet</Text>
                <Text style={styles.empty}>
                  Connect Gmail to auto-import from receipts, or add a return manually if you
                  have a paper receipt.
                </Text>
                <Link href="/onboarding/connect" style={styles.emptyLink}>
                  Connect email
                </Link>
              </>
            )}
            <Link href="/add-return" style={styles.emptyLink}>
              Add manually
            </Link>
            <Link href="/scan-receipt" style={styles.emptyLink}>
              Scan receipt
            </Link>
          </View>
        }
        renderItem={({ item }) => {
          const borderColor = getUrgencyColor(item.days_remaining);
          return (
            <Link href={`/returns/${item.id}`} asChild>
              <Pressable style={[styles.card, { borderLeftColor: borderColor }]}>
                <View style={styles.cardRow}>
                  <Text style={styles.merchant}>{item.merchant_name}</Text>
                  {item.has_wallet_pass && <Text style={styles.walletIcon}>📲</Text>}
                </View>
                <Text style={styles.item}>{item.item_summary}</Text>
                <Text style={[styles.meta, { color: borderColor }]}>
                  {formatDaysRemaining(item.days_remaining)}
                  {item.expected_refund_amount != null
                    ? ` · $${item.expected_refund_amount.toFixed(2)}`
                    : ''}
                </Text>
              </Pressable>
            </Link>
          );
        }}
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
  container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: colors.text },
  settings: { color: colors.accent, fontSize: 14 },
  syncChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  syncChipText: { color: colors.accent, fontSize: 12, fontWeight: '600' },
  reviewBanner: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  reviewBannerTitle: { color: colors.text, fontWeight: '600', fontSize: 15 },
  reviewBannerSub: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: 8, marginTop: 12 },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  filterText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: colors.accent },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  walletIcon: { fontSize: 16 },
  merchant: { fontSize: 18, fontWeight: '600', color: colors.text, flex: 1 },
  item: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  meta: { fontSize: 12, color: colors.accent, marginTop: 8 },
  emptyBox: { padding: 20, alignItems: 'center' },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '600', marginBottom: 8 },
  empty: { color: colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 16 },
  emptyLink: { color: colors.accent, marginVertical: 6, fontSize: 15 },
  error: { color: '#ff6b6b', marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.accent,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionSecondary: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.accent },
  actionText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  deadlineBanner: {
    backgroundColor: 'rgba(245, 166, 35, 0.12)',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#f5a623',
  },
  deadlineBannerTitle: { color: colors.text, fontWeight: '600', fontSize: 14 },
  deadlineBannerSub: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 32,
  },
  modalCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
  },
  modalEmoji: { fontSize: 48 },
  modalTitle: { color: colors.text, fontSize: 22, fontWeight: '700', marginTop: 12 },
  modalBody: {
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 10,
  },
  modalBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  modalBtnText: { color: '#fff', fontWeight: '700' },
});
