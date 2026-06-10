import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { api, ensureAuthToken } from '../lib/api';
import { useTheme } from '../lib/ThemeProvider';
import type { ThemeColors } from '../lib/themes';

export default function ScanReceiptScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [permission, requestPermission] = useCameraPermissions();
  const [rawText, setRawText] = useState('');
  const [parsed, setParsed] = useState<Record<string, unknown> | null>(null);
  const [step, setStep] = useState<'camera' | 'confirm'>('camera');

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Camera access needed</Text>
        <Text style={styles.sub}>Scan or photograph your paper receipt to add a return.</Text>
        <Pressable style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Allow camera</Text>
        </Pressable>
      </View>
    );
  }

  const onCapture = () => {
    setStep('confirm');
    setRawText(
      'Paste or type text from your receipt below.\nOrder #: \nTotal: $\nStore: ',
    );
  };

  const onParse = async () => {
    await ensureAuthToken();
    const res = await api.parseReceiptText(rawText);
    if (res.parsed) {
      setParsed(res.parsed);
    }
  };

  const onSave = async () => {
    await ensureAuthToken();
    if (parsed) {
      await api.createManualReturn({
        merchant_name: String(parsed.merchant_name ?? 'Store'),
        external_order_id: String(parsed.external_order_id ?? `SCAN-${Date.now()}`),
        item_summary: String(parsed.item_summary ?? 'Receipt item'),
        return_window_days: Number(parsed.return_window_days ?? 30),
        expected_refund_amount: parsed.expected_refund_amount
          ? Number(parsed.expected_refund_amount)
          : undefined,
      });
    } else {
      await api.createFromReceiptText(rawText);
    }
    router.replace('/');
  };

  if (step === 'camera') {
    return (
      <View style={styles.container}>
        <CameraView style={styles.camera} facing="back" />
        <Text style={styles.overlay}>
          Point at your receipt, then enter details on the next screen.
        </Text>
        <Pressable style={styles.btn} onPress={onCapture}>
          <Text style={styles.btnText}>Continue</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.pad}>
      <Text style={styles.title}>Confirm receipt details</Text>
      <Text style={styles.sub}>
        Type or paste text from your receipt. We extract order info when possible.
      </Text>
      <TextInput
        style={[styles.input, { minHeight: 120 }]}
        multiline
        value={rawText}
        onChangeText={setRawText}
        placeholderTextColor={colors.textDim}
      />
      <Pressable style={styles.secondary} onPress={onParse}>
        <Text style={styles.secondaryText}>Parse text</Text>
      </Pressable>
      {parsed && (
        <Text style={styles.parsed}>
          Found: {String(parsed.merchant_name)} — {String(parsed.external_order_id)}
        </Text>
      )}
      <Pressable style={styles.btn} onPress={onSave}>
        <Text style={styles.btnText}>Save return</Text>
      </Pressable>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: 24, paddingTop: 48 },
  camera: { flex: 1 },
  overlay: { color: colors.text, textAlign: 'center', padding: 16, backgroundColor: colors.bgCard },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  sub: { color: colors.textMuted, marginVertical: 12, lineHeight: 20 },
  input: {
    backgroundColor: colors.bgCard,
    borderRadius: 10,
    padding: 12,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btn: {
    backgroundColor: colors.accent,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    margin: 16,
  },
  btnText: { color: '#fff', fontWeight: '600' },
  secondary: { padding: 12, alignItems: 'center' },
  secondaryText: { color: colors.accent },
  parsed: { color: colors.success, marginVertical: 8 },
});
}
