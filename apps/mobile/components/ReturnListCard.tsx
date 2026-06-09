import { Link } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { getMerchantEmoji } from '../lib/merchant-icons';
import { useTheme } from '../lib/ThemeProvider';
import { formatDaysRemaining, getUrgencyColor } from '../lib/urgency';

interface ReturnItem {
  id: string;
  merchant_name: string;
  item_summary: string;
  days_remaining?: number | null;
  has_wallet_pass?: boolean;
  expected_refund_amount?: number | null;
  refund_amount?: number | null;
}

interface Props {
  item: ReturnItem;
  completed: boolean;
  onSnooze?: (id: string) => void;
  snoozingId?: string | null;
}

export function ReturnListCard({ item, completed, onSnooze, snoozingId }: Props) {
  const { colors } = useTheme();
  const borderColor = getUrgencyColor(item.days_remaining);
  const emoji = getMerchantEmoji(item.merchant_name);
  const styles = makeStyles(colors);

  const card = (
    <Pressable style={[styles.card, { borderLeftColor: borderColor }]}>
      <View style={styles.cardRow}>
        <Text style={styles.merchant} allowFontScaling maxFontSizeMultiplier={2}>
          {emoji ? `${emoji} ` : ''}
          {item.merchant_name}
        </Text>
        {item.has_wallet_pass && <Text style={styles.walletIcon}>📲</Text>}
      </View>
      <Text style={styles.item} allowFontScaling maxFontSizeMultiplier={2}>
        {item.item_summary}
      </Text>
      <Text
        style={[styles.meta, { color: completed ? colors.success : borderColor }]}
        allowFontScaling
        maxFontSizeMultiplier={2}
      >
        {completed
          ? item.refund_amount != null
            ? `Refunded $${item.refund_amount.toFixed(2)}`
            : 'Refund completed'
          : formatDaysRemaining(item.days_remaining)}
        {!completed && item.expected_refund_amount != null
          ? ` · $${item.expected_refund_amount.toFixed(2)}`
          : ''}
      </Text>
    </Pressable>
  );

  if (completed || !onSnooze) {
    return (
      <Link href={`/returns/${item.id}`} asChild>
        {card}
      </Link>
    );
  }

  return (
    <Swipeable
      overshootRight={false}
      renderRightActions={() => (
        <Pressable
          style={styles.snoozeAction}
          onPress={() => onSnooze(item.id)}
          disabled={snoozingId === item.id}
        >
          {snoozingId === item.id ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.snoozeIcon}>⏰</Text>
              <Text style={styles.snoozeLabel}>Snooze 24h</Text>
            </>
          )}
        </Pressable>
      )}
    >
      <Link href={`/returns/${item.id}`} asChild>
        {card}
      </Link>
    </Swipeable>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.bgCard,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderLeftWidth: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    merchant: { color: colors.text, fontWeight: '600', fontSize: 16, flex: 1 },
    walletIcon: { fontSize: 16 },
    item: { color: colors.textMuted, marginTop: 4, fontSize: 14 },
    meta: { fontSize: 13, marginTop: 8, fontWeight: '500' },
    snoozeAction: {
      backgroundColor: colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
      width: 96,
      marginBottom: 12,
      borderRadius: 12,
      marginLeft: 8,
    },
    snoozeIcon: { fontSize: 20 },
    snoozeLabel: { color: '#fff', fontWeight: '700', fontSize: 11, marginTop: 4 },
  });
}
