import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { api, ensureAuthToken } from '../lib/api';

export default function AddReturnScreen() {
  const [merchant, setMerchant] = useState('');
  const [orderId, setOrderId] = useState('');
  const [item, setItem] = useState('');
  const [amount, setAmount] = useState('');
  const [days, setDays] = useState('30');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      await ensureAuthToken();
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + parseInt(days, 10));
      await api.createManualReturn({
        merchant_name: merchant,
        external_order_id: orderId,
        item_summary: item,
        return_window_days: parseInt(days, 10),
        return_deadline_at: deadline.toISOString(),
        expected_refund_amount: amount ? parseFloat(amount) : undefined,
      });
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.pad}>
      <Text style={styles.title}>Add return manually</Text>
      <Text style={styles.sub}>
        No email receipt? Enter details from your paper receipt or order confirmation.
      </Text>

      <Text style={styles.label}>Store name</Text>
      <TextInput style={styles.input} value={merchant} onChangeText={setMerchant} placeholder="Target" placeholderTextColor="#666" />

      <Text style={styles.label}>Order number</Text>
      <TextInput style={styles.input} value={orderId} onChangeText={setOrderId} placeholder="123456789" placeholderTextColor="#666" />

      <Text style={styles.label}>Item description</Text>
      <TextInput style={styles.input} value={item} onChangeText={setItem} placeholder="Blue running shoes" placeholderTextColor="#666" />

      <Text style={styles.label}>Expected refund ($)</Text>
      <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="49.99" placeholderTextColor="#666" />

      <Text style={styles.label}>Return window (days)</Text>
      <TextInput style={styles.input} value={days} onChangeText={setDays} keyboardType="number-pad" placeholderTextColor="#666" />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.btn} onPress={submit} disabled={saving || !merchant || !orderId || !item}>
        <Text style={styles.btnText}>{saving ? 'Saving…' : 'Save return'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#16213e' },
  pad: { padding: 24, paddingTop: 40 },
  title: { fontSize: 22, fontWeight: '700', color: '#fff' },
  sub: { color: '#aaa', marginBottom: 20, marginTop: 8, lineHeight: 20 },
  label: { color: '#ccc', marginTop: 12, marginBottom: 6 },
  input: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  error: { color: '#ff6b6b', marginTop: 12 },
  btn: {
    backgroundColor: '#e94560',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  btnText: { color: '#fff', fontWeight: '600' },
});
