import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { api, ensureAuthToken } from '../../lib/api';
import { registerForPushNotifications } from '../../lib/notifications';

export default function ChecklistScreen() {
  const [linked, setLinked] = useState(0);
  const [returns, setReturns] = useState(0);

  useEffect(() => {
    (async () => {
      await ensureAuthToken();
      const me = await api.getMe();
      setLinked(me.linked_emails.length);
      setReturns(me.returns_count);
    })();
  }, []);

  const finish = async () => {
    await registerForPushNotifications();
    await api.completeOnboarding();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Setup checklist</Text>
      <Text style={styles.sub}>One-time setup. You won&apos;t need to repeat these steps.</Text>

      <View style={styles.item}>
        <Text style={styles.check}>{linked > 0 ? '✓' : '○'}</Text>
        <View style={styles.flex}>
          <Text style={styles.itemTitle}>Connect email</Text>
          <Text style={styles.itemBody}>Auto-import orders and return labels (read-only).</Text>
          <Link href="/onboarding/connect" style={styles.link}>Connect Gmail</Link>
        </View>
      </View>

      <View style={styles.item}>
        <Text style={styles.check}>{returns > 0 ? '✓' : '○'}</Text>
        <View style={styles.flex}>
          <Text style={styles.itemTitle}>Add a return</Text>
          <Text style={styles.itemBody}>No email? Add manually or scan a paper receipt.</Text>
          <Link href="/add-return" style={styles.link}>Add manually</Link>
          <Link href="/scan-receipt" style={styles.link}>Scan receipt</Link>
        </View>
      </View>

      <View style={styles.item}>
        <Text style={styles.check}>○</Text>
        <View style={styles.flex}>
          <Text style={styles.itemTitle}>Enable reminders</Text>
          <Text style={styles.itemBody}>Push alerts before return deadlines (not email spam).</Text>
        </View>
      </View>

      <Pressable style={styles.btn} onPress={finish}>
        <Text style={styles.btnText}>Go to dashboard</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#16213e', padding: 24, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: '700', color: '#fff' },
  sub: { color: '#a0a0b0', marginBottom: 24, marginTop: 8 },
  item: { flexDirection: 'row', marginBottom: 20, gap: 12 },
  check: { color: '#e94560', fontSize: 20, width: 24 },
  flex: { flex: 1 },
  itemTitle: { color: '#fff', fontWeight: '600', fontSize: 16 },
  itemBody: { color: '#aaa', fontSize: 13, marginTop: 4, marginBottom: 6 },
  link: { color: '#e94560', fontSize: 14, marginTop: 4 },
  btn: {
    backgroundColor: '#e94560',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
  },
  btnText: { color: '#fff', fontWeight: '600' },
});
