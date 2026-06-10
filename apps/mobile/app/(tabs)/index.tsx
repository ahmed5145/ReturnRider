import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link, router, useFocusEffect } from 'expo-router';
import { ReturnListCard } from '../../components/ReturnListCard';
import { DashboardSkeleton } from '../../components/DashboardSkeleton';
import { trackEvent } from '../../lib/analytics';
import { api, ensureAuthToken, formatNetworkError } from '../../lib/api';
import { hasCelebratedFirstReturn, markFirstReturnCelebrated } from '../../lib/celebration';
import { getActiveCampaign } from '../../lib/campaigns';
import { registerForPushNotifications } from '../../lib/notifications';
import { tryApplyPendingReferral } from '../../lib/pending-referral';
import { useTheme } from '../../lib/ThemeProvider';
import type { ThemeColors } from '../../lib/themes';
import { formatDaysRemaining } from '../../lib/urgency';

type StatusFilter = 'all_active' | 'ready_to_ship' | 'awaiting_refund' | 'completed';

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all_active', label: 'All' },
  { id: 'ready_to_ship', label: 'Ship soon' },
  { id: 'awaiting_refund', label: 'Awaiting refund' },
  { id: 'completed', label: 'Completed' },
];

interface ReturnStats {
  at_risk_amount: number;
  active_count: number;
  refunded_ytd: number;
  refunded_all_time: number;
  completed_count: number;
}

