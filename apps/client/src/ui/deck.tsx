import type { ReactNode } from 'react';
import { Image, Pressable, SafeAreaView, Text, View, StyleSheet } from 'react-native';
import { color, font } from '../theme';
import { PrimaryButton } from './kit';
import { styles } from './kit.styles';

export function Fixed({
  children,
  footer,
}: {
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.fixed}>{children}</View>
      {footer}
    </SafeAreaView>
  );
}

export function ActionRow({
  onPass,
  onLike,
  onInfo,
}: {
  onPass: () => void;
  onLike: () => void;
  onInfo?: () => void;
}) {
  return (
    <View style={styles.actions}>
      <CircleButton glyph="✕" label="Pass" tone="pass" onPress={onPass} />
      <CircleButton glyph="♥" label="Like" tone="like" onPress={onLike} />
      {onInfo ? <CircleButton glyph="i" label="View profile" tone="pass" onPress={onInfo} /> : null}
    </View>
  );
}

function CircleButton({
  glyph,
  label,
  tone,
  onPress,
}: {
  glyph: string;
  label: string;
  tone: 'pass' | 'like';
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        styles.circle,
        tone === 'like' ? styles.circleLike : styles.circlePass,
        tone === 'like' ? styles.circleLg : null,
      ]}
    >
      <Text style={tone === 'like' ? styles.circleLikeText : styles.circlePassText}>{glyph}</Text>
    </Pressable>
  );
}

export function MatchOverlay({
  name,
  uri,
  viewerUri,
  onMessage,
  onKeep,
}: {
  name: string;
  uri?: string;
  viewerUri?: string;
  onMessage: () => void;
  onKeep: () => void;
}) {
  return (
    <View style={styles.matchMask} accessibilityViewIsModal>
      <View style={faceStyles.pair}>
        <Face uri={viewerUri} name="You" tilt="left" />
        <Face uri={uri} name={name} tilt="right" />
      </View>
      <Text style={styles.matchTitle}>It's a match, {name}!</Text>
      <PrimaryButton title="Say hello" onPress={onMessage} />
      <Pressable onPress={onKeep} accessibilityRole="button" style={faceStyles.keep}>
        <Text style={faceStyles.keepText}>Keep swiping</Text>
      </Pressable>
    </View>
  );
}

function Face({ uri, name, tilt }: { uri?: string; name: string; tilt: 'left' | 'right' }) {
  const spin = tilt === 'left' ? faceStyles.left : faceStyles.right;
  if (uri) {
    return <Image source={{ uri }} style={[faceStyles.face, spin]} accessibilityLabel={name} />;
  }
  return <View style={[faceStyles.face, spin, faceStyles.empty]} />;
}

const faceStyles = StyleSheet.create({
  pair: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  face: {
    width: 120,
    height: 160,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: color.paper,
    backgroundColor: color.surface,
  },
  empty: { backgroundColor: color.roseSoft },
  left: { transform: [{ rotate: '-8deg' }, { translateX: 12 }], zIndex: 1 },
  right: { transform: [{ rotate: '8deg' }, { translateX: -12 }], zIndex: 2 },
  keep: {
    backgroundColor: color.roseSoft,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  keepText: { color: color.rose, fontFamily: font.body, fontSize: 16, fontWeight: '700' },
});
