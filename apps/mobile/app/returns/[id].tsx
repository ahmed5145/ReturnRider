import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { api } from '../../lib/api';

export default function ReturnDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.getReturn(id).then(setData).finally(() => setLoading(false));
  }, [id]);

  const addToWallet = async (platform: 'apple' | 'google') => {
    if (!id) return;
    const res = await api.createWalletPass(id, platform);
    alert(platform === 'google' ? res.google_save_url : 'Pass generated');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#e94560" />
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
  center: { flex: 1, justifyContent: 'center', backgroundColor: '#16213e' },
  merchant: { fontSize: 22, fontWeight: '700', color: '#fff' },
  item: { fontSize: 16, color: '#c0c0d0', marginTop: 8 },
  status: { fontSize: 14, color: '#e94560', marginTop: 16 },
  deadline: { fontSize: 14, color: '#aaa', marginTop: 8 },
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
