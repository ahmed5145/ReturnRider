import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { api } from '../../lib/api';
import { formatDaysRemaining, getUrgencyColor } from '../../lib/urgency';
import { colors } from '../../lib/theme';

export default function ReturnDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<Awaited<ReturnType<typeof api.getReturn>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [walletHintShown, setWalletHintShown] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.getReturn(id);
      setData(res);
      if (res.expected_refund_amount != null) {
        setRefundAmount(String(res.expected_refund_amount));
      }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [id]),
  );

  const showWalletHelp = () => {
    if (walletHintShown) return;
    setWalletHintShown(true);
    Alert.alert(
      'Add to Wallet',
      'Saves your return QR like a boarding pass—one swipe at drop-off. Generated once per return.',
    );
  };

  const addToWallet = async (platform: 'apple' | 'google') => {
    showWalletHelp();
    if (!id) return;
    const res = await api.createWalletPass(id, platform);
    Alert.alert(
      platform === 'google' ? 'Google Wallet' : 'Apple Wallet',
      platform === 'google'
        ? res.google_save_url ?? 'Pass link generated'
        : 'Pass generated. Production builds open Apple Wallet directly.',
    );
  };

  const snooze = async () => {
    if (!id || !data) return;
    setActing(true);
    try {
      await api.snoozeReturn(id);
      await load();
      Alert.alert('Snoozed', 'Deadline extended 24 hours. Reminders rescheduled.');
    } catch (e) {
      Alert.alert('Cannot snooze', e instanceof Error ? e.message : 'Try again');
    } finally {
      setActing(false);
    }
  };

  const confirmRefund = async () => {
    if (!id) return;
    const amount = parseFloat(refundAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      Alert.alert('Enter amount', 'Add the refund amount you received.');
      return;
    }
    setActing(true);
    try {
      await api.confirmRefund(id, amount);
      await load();
      Alert.alert('Refund recorded', 'Nice — we marked this return complete.');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Try again');
    } finally {
      setActing(false);
    }
  };

  if (loading || !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const urgencyColor = getUrgencyColor(data.days_remaining);
  const isComplete = data.status === 'refund_completed';

  return (
    <View style={styles.container}>
      <Link href="/" style={styles.back}>
        <Text style={styles.backText}>← Dashboard</Text>
      </Link>

      <View style={[styles.hero, { borderColor: urgencyColor }]}>
        <Text style={styles.merchant}>{data.merchant_name}</Text>
        <Text style={styles.item}>{data.item_summary}</Text>
        <Text style={[styles.countdown, { color: urgencyColor }]}>
          {formatDaysRemaining(data.days_remaining)}
        </Text>
        {data.expected_refund_amount != null && (
          <Text style={styles.refund}>${data.expected_refund_amount.toFixed(2)} expected refund</Text>
        )}
        <Text style={styles.statusBadge}>{data.status.replace(/_/g, ' ')}</Text>
      </View>

      <Text style={styles.section}>Timeline</Text>
      <View style={styles.timeline}>
        <Text style={styles.timelineItem}>Order #{data.order.external_order_id}</Text>
        {data.return_deadline_at && (
          <Text style={styles.timelineItem}>
            Return by {new Date(data.return_deadline_at).toLocaleDateString()}
          </Text>
        )}
        {data.tracking_number && (
          <Text style={styles.timelineItem}>Tracking: {data.tracking_number}</Text>
        )}
        {data.refund_status?.user_confirmed_at && (
          <Text style={[styles.timelineItem, { color: colors.success }]}>
            Refund confirmed{' '}
            {data.refund_status.actual_amount != null
              ? `$${data.refund_status.actual_amount.toFixed(2)}`
              : ''}
          </Text>
        )}
      </View>

      {!isComplete && (
        <>
          <Text style={styles.section}>Drop-off</Text>
          <Text style={styles.hint}>
            Wallet pass = one swipe at UPS or store. No need to reconnect Gmail.
          </Text>
          <Pressable style={styles.btn} onPress={() => addToWallet('apple')}>
            <Text style={styles.btnText}>Add to Apple Wallet</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.btnGoogle]} onPress={() => addToWallet('google')}>
            <Text style={styles.btnText}>Add to Google Wallet</Text>
          </Pressable>

          <Text style={styles.section}>Actions</Text>
          {data.snoozes_remaining > 0 && (
            <Pressable style={styles.secondaryBtn} onPress={snooze} disabled={acting}>
              <Text style={styles.secondaryBtnText}>
                Snooze 24h ({data.snoozes_remaining} left)
              </Text>
            </Pressable>
          )}

          <Text style={styles.label}>Refund received ($)</Text>
          <TextInput
            style={styles.input}
            value={refundAmount}
            onChangeText={setRefundAmount}
            keyboardType="decimal-pad"
            placeholder="49.99"
            placeholderTextColor={colors.textDim}
          />
          <Pressable style={styles.confirmBtn} onPress={confirmRefund} disabled={acting}>
            {acting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>I got my refund</Text>
            )}
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 48, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', backgroundColor: colors.bg },
  back: { marginBottom: 16 },
  backText: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  hero: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    marginBottom: 20,
  },
  merchant: { fontSize: 22, fontWeight: '700', color: colors.text },
  item: { fontSize: 15, color: colors.textMuted, marginTop: 6 },
  countdown: { fontSize: 28, fontWeight: '800', marginTop: 16 },
  refund: { fontSize: 16, color: colors.success, marginTop: 8, fontWeight: '600' },
  statusBadge: {
    alignSelf: 'flex-start',
    marginTop: 12,
    fontSize: 11,
    color: colors.textDim,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: { color: colors.text, fontWeight: '600', fontSize: 16, marginTop: 8, marginBottom: 8 },
  timeline: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 6,
  },
  timelineItem: { color: colors.textMuted, fontSize: 14 },
  hint: { color: colors.textDim, fontSize: 12, marginBottom: 12, lineHeight: 18 },
  btn: {
    backgroundColor: colors.bgElevated,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  btnGoogle: { borderColor: '#4285F4' },
  btnText: { color: colors.text, fontWeight: '600' },
  secondaryBtn: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginBottom: 16,
  },
  secondaryBtnText: { color: colors.textMuted, fontWeight: '600' },
  label: { color: colors.textMuted, marginBottom: 6, fontSize: 13 },
  input: {
    backgroundColor: colors.bgCard,
    borderRadius: 10,
    padding: 12,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  confirmBtn: {
    backgroundColor: colors.success,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
});
