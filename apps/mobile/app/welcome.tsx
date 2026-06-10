import { useEffect, useMemo, useRef, useState } from 'react';
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
import { trackEvent } from '../lib/analytics';
import { useTheme } from '../lib/ThemeProvider';
import type { ThemeColors } from '../lib/themes';

const SLIDES = [
  {
    id: 'track',
    icon: '📦',
    accent: '#e94560',
    title: 'Never miss a return window',
    body: 'Connect Gmail once. We find orders and return deadlines automatically — you get reminders before time runs out.',
    visual: 'return',
    stat: 'Set it up in under two minutes',
  },
  {
    id: 'privacy',
    icon: '🔒',
    accent: '#4f8cff',
    title: 'Shopping mail only',
    body: 'Read-only Gmail. We filter receipts and return labels — never personal chats, never sold to advertisers.',
    visual: 'privacy',
    stat: 'Disconnect anytime in Settings',
  },
] as const;

type WelcomeStyles = ReturnType<typeof createStyles>;

function SlideVisual({
  type,
  accent,
  styles,
}: {
  type: string;
  accent: string;
  styles: WelcomeStyles;
}) {
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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [index, setIndex] = useState(0);
  const ref = useRef<FlatList>(null);
  const width = Dimensions.get('window').width;

  useEffect(() => {
    trackEvent('onboarding_started');
  }, []);

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
            <SlideVisual type={item.visual} accent={item.accent} styles={styles} />
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
        <Text style={styles.btnText}>{isLast ? "Get started — it's free" : 'Continue'}</Text>
      </Pressable>
      {!isLast && (
        <Pressable onPress={() => router.push('/onboarding/checklist')}>
          <Text style={styles.skip}>Skip intro</Text>
        </Pressable>
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
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
      backgroundColor: colors.bgCard,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    qrText: { color: colors.text, fontWeight: '700' },
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
}
