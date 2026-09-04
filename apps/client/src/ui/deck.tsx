import { type ReactNode } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  Text,
  View,
  StyleSheet,
} from 'react-native';
import { color } from '../theme';
import { keyboardAvoidProps } from './keyboard';
import { GhostButton, PrimaryButton } from './kit';
import { styles } from './kit.styles';
import { asText } from './mark';

export function Fixed({
  children,
  footer,
}: {
  children: ReactNode;
  footer?: ReactNode;
}) {
  const avoid = keyboardAvoidProps(Platform.OS);
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={avoid.behavior}
        enabled={avoid.enabled}
      >
        <View style={styles.fixed}>{children}</View>
        {footer}
      </KeyboardAvoidingView>
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
      <CircleButton glyph={asText('✕')} label="Pass" tone="pass" onPress={onPass} />
      <CircleButton glyph={asText('♥')} label="Like" tone="like" onPress={onLike} />
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
      <View style={faceStyles.panel}>
        <View style={faceStyles.pair}>
          <Face uri={viewerUri} name="You" tilt="left" />
          <Face uri={uri} name={name} tilt="right" />
        </View>
        <Text style={styles.matchTitle}>It's a match, {name}!</Text>
        <PrimaryButton title="Say hello" onPress={onMessage} />
        <GhostButton title="Keep swiping" onPress={onKeep} />
      </View>
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
  panel: { width: '100%', maxWidth: 360, alignItems: 'stretch', gap: 16 },
  pair: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
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
});
