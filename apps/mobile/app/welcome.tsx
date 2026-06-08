import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../lib/theme';

const SLIDES = [
  {
    id: 'track',
    icon: '📦',
    accent: '#e94560',
    title: 'Never miss a return window',
    body: 'ReturnRider tracks deadlines and refunds so you stop leaving money on the table.',
    visual: 'return',
    stat: 'Avg shopper misses $400+/yr in expired returns',
  },
  {
    id: 'privacy',
    icon: '🔒',
    accent: '#4f8cff',
    title: 'Shopping mail only',
    body: 'Read-only Gmail. We filter receipts and return labels—we never read personal chats or sell your data.',
    visual: 'privacy',
    stat: 'You can disconnect anytime',
  },
  {
    id: 'wallet',
    icon: '📲',
    accent: '#3dd68c',
    title: 'QR ready at drop-off',
    body: 'Save return barcodes to Apple or Google Wallet. One swipe at UPS—no digging through email.',
    visual: 'wallet',
    stat: 'Like a boarding pass for returns',
  },
  {
    id: 'remind',
    icon: '⏰',
    accent: '#f5a623',
    title: 'Reminders that save refunds',
    body: 'Push alerts at 7 days, 3 days, and 24 hours before your window closes.',
    visual: 'notify',
    stat: 'Not email spam—just deadlines',
  },
];

function SlideVisual({ type, accent }: { type: string; accent: string }) {
  if (type === 'return') {
    return (
      <View style={[styles.mockCard, { borderColor: accent }]}>
        <Text style={styles.mockMerchant}>ASOS</Text>
        <Text style={styles.mockItem}>Linen shirt — Size M</Text>
        <View style={[styles.mockBadge, { backgroundColor: accent }]}>
          <Text style={styles.mockBadgeText}>11 days left</Text>
        </View>
      </View>
    );
  }
  if (type === 'privacy') {
    return (
      <View style={styles.privacyBox}>
        <Text style={styles.privacyOk}>✓ Order confirmations</Text>
        <Text style={styles.privacyOk}>✓ Return labels</Text>
        <Text style={styles.privacyNo}>✗ Personal emails</Text>
        <Text style={styles.privacyNo}>✗ Sold to advertisers</Text>
      </View>
    );
  }
  if (type === 'wallet') {
    return (
      <View style={[styles.walletCard, { borderTopColor: accent }]}>
        <Text style={styles.walletLabel}>RETURN PASS</Text>
        <Text style={styles.walletMerchant}>Target</Text>
        <View style={styles.qrPlaceholder}>
          <Text style={styles.qrText}>▣ QR</Text>
        </View>
      </View>
    );
  }
  return (
    <View style={styles.notifyStack}>
      {['7 days left', '3 days left', 'Due tomorrow'].map((t, i) => (
        <View key={t} style={[styles.notifyItem, i === 2 && { borderColor: accent }]}>
          <Text style={styles.notifyText}>{t}</Text>
        </View>
      ))}
    </View>
  );
}

export default function WelcomeScreen() {
  const [index, setIndex] = useState(0);
  const ref = useRef<FlatList>(null);
  const width = Dimensions.get('window').width;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(i);
  };

  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>ReturnRider</Text>
        <Text style={styles.tagline}>Returns & refunds, handled</Text>
      </View>

      <FlatList
        ref={ref}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={[styles.iconCircle, { backgroundColor: `${item.accent}22` }]}>
              <Text style={styles.icon}>{item.icon}</Text>
            </View>
            <SlideVisual type={item.visual} accent={item.accent} />
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
            <Text style={[styles.stat, { color: item.accent }]}>{item.stat}</Text>
          </View>
        )}
      />

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${((index + 1) / SLIDES.length) * 100}%`, backgroundColor: slide.accent },
          ]}
        />
      </View>

      <View style={styles.dots}>
        {SLIDES.map((s, i) => (
          <View
            key={s.id}
            style={[styles.dot, i === index && { backgroundColor: s.accent, width: 20 }]}
          />
        ))}
      </View>

      <Pressable
        style={[styles.btn, { backgroundColor: slide.accent }]}
        onPress={() => {
          if (!isLast) {
            ref.current?.scrollToIndex({ index: index + 1 });
          } else {
            router.push('/onboarding/checklist');
          }
        }}
      >
        <Text style={styles.btnText}>{isLast ? 'Get started — it\'s free' : 'Continue'}</Text>
      </Pressable>
      {!isLast && (
        <Pressable onPress={() => router.push('/onboarding/checklist')}>
          <Text style={styles.skip}>Skip intro</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingTop: 56, paddingBottom: 32 },
  header: { alignItems: 'center', marginBottom: 8 },
  logo: { fontSize: 22, fontWeight: '800', color: colors.accent, letterSpacing: 0.5 },
  tagline: { fontSize: 13, color: colors.textDim, marginTop: 4 },
  slide: { paddingHorizontal: 28, alignItems: 'center' },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  icon: { fontSize: 36 },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  body: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  stat: { fontSize: 12, fontWeight: '600', marginTop: 14, textAlign: 'center' },
  mockCard: {
    width: '85%',
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    marginTop: 8,
  },
  mockMerchant: { color: colors.text, fontWeight: '700', fontSize: 18 },
  mockItem: { color: colors.textMuted, marginTop: 4 },
  mockBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 12,
  },
  mockBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  privacyBox: {
    width: '85%',
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  privacyOk: { color: colors.success, fontSize: 14, marginVertical: 4 },
  privacyNo: { color: colors.textDim, fontSize: 14, marginVertical: 4 },
  walletCard: {
    width: '75%',
    backgroundColor: colors.bgElevated,
    borderRadius: 12,
    padding: 16,
    borderTopWidth: 4,
    marginTop: 8,
    alignItems: 'center',
  },
  walletLabel: { color: colors.textDim, fontSize: 10, letterSpacing: 1 },
  walletMerchant: { color: colors.text, fontSize: 20, fontWeight: '700', marginTop: 8 },
  qrPlaceholder: {
    marginTop: 12,
    width: 80,
    height: 80,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrText: { color: '#000', fontWeight: '700' },
  notifyStack: { width: '85%', marginTop: 8, gap: 8 },
  notifyItem: {
    backgroundColor: colors.bgCard,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notifyText: { color: colors.text, fontWeight: '500' },
  progressTrack: {
    height: 4,
    backgroundColor: colors.border,
    marginHorizontal: 24,
    borderRadius: 2,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginVertical: 16 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  btn: {
    marginHorizontal: 24,
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  skip: { color: colors.textDim, textAlign: 'center', marginTop: 14, fontSize: 14 },
});
