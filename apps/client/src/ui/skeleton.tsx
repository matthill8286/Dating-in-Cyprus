import { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { HostHeader } from '../hostChrome';
import { color } from '../theme';
import { page } from './layout';

export function Bone({
  height,
  width = '100%',
  radius = 8,
}: {
  height: number;
  width?: number | `${number}%`;
  radius?: number;
}) {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 750, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <Animated.View
      style={[styles.bone, { height, width, borderRadius: radius, opacity: pulse }]}
    />
  );
}

export function IntroSkeleton() {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Looking across the island"
      style={styles.intro}
    >
      <Bone height={12} width="42%" />
      <Bone height={28} width="52%" radius={10} />
      <Bone height={14} width="48%" />
      <Bone height={22} width="92%" radius={10} />
      <Bone height={14} width="78%" />
    </View>
  );
}

export function HostLoadingScreen() {
  return (
    <View style={styles.gate}>
      <View style={styles.thread}>
        <HostHeader />
        <IntroSkeleton />
      </View>
    </View>
  );
}

export function MatchGridSkeleton({ tile }: { tile: { width: number; height: number } }) {
  const width = tile.width || '47%';
  const height = tile.height || 210;
  return (
    <View accessibilityRole="progressbar" accessibilityLabel="Loading matches" style={styles.grid}>
      <Bone height={height} width={width} radius={16} />
      <Bone height={height} width={width} radius={16} />
      <Bone height={height} width={width} radius={16} />
      <Bone height={height} width={width} radius={16} />
    </View>
  );
}

export function MessageListSkeleton() {
  return (
    <View accessibilityRole="progressbar" accessibilityLabel="Loading messages" style={styles.list}>
      <MessageRowSkeleton />
      <MessageRowSkeleton />
      <MessageRowSkeleton />
      <MessageRowSkeleton />
    </View>
  );
}

export function ChatSkeleton() {
  return (
    <View accessibilityRole="progressbar" accessibilityLabel="Loading conversation" style={styles.chat}>
      <Bone height={44} width="72%" radius={18} />
      <View style={styles.mine}>
        <Bone height={44} width="58%" radius={18} />
      </View>
      <Bone height={44} width="64%" radius={18} />
    </View>
  );
}

function MessageRowSkeleton() {
  return (
    <View style={styles.row}>
      <Bone height={56} width={56} radius={28} />
      <View style={styles.rowBody}>
        <Bone height={14} width="40%" />
        <Bone height={12} width="70%" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bone: { backgroundColor: color.line },
  intro: { gap: 12, padding: 20, backgroundColor: color.surface, borderRadius: 24 },
  gate: { flex: 1, backgroundColor: color.bg },
  thread: {
    ...page,
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 20,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, width: '100%' },
  list: { gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  rowBody: { flex: 1, gap: 8 },
  chat: { gap: 10, paddingTop: 8 },
  mine: { alignItems: 'flex-end' },
});
