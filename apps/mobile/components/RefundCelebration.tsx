import { Modal, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { colors } from '../lib/theme';

interface Props {
  visible: boolean;
  amount: number;
  merchant: string;
  onClose: () => void;
}

export function RefundCelebration({ visible, amount, merchant, onClose }: Props) {
  const share = async () => {
    try {
      await Share.share({
        message: `Just got my $${amount.toFixed(2)} refund from ${merchant} — ReturnRider kept me on track! 🎉`,
      });
    } catch {
      // user dismissed
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.emoji}>💰</Text>
          <Text style={styles.title}>Refund secured!</Text>
          <Text style={styles.amount}>${amount.toFixed(2)}</Text>
          <Text style={styles.body}>
            From {merchant}. That&apos;s money back in your pocket — nice work staying on top of it.
          </Text>
          <Pressable style={styles.shareBtn} onPress={share}>
            <Text style={styles.shareText}>Share the win</Text>
          </Pressable>
          <Pressable style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneText}>Back to dashboard</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 28,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.success,
  },
  emoji: { fontSize: 56 },
  title: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 12 },
  amount: { color: colors.success, fontSize: 36, fontWeight: '800', marginTop: 8 },
  body: {
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 12,
    fontSize: 15,
  },
  shareBtn: {
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent,
    width: '100%',
    alignItems: 'center',
  },
  shareText: { color: colors.accent, fontWeight: '700' },
  doneBtn: {
    marginTop: 12,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  doneText: { color: colors.textMuted, fontWeight: '600' },
});
