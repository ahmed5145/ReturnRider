import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { api, ensureAuthToken } from '../../lib/api';
import { registerForPushNotifications } from '../../lib/notifications';
import { colors } from '../../lib/theme';

export default function ChecklistScreen() {
  const [linked, setLinked] = useState(0);
  const [returns, setReturns] = useState(0);
  const [pushDone, setPushDone] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  useEffect(() => {
    (async () => {
      await ensureAuthToken();
      const me = await api.getMe();
      setLinked(me.linked_emails.length);
      setReturns(me.returns_count);
      setPushDone(me.has_push_token);
    })();
  }, []);

  const enablePush = async () => {
    setPushLoading(true);
    const token = await registerForPushNotifications();
    setPushDone(!!token);
    setPushLoading(false);
  };

  const finish = async () => {
    await api.completeOnboarding();
    router.replace('/');
  };

  const stepsDone = (linked > 0 ? 1 : 0) + (returns > 0 ? 1 : 0) + (pushDone ? 1 : 0);

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Almost there</Text>
      <Text style={styles.title}>Set up in under 2 minutes</Text>
      <Text style={styles.sub}>
        One-time setup. Connect once, then returns appear automatically.
      </Text>

      <View style={styles.progressCard}>
        <Text style={styles.progressText}>{stepsDone} of 3 complete</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(stepsDone / 3) * 100}%` }]} />
        </View>
      </View>

      <View style={[styles.item, linked > 0 && styles.itemDone]}>
        <Text style={styles.check}>{linked > 0 ? '✓' : '1'}</Text>
        <View style={styles.flex}>
          <Text style={styles.itemTitle}>Connect Gmail</Text>
          <Text style={styles.itemBody}>Auto-import orders & return QR codes (read-only).</Text>
          <Link href="/onboarding/connect" style={styles.link}>Connect Gmail →</Link>
        </View>
      </View>

      <View style={[styles.item, returns > 0 && styles.itemDone]}>
        <Text style={styles.check}>{returns > 0 ? '✓' : '2'}</Text>
        <View style={styles.flex}>
          <Text style={styles.itemTitle}>Add your first return</Text>
          <Text style={styles.itemBody}>No email? Manual entry or scan a paper receipt.</Text>
          <View style={styles.linkRow}>
            <Link href="/add-return" style={styles.link}>Add manually</Link>
            <Text style={styles.sep}> · </Text>
            <Link href="/scan-receipt" style={styles.link}>Scan receipt</Link>
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

      <Pressable style={styles.btn} onPress={finish}>
        <Text style={styles.btnText}>Go to dashboard</Text>
      </Pressable>
      <Text style={styles.footer}>You can finish setup later from Settings</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 24, paddingTop: 56 },
  eyebrow: { color: colors.accent, fontWeight: '600', fontSize: 13, textTransform: 'uppercase' },
  title: { fontSize: 26, fontWeight: '700', color: colors.text, marginTop: 6 },
  sub: { color: colors.textMuted, marginBottom: 20, marginTop: 8, lineHeight: 20 },
  progressCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  progressText: { color: colors.textMuted, fontSize: 13, marginBottom: 8 },
  progressBar: { height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
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
  itemBody: { color: colors.textMuted, fontSize: 13, marginTop: 4, marginBottom: 8, lineHeight: 18 },
  linkRow: { flexDirection: 'row', alignItems: 'center' },
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
