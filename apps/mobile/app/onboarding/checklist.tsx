import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { trackEvent } from '../../lib/analytics';
import { api, ensureAuthToken, formatNetworkError } from '../../lib/api';
import { isExpoGo, registerForPushNotifications } from '../../lib/notifications';
import { useTheme } from '../../lib/ThemeProvider';
import type { ThemeColors } from '../../lib/themes';

const SETUP_STEPS = 2;

export default function ChecklistScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { connected } = useLocalSearchParams<{ connected?: string }>();
  const [linked, setLinked] = useState(0);
  const [returns, setReturns] = useState(0);
  const [reviewPending, setReviewPending] = useState(0);
  const [pushDone, setPushDone] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
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

  const finish = async () => {
    await api.completeOnboarding();
    trackEvent('onboarding_completed');
    router.replace('/');
  };

  const gmailBody = (() => {
    if (!linked) {
      return 'Read-only access to order and return emails. We scan the last 90 days automatically.';
    }
    if (refreshing) return 'Checking your inbox…';
    if (reviewPending > 0) {
      return `${reviewPending} uncertain receipt${reviewPending === 1 ? '' : 's'} queued for review — you can confirm them on the dashboard later.`;
    }
    if (returns > 0) {
      return `${returns} return${returns === 1 ? '' : 's'} found so far. More appear as we sync in the background.`;
    }
    return 'Connected — scanning shopping mail in the background.';
  })();

  const stepsDone = (linked > 0 ? 1 : 0) + (pushDone ? 1 : 0);
  const percent = Math.round((stepsDone / SETUP_STEPS) * 100);

  const protectionHint = (() => {
    if (refreshing) return null;
    if (linked === 0) return 'Connect Gmail to start auto-tracking returns';
    if (percent === 100) return "You're set — we'll remind you before deadlines";
    return 'Gmail connected — enable reminders so you never miss a window';
  })();

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
      >
        <Text style={styles.eyebrow}>Almost there</Text>
        <Text style={styles.title}>Two quick steps</Text>
        <Text style={styles.sub}>
          Connect once, then returns and deadlines appear automatically.
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
            {refreshing ? 'Updating…' : `${stepsDone} of ${SETUP_STEPS} complete`}
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
            <Text style={styles.itemBody}>{gmailBody}</Text>
            <Link href="/onboarding/connect" style={styles.link}>
              {linked > 0 ? 'Add another inbox →' : 'Connect Gmail →'}
            </Link>
          </View>
        </View>

        <View style={[styles.item, pushDone && styles.itemDone]}>
          <Text style={styles.check}>{pushDone ? '✓' : '2'}</Text>
          <View style={styles.flex}>
            <Text style={styles.itemTitle}>Turn on reminders</Text>
            <Text style={styles.itemBody}>
              {isExpoGo()
                ? 'Push alerts need a dev build (not Expo Go). You can enable later in Settings.'
                : 'Push alerts before deadlines — not inbox spam. Optional but recommended.'}
            </Text>
            {!pushDone && !isExpoGo() && (
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
      </ScrollView>

      <View style={styles.footerBar}>
        <Pressable
          style={[styles.btn, linked === 0 && styles.btnDisabled]}
          onPress={finish}
          disabled={linked === 0}
        >
          <Text style={styles.btnText}>Go to dashboard</Text>
        </Pressable>
        <Text style={styles.footer}>
          {linked === 0
            ? 'Connect Gmail first to start finding returns.'
            : 'You can close the app — we keep syncing in the background.'}
        </Text>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    scroll: { flex: 1 },
    scrollContent: { padding: 24, paddingTop: 56, paddingBottom: 16 },
    footerBar: {
      paddingHorizontal: 24,
      paddingTop: 12,
      paddingBottom: 28,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.bg,
    },
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
    link: { color: colors.accent, fontSize: 14, fontWeight: '600' },
    btn: {
      backgroundColor: colors.accent,
      padding: 18,
      borderRadius: 14,
      alignItems: 'center',
    },
    btnDisabled: { opacity: 0.45 },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    footer: { color: colors.textDim, textAlign: 'center', marginTop: 10, fontSize: 12, lineHeight: 18 },
  });
}