interface ReturnSummary {
  id: string;
  merchant_name: string;
  item_summary: string;
  status: string;
  /** Active returns only */
  return_deadline_at?: string | null;
  days_remaining?: number | null;
  has_wallet_pass?: boolean;
  expected_refund_amount: number | null;
  /** Completed returns only */
  refund_amount?: number | null;
  refunded_at?: string | null;
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [returns, setReturns] = useState<ReturnSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewPending, setReviewPending] = useState(0);
  const [inboxSyncing, setInboxSyncing] = useState(false);
  const [linkedCount, setLinkedCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all_active');
  const [showCelebration, setShowCelebration] = useState(false);
  const [stats, setStats] = useState<ReturnStats | null>(null);
  const [nextUp, setNextUp] = useState<ReturnSummary | null>(null);
  const [snoozingId, setSnoozingId] = useState<string | null>(null);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      await ensureAuthToken();
      await tryApplyPendingReferral();
      const me = await api.getMe();
      if (!me.onboarding_completed) {
        router.replace('/welcome');
        return;
      }
      setReviewPending(me.review_pending_count ?? 0);
      setInboxSyncing(me.inbox_syncing ?? false);
      setLinkedCount(me.linked_emails?.length ?? 0);
      void registerForPushNotifications().catch(() => {});
      const statsPromise = api.getReturnStats();
      const activePromise = api.getActiveReturns();
      const listPromise =
        statusFilter === 'completed'
          ? api.getCompletedReturns()
          : statusFilter === 'all_active'
            ? activePromise
            : api.getActiveReturns(statusFilter);

      const [statsRes, activeRes, returnsRes] = await Promise.all([
        statsPromise,
        activePromise,
        listPromise,
      ]);

      setStats(statsRes);
      setReturns(returnsRes.data);
      const nearest = activeRes.data
        .filter((r) => r.days_remaining != null && r.days_remaining >= 0)
        .sort((a, b) => (a.days_remaining ?? 999) - (b.days_remaining ?? 999))[0];
      setNextUp(nearest ?? null);
      if (returnsRes.data.length > 0 && !(await hasCelebratedFirstReturn())) {
        trackEvent('first_return_visible', { count: returnsRes.data.length });
        await markFirstReturnCelebrated();
        setShowCelebration(true);
      }
    } catch (e) {
      setError(formatNetworkError(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      void load().catch(() => {});
    }, [statusFilter]),
  );

  const quickSnooze = async (id: string) => {
    setSnoozingId(id);
    try {
      await api.snoozeReturn(id, '24h');
      trackEvent('dashboard_snooze');
      await load(true);
    } catch (e) {
      Alert.alert('Cannot snooze', e instanceof Error ? e.message : 'Try again');
    } finally {
      setSnoozingId(null);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  const campaign = getActiveCampaign();

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

      <Text style={styles.title}>ReturnRider</Text>

      {campaign && (
        <View style={styles.campaignBanner}>
          <Text style={styles.campaignTitle}>{campaign.title}</Text>
          <Text style={styles.campaignBody}>{campaign.body}</Text>
        </View>
      )}

      {inboxSyncing && (
        <View style={styles.syncChip}>
          <Text style={styles.syncChipText}>Scanning shopping mail…</Text>
        </View>
      )}

      {nextUp && nextUp.days_remaining != null && nextUp.days_remaining <= 7 && (
        <Link href={`/returns/${nextUp.id}`} asChild>
          <Pressable style={styles.deadlineBanner}>
            <Text style={styles.deadlineBannerTitle}>
              Next up: {nextUp.merchant_name} —{' '}
              {formatDaysRemaining(nextUp.days_remaining)}
            </Text>
            <Text style={styles.deadlineBannerSub}>
              Tap for details · Push reminders need the dev build app
            </Text>
          </Pressable>
        </Link>
      )}

      {stats && statusFilter === 'completed' && (
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Refunds recovered</Text>
          <View style={styles.heroRow}>
            <View style={styles.heroStat}>
              <Text style={[styles.heroAmount, { color: colors.success }]}>
                ${stats.refunded_ytd.toFixed(0)}
              </Text>
              <Text style={styles.heroSub}>refunded YTD</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroAmount}>${stats.refunded_all_time.toFixed(0)}</Text>
              <Text style={styles.heroSub}>all time</Text>
            </View>
          </View>
          <Text style={styles.heroFoot}>
            {stats.completed_count} completed return{stats.completed_count === 1 ? '' : 's'}
          </Text>
        </View>
      )}

      {stats && statusFilter !== 'completed' && (
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Money protected</Text>
          <View style={styles.heroRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroAmount}>${stats.at_risk_amount.toFixed(0)}</Text>
              <Text style={styles.heroSub}>at risk</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={[styles.heroAmount, { color: colors.success }]}>
                ${stats.refunded_ytd.toFixed(0)}
              </Text>
              <Text style={styles.heroSub}>refunded YTD</Text>
            </View>
          </View>
          {stats.completed_count > 0 && (
            <Text style={styles.heroFoot}>
              {stats.completed_count} completed · ${stats.refunded_all_time.toFixed(0)} all time
            </Text>
          )}
        </View>
      )}

      {reviewPending > 0 && statusFilter !== 'completed' && (
        <Link href="/parse-review" asChild>
          <Pressable style={styles.reviewBanner}>
            <Text style={styles.reviewBannerTitle}>
              {reviewPending} email{reviewPending === 1 ? '' : 's'} to review
            </Text>
            <Text style={styles.reviewBannerSub}>
              Confirm real return receipts only — dismiss marketing mail
            </Text>
          </Pressable>
        </Link>
      )}

      <Text style={styles.subtitle}>
        {statusFilter === 'completed'
          ? 'Refund history'
          : stats && stats.at_risk_amount > 0
            ? `${stats.active_count} active return${stats.active_count === 1 ? '' : 's'}`
            : 'Active returns & deadlines'}
      </Text>

      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.id}
            style={[styles.filterChip, statusFilter === f.id && styles.filterChipActive]}
            onPress={() => setStatusFilter(f.id)}
          >
            <Text style={[styles.filterText, statusFilter === f.id && styles.filterTextActive]}>
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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={colors.accent}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            {statusFilter === 'completed' ? (
              <>
                <Text style={styles.emptyTitle}>No completed returns yet</Text>
                <Text style={styles.empty}>
                  When you confirm a refund, it&apos;ll show up here as proof you got paid.
                </Text>
              </>
            ) : inboxSyncing ? (
              <>
                <Text style={styles.emptyTitle}>Scanning your inboxes</Text>
                <Text style={styles.empty}>
                  We&apos;re reading shopping mail. Returns will appear here shortly.
                </Text>
              </>
            ) : linkedCount > 0 ? (
              <>
                <Text style={styles.emptyTitle}>No returns on your dashboard yet</Text>
                <Text style={styles.empty}>
                  Check review items or add a return manually.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.emptyTitle}>No returns yet</Text>
                <Text style={styles.empty}>
                  Connect Gmail or add a return from the + tab.
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
        renderItem={({ item }) => (
          <ReturnListCard
            item={item}
            completed={statusFilter === 'completed'}
            onSnooze={statusFilter === 'completed' ? undefined : quickSnooze}
            snoozingId={snoozingId}
          />
        )}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 56, backgroundColor: colors.bg },
  title: { fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: 4 },
  campaignBanner: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  campaignTitle: { color: colors.text, fontWeight: '700', fontSize: 14 },
  campaignBody: { color: colors.textMuted, fontSize: 13, marginTop: 6, lineHeight: 18 },
  syncChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  syncChipText: { color: colors.accent, fontSize: 12, fontWeight: '600' },
  heroCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 18,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroLabel: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center' },
  heroStat: { flex: 1, alignItems: 'center' },
  heroAmount: { fontSize: 28, fontWeight: '800', color: colors.text },
  heroSub: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  heroDivider: { width: 1, height: 40, backgroundColor: colors.border },
  heroFoot: {
    color: colors.textDim,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 14,
  },
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
  emptyBox: { padding: 20, alignItems: 'center' },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '600', marginBottom: 8 },
  empty: { color: colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 16 },
  emptyLink: { color: colors.accent, marginVertical: 6, fontSize: 15 },
  error: { color: '#ff6b6b', marginBottom: 12 },
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
}
