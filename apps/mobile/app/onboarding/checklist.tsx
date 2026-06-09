import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { trackEvent } from '../../lib/analytics';
import { api, ensureAuthToken, formatNetworkError } from '../../lib/api';
import { registerForPushNotifications } from '../../lib/notifications';
import { connectPlaidBank } from '../../lib/plaid-link';
import { useTheme } from '../../lib/ThemeProvider';
import type { ThemeColors } from '../../lib/themes';

const SETUP_STEPS = 4;

export default function ChecklistScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { connected } = useLocalSearchParams<{ connected?: string }>();
  const [linked, setLinked] = useState(0);
  const [returns, setReturns] = useState(0);
  const [reviewPending, setReviewPending] = useState(0);
  const [pushDone, setPushDone] = useState(false);
  const [plaidDone, setPlaidDone] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [plaidLoading, setPlaidLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(true);

  const refreshProgress = useCallback(async () => {
    setRefreshing(true);
    try {
      await ensureAuthToken();
      const me = await api.getMe();
      setLinked(me.linked_emails.length);
      setReturns(me.returns_count);
      setReviewPending(me.review_pending_count ?? 0);
      setPushDone(me.has_push_token);
      setPlaidDone(me.has_plaid_linked);
    } catch (e) {
      console.warn('Checklist refresh failed:', formatNetworkError(e));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshProgress().catch(() => {});
    }, [refreshProgress]),
  );

  const enablePush = async () => {
    setPushLoading(true);
    const token = await registerForPushNotifications();
    setPushDone(!!token);
    setPushLoading(false);
  };

  const linkBank = async () => {
    setPlaidLoading(true);
    try {
      const ok = await connectPlaidBank();
      if (ok) {
        await refreshProgress();
      }
    } catch (e) {
      Alert.alert('Bank linking', e instanceof Error ? e.message : 'Try again');
    } finally {
      setPlaidLoading(false);
    }
  };

  const finish = async () => {
    await api.completeOnboarding();
    trackEvent('onboarding_completed');
    router.replace('/');
  };

  const hasReturnValue = returns > 0 || reviewPending > 0;
  const stepsDone =
    (linked > 0 ? 1 : 0) +
    (hasReturnValue ? 1 : 0) +
    (pushDone ? 1 : 0) +
    (plaidDone ? 1 : 0);
  const percent = Math.round((stepsDone / SETUP_STEPS) * 100);

  const protectionHint = (() => {
    if (refreshing) return null;
    if (percent === 100) return "100% protected — you're all set!";
    if (!plaidDone && stepsDone >= 2) {
      return `${percent}% protected — connect bank for refund radar?`;
    }
    if (stepsDone === 0) return '0% — start with Gmail to auto-find returns';
    return `${percent}% protected — finish the steps below`;
  })();

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Almost there</Text>
      <Text style={styles.title}>Set up in under 2 minutes</Text>
      <Text style={styles.sub}>
        One-time setup. Connect once, then returns appear automatically.
      </Text>

      {connected && (
        <View style={styles.successBanner}>
          <Text style={styles.successTitle}>Gmail connected</Text>
          <Text style={styles.successBody}>
            Scanning last 90 days of shopping mail for {connected}…
          </Text>
        </View>
      )}

      <View style={styles.progressCard}>
        <Text style={styles.progressText}>
          {refreshing ? 'Updating…' : `${percent}% protected · ${stepsDone} of ${SETUP_STEPS}`}
        </Text>
        {protectionHint && <Text style={styles.progressHint}>{protectionHint}</Text>}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${percent}%` }]} />
        </View>
      </View>

      <View style={[styles.item, linked > 0 && styles.itemDone]}>
        <Text style={styles.check}>{linked > 0 ? '✓' : '1'}</Text>
        <View style={styles.flex}>
          <Text style={styles.itemTitle}>Connect Gmail</Text>
          <Text style={styles.itemBody}>
            {linked > 0
              ? `${linked} inbox${linked === 1 ? '' : 'es'} connected — syncing receipts in the background.`
              : 'Auto-import orders & return QR codes (read-only).'}
          </Text>
          <Link href="/onboarding/connect" style={styles.link}>
            {linked > 0 ? 'Add another inbox →' : 'Connect Gmail →'}
          </Link>
        </View>
      </View>

      <View style={[styles.item, hasReturnValue && styles.itemDone]}>
        <Text style={styles.check}>{hasReturnValue ? '✓' : '2'}</Text>
        <View style={styles.flex}>
          <Text style={styles.itemTitle}>See your first return</Text>
          <Text style={styles.itemBody}>
            {reviewPending > 0
              ? `${reviewPending} receipt${reviewPending === 1 ? '' : 's'} need a quick review.`
              : returns > 0
                ? `${returns} return${returns === 1 ? '' : 's'} on your dashboard.`
                : 'From email sync, review queue, manual entry, or scan.'}
          </Text>
          <View style={styles.linkRow}>
            {reviewPending > 0 && (
              <>
                <Link href="/parse-review" style={styles.link}>
                  Review receipts
                </Link>
                <Text style={styles.sep}> · </Text>
              </>
            )}
            <Link href="/add-return" style={styles.link}>
              Add manually
            </Link>
            <Text style={styles.sep}> · </Text>
            <Link href="/scan-receipt" style={styles.link}>
              Scan
            </Link>
          </View>
        </View>
      </View>

      <View style={[styles.item, pushDone && styles.itemDone]}>
        <Text style={styles.check}>{pushDone ? '✓' : '3'}</Text>
        <View style={styles.flex}>
          <Text style={styles.itemTitle}>Turn on reminders</Text>
          <Text style={styles.itemBody}>Push alerts before deadlines—not inbox spam.</Text>
          {!pushDone && (
            <Pressable onPress={enablePush} disabled={pushLoading}>
              {pushLoading ? (
                <ActivityIndicator color={colors.accent} />
              ) : (
                <Text style={styles.link}>Enable notifications →</Text>
              )}
            </Pressable>
          )}
        </View>
      </View>

      <View style={[styles.item, plaidDone && styles.itemDone]}>
        <Text style={styles.check}>{plaidDone ? '✓' : '4'}</Text>
        <View style={styles.flex}>
          <Text style={styles.itemTitle}>Refund radar (optional)</Text>
          <Text style={styles.itemBody}>
            {plaidDone
              ? 'Bank linked — we\'ll match deposits to your returns.'
              : 'Detect when refunds hit your account. Requires Android dev build (not Expo Go).'}
          </Text>
          {!plaidDone && (
            <Pressable onPress={linkBank} disabled={plaidLoading}>
              {plaidLoading ? (
                <ActivityIndicator color={colors.accent} />
              ) : (
                <Text style={styles.link}>Connect bank →</Text>
              )}
            </Pressable>
          )}
        </View>
      </View>

      <Pressable style={styles.btn} onPress={finish}>
        <Text style={styles.btnText}>Go to dashboard</Text>
      </Pressable>
      <Text style={styles.footer}>You can finish setup later from Settings</Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg, padding: 24, paddingTop: 56 },
    eyebrow: { color: colors.accent, fontWeight: '600', fontSize: 13, textTransform: 'uppercase' },
    title: { fontSize: 26, fontWeight: '700', color: colors.text, marginTop: 6 },
    sub: { color: colors.textMuted, marginBottom: 20, marginTop: 8, lineHeight: 20 },
    successBanner: {
      backgroundColor: 'rgba(61, 214, 140, 0.1)',
      borderRadius: 12,
      padding: 14,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.success,
    },
    successTitle: { color: colors.success, fontWeight: '700', fontSize: 15 },
    successBody: { color: colors.textMuted, fontSize: 13, marginTop: 4, lineHeight: 18 },
    progressCard: {
      backgroundColor: colors.bgCard,
      borderRadius: 12,
      padding: 14,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    progressText: { color: colors.text, fontWeight: '600', fontSize: 14 },
    progressHint: { color: colors.textMuted, fontSize: 13, marginTop: 6, lineHeight: 18 },
    progressBar: {
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      overflow: 'hidden',
      marginTop: 10,
    },
    progressFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 3 },
    item: {
      flexDirection: 'row',
      marginBottom: 16,
      gap: 14,
      backgroundColor: colors.bgCard,
      padding: 16,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    itemDone: { borderColor: colors.success, backgroundColor: 'rgba(61, 214, 140, 0.08)' },
    check: {
      color: colors.accent,
      fontSize: 16,
      fontWeight: '700',
      width: 28,
      height: 28,
      lineHeight: 28,
      textAlign: 'center',
      backgroundColor: colors.accentSoft,
      borderRadius: 14,
      overflow: 'hidden',
    },
    flex: { flex: 1 },
    itemTitle: { color: colors.text, fontWeight: '600', fontSize: 16 },
    itemBody: {
      color: colors.textMuted,
      fontSize: 13,
      marginTop: 4,
      marginBottom: 8,
      lineHeight: 18,
    },
    linkRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
    link: { color: colors.accent, fontSize: 14, fontWeight: '600' },
    sep: { color: colors.textDim },
    btn: {
      backgroundColor: colors.accent,
      padding: 18,
      borderRadius: 14,
      alignItems: 'center',
      marginTop: 'auto',
    },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    footer: { color: colors.textDim, textAlign: 'center', marginTop: 12, fontSize: 12 },
  });
}
