import { useEffect, useRef, useState } from 'react';
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

const SLIDES = [
  {
    title: 'Track every return',
    body: 'ReturnRider finds order and return emails so you never miss a refund window.',
  },
  {
    title: 'We read shopping mail only',
    body: 'Read-only Gmail access. We filter for receipts and return labels—not personal conversations.',
  },
  {
    title: 'QR codes in your Wallet',
    body: 'Add return barcodes to Apple or Google Wallet—one swipe at the drop-off counter.',
  },
  {
    title: 'Reminders before deadlines',
    body: 'Push alerts at 7 days, 3 days, and 24 hours before your return window closes.',
  },
];

export default function WelcomeScreen() {
  const [index, setIndex] = useState(0);
  const ref = useRef<FlatList>(null);
  const width = Dimensions.get('window').width;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(i);
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={ref}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
      <Pressable
        style={styles.btn}
        onPress={() => {
          if (index < SLIDES.length - 1) {
            ref.current?.scrollToIndex({ index: index + 1 });
          } else {
            router.push('/onboarding/checklist');
          }
        }}
      >
        <Text style={styles.btnText}>{index < SLIDES.length - 1 ? 'Next' : 'Get started'}</Text>
      </Pressable>
      <Pressable onPress={() => router.push('/onboarding/checklist')}>
        <Text style={styles.skip}>Skip</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#16213e', paddingTop: 80, paddingBottom: 40 },
  slide: { paddingHorizontal: 28, justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 16 },
  body: { fontSize: 16, color: '#c0c0d0', lineHeight: 24 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#444' },
  dotActive: { backgroundColor: '#e94560', width: 24 },
  btn: {
    backgroundColor: '#e94560',
    marginHorizontal: 24,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  skip: { color: '#888', textAlign: 'center', marginTop: 16 },
});
