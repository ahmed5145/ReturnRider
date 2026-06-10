import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../lib/ThemeProvider';
import type { ThemeColors } from '../lib/themes';

function Bone({ style }: { style: object }) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[{ backgroundColor: colors.border, borderRadius: 10 }, style, { opacity }]}
    />
  );
}

export function DashboardSkeleton() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Bone style={styles.titleBone} />
        <Bone style={styles.settingsBone} />
      </View>
      <Bone style={styles.heroBone} />
      <View style={styles.chipRow}>
        <Bone style={styles.chipBone} />
        <Bone style={styles.chipBone} />
        <Bone style={styles.chipBone} />
      </View>
      <Bone style={styles.cardBone} />
      <Bone style={styles.cardBone} />
      <Bone style={styles.cardBone} />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: colors.bg },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    titleBone: { width: 160, height: 32, borderRadius: 8 },
    settingsBone: { width: 64, height: 20 },
    heroBone: { height: 110, borderRadius: 16, marginBottom: 20 },
    chipRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    chipBone: { flex: 1, height: 32, borderRadius: 20 },
    cardBone: { height: 88, borderRadius: 12, marginBottom: 12 },
  });
}
