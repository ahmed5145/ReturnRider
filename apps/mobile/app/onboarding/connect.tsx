import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { trackEvent } from '../../lib/analytics';
import { connectGmail } from '../../lib/google-auth';
import {
  getAppReturnUri,
  getGoogleRedirectUri,
  isExpoGo,
} from '../../lib/google-redirect';
import { colors } from '../../lib/theme';

const REDIRECT_URI = getGoogleRedirectUri();
const APP_RETURN_URI = isExpoGo() ? getAppReturnUri() : null;

const SHOPPING_KEYWORDS = [
  'order',
  'return',
  'refund',
  'shipment',
  'tracking',
  'receipt',
  'confirmation',
];

const TRUST_POINTS = [
  'Read-only — we never send, delete, or modify mail',
  'Only shopping-related subjects & senders',
  'Marketing mail is ignored or one-tap dismissed',
  'Disconnect any inbox anytime in Settings',
  'We never sell your email data',
];

export default function ConnectEmailScreen() {
  const [loading, setLoading] = useState(false);
  const [sync180, setSync180] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDevSetup, setShowDevSetup] = useState(__DEV__);

  const onConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await connectGmail(sync180 ? 180 : 90);
      trackEvent('gmail_connected', { email: result.email_address });
      router.replace({
        pathname: '/onboarding/checklist',
        params: { connected: result.email_address },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.pad}>
      <Stack.Screen options={{ title: 'Connect Gmail' }} />
      <Text style={styles.title}>Your inbox, shopping-only</Text>
      <Text style={styles.body}>
        One-time read-only connection. We scan order and return emails — not personal conversations.
      </Text>

      <View style={styles.trustCard}>
        {TRUST_POINTS.map((point) => (
          <Text key={point} style={styles.trustItem}>
            ✓ {point}
          </Text>
        ))}
      </View>

      <Text style={styles.keywordsLabel}>Keywords we look for</Text>
      <View style={styles.keywordRow}>
        {SHOPPING_KEYWORDS.map((kw) => (
          <View key={kw} style={styles.keywordChip}>
            <Text style={styles.keywordText}>{kw}</Text>
          </View>
        ))}
      </View>

      <View style={styles.row}>
        <Text style={styles.rowLabel}>Scan last 180 days (optional)</Text>
        <Switch
          value={sync180}
          onValueChange={setSync180}
          trackColor={{ false: colors.border, true: colors.accent }}
        />
      </View>
      <Text style={styles.hint}>
        Default is 90 days. Enabling 180 imports more history but reads more email.
      </Text>

      {showDevSetup && (
        <View style={styles.setupBox}>
          <Pressable onPress={() => setShowDevSetup(false)}>
            <Text style={styles.setupDismiss}>Hide developer setup</Text>
          </Pressable>
          <Text style={styles.setupTitle}>Google Console setup</Text>
          <Text style={styles.setupBody}>
            Web client → Authorized redirect URIs → add:
          </Text>
          <Text selectable style={styles.setupUri}>
            {REDIRECT_URI}
          </Text>
          {APP_RETURN_URI && (
            <>
              <Text style={[styles.setupBody, { marginTop: 10 }]}>
                Expo Go return URL (do not add to Google):
              </Text>
              <Text selectable style={styles.setupUriSecondary}>
                {APP_RETURN_URI}
              </Text>
            </>
          )}
        </View>
      )}

      {!showDevSetup && __DEV__ && (
        <Pressable onPress={() => setShowDevSetup(true)}>
          <Text style={styles.showDev}>Show developer setup</Text>
        </Pressable>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.btn} onPress={onConnect} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Connect with Google</Text>
        )}
      </Pressable>
      <Text style={styles.privacyFooter}>
        By connecting, you agree to our read-only shopping-mail policy.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  body: { color: colors.textMuted, lineHeight: 22, marginVertical: 12 },
  trustCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
    marginVertical: 16,
  },
  trustItem: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  keywordsLabel: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 10,
  },
  keywordRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  keywordChip: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  keywordText: { color: colors.accent, fontSize: 12, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  rowLabel: { color: colors.text, flex: 1, paddingRight: 12 },
  hint: { color: colors.textDim, fontSize: 12, marginTop: 8, lineHeight: 18 },
  setupBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  setupDismiss: { color: colors.textDim, fontSize: 12, marginBottom: 8 },
  setupTitle: { color: colors.text, fontWeight: '600', fontSize: 14 },
  setupBody: { color: colors.textMuted, fontSize: 12, marginTop: 8, lineHeight: 18 },
  setupUri: {
    color: colors.success,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    lineHeight: 20,
  },
  setupUriSecondary: {
    color: colors.textDim,
    fontSize: 12,
    marginTop: 6,
    lineHeight: 18,
  },
  showDev: { color: colors.accent, fontSize: 13, marginTop: 12 },
  error: { color: '#ff6b6b', marginTop: 12 },
  btn: {
    backgroundColor: '#4285F4',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  btnText: { color: '#fff', fontWeight: '600' },
  privacyFooter: {
    color: colors.textDim,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
});
