import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { api } from '../../lib/api';

export default function ReturnDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [walletHintShown, setWalletHintShown] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.getReturn(id).then(setData).finally(() => setLoading(false));
  }, [id]);

  const showWalletHelp = () => {
    if (walletHintShown) return;
    setWalletHintShown(true);
    Alert.alert(
      'Add to Wallet',
      'This saves your return QR code to Apple or Google Wallet—like a boarding pass. One swipe at the UPS or store drop-off. You only generate a pass once per return.',
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
        : 'Pass generated. In production, this opens Apple Wallet with your QR code.',
    );
  };

  if (loading || !data) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading…</Text>
      </View>
    );
  }

  const item = data as {
    itemSummary?: string;
    status?: string;
    returnDeadlineAt?: string;
    order?: { merchantName?: string };
  };

  return (
    <View style={styles.container}>
      <Text style={styles.merchant}>{item?.order?.merchantName}</Text>
      <Text style={styles.item}>{item?.itemSummary}</Text>
      <Text style={styles.status}>Status: {item?.status}</Text>
      {item?.returnDeadlineAt && (
        <Text style={styles.deadline}>
          Deadline: {new Date(item.returnDeadlineAt).toLocaleDateString()}
        </Text>
      )}

      <Text style={styles.walletNote}>
        Wallet passes are generated once per return—no need to reconnect Gmail.
      </Text>

      <Pressable style={styles.btn} onPress={() => addToWallet('apple')}>
        <Text style={styles.btnText}>Add to Apple Wallet</Text>
      </Pressable>
      <Pressable style={[styles.btn, styles.btnGoogle]} onPress={() => addToWallet('google')}>
        <Text style={styles.btnText}>Add to Google Wallet</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 40, backgroundColor: '#16213e' },
  loading: { color: '#fff' },
  merchant: { fontSize: 22, fontWeight: '700', color: '#fff' },
  item: { fontSize: 16, color: '#c0c0d0', marginTop: 8 },
  status: { fontSize: 14, color: '#e94560', marginTop: 16 },
  deadline: { fontSize: 14, color: '#aaa', marginTop: 8 },
  walletNote: { fontSize: 12, color: '#888', marginTop: 20, lineHeight: 18 },
  btn: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e94560',
  },
  btnGoogle: { borderColor: '#4285F4' },
  btnText: { color: '#fff', fontWeight: '600' },
});
