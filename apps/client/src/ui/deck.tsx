import type { ReactNode } from 'react';
import { Image, Pressable, SafeAreaView, Text, View } from 'react-native';
import { GhostButton, PrimaryButton } from './kit';
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
      {onInfo ? <CircleButton glyph="i" label="View profile" tone="pass" onPress={onInfo} /> : null}
      <CircleButton glyph="♥" label="Like" tone="like" onPress={onLike} />
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
  onMessage,
  onKeep,
}: {
  name: string;
  uri?: string;
  onMessage: () => void;
  onKeep: () => void;
}) {
  return (
    <View style={styles.matchMask} accessibilityViewIsModal>
      {uri ? <Image source={{ uri }} style={face} accessibilityLabel={name} /> : null}
      <Text style={styles.matchTitle}>It's a match!</Text>
      <Text style={styles.matchCopy}>You and {name} both want to meet.</Text>
      <PrimaryButton title="Say hello" onPress={onMessage} />
      <GhostButton title="Keep swiping" onPress={onKeep} />
    </View>
  );
}

const face = { width: 96, height: 96, borderRadius: 48, marginBottom: 8 } as const;
