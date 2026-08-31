import { Image, Pressable, Text, View, StyleSheet } from 'react-native';
import type { HostIntroduction, HostLine } from './host';
import { spokenList, verificationCopy } from './host';
import { color, font } from './theme';

export function HostHeader({
  onIsland,
  onSafety,
}: {
  onIsland: () => void;
  onSafety?: () => void;
}) {
  return (
    <View style={styles.header}>
      <Text style={styles.word}>Here</Text>
      <View style={styles.headerLinks}>
        {onSafety ? (
          <Pressable onPress={onSafety} accessibilityRole="button" accessibilityLabel="Safety">
            <Text style={styles.islandLink}>Safety</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={onIsland} accessibilityRole="button" accessibilityLabel="The island">
          <Text style={styles.islandLink}>The island</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function IslandBack({ onBack }: { onBack: () => void }) {
  return (
    <Pressable
      onPress={onBack}
      accessibilityRole="button"
      accessibilityLabel="Back to Here"
      style={styles.islandBack}
    >
      <Text style={styles.islandBackText}>Back to Here</Text>
    </Pressable>
  );
}

export function HostMessage({ line }: { line: HostLine }) {
  if (line.kind === 'host') {
    return <Text style={styles.hostCopy}>{line.body}</Text>;
  }
  if (line.kind === 'you') {
    return <Text style={styles.youCopy}>{line.body}</Text>;
  }
  return <IntroCard introduction={line.introduction} revealed={line.revealed} />;
}

export function IntroCard({
  introduction,
  revealed,
}: {
  introduction: HostIntroduction;
  revealed: boolean;
}) {
  return (
    <View style={styles.intro}>
      <Text style={styles.tonight}>Tonight</Text>
      <Text style={styles.name}>{introduction.firstName}</Text>
      <Text style={styles.meta}>
        {introduction.city}
        {' · '}
        {spokenList(introduction.languagesSpoken)}
      </Text>
      {revealed ? (
        <Text style={styles.mark}>{verificationCopy(introduction.photoVerification)}</Text>
      ) : null}
      {revealed && introduction.portraitUrl ? (
        <Image
          source={{ uri: introduction.portraitUrl }}
          style={styles.portrait}
          accessibilityLabel={introduction.firstName}
        />
      ) : null}
      {revealed && introduction.bio ? <Text style={styles.bio}>{introduction.bio}</Text> : null}
      <Text style={styles.reason}>{introduction.reason}</Text>
      <Text style={styles.framing}>{introduction.meetFraming}</Text>
      <Text style={styles.mark}>This introduction expires. The island is small.</Text>
    </View>
  );
}

export function VerbRow({
  onYes,
  onPass,
  onMore,
  showMore,
}: {
  onYes: () => void;
  onPass: () => void;
  onMore: () => void;
  showMore: boolean;
}) {
  return (
    <View style={styles.verbs}>
      {showMore ? (
        <Pressable onPress={onMore} accessibilityRole="button" accessibilityLabel="Tell me more">
          <Text style={styles.more}>Tell me more</Text>
        </Pressable>
      ) : null}
      <View style={styles.row}>
        <Pressable onPress={onPass} accessibilityRole="button" accessibilityLabel="Not this">
          <Text style={styles.pass}>Not this</Text>
        </Pressable>
        <Pressable onPress={onYes} accessibilityRole="button" accessibilityLabel="Yes">
          <Text style={styles.yes}>Yes</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingBottom: 28,
  },
  word: { color: color.ink, fontFamily: font.display, fontSize: 34, fontWeight: '700' },
  headerLinks: { flexDirection: 'row', gap: 16 },
  islandLink: { color: color.mute, fontFamily: font.body, fontSize: 14, fontWeight: '600' },
  islandBack: {
    position: 'absolute',
    left: 12,
    top: 12,
    zIndex: 8,
    backgroundColor: color.paper,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#1A1A1A',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  islandBackText: { color: color.ink, fontFamily: font.body, fontSize: 14, fontWeight: '600' },
  hostCopy: {
    color: color.ink,
    fontFamily: font.display,
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '600',
    maxWidth: 340,
  },
  youCopy: {
    color: color.mute,
    fontFamily: font.body,
    fontSize: 16,
    fontWeight: '600',
    alignSelf: 'flex-end',
  },
  intro: { gap: 10, paddingTop: 8 },
  tonight: {
    color: color.rose,
    fontFamily: font.body,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  name: { color: color.ink, fontFamily: font.display, fontSize: 40, lineHeight: 44, fontWeight: '700' },
  meta: { color: color.ink, fontFamily: font.body, fontSize: 16, lineHeight: 22 },
  mark: { color: color.mute, fontFamily: font.body, fontSize: 13, fontWeight: '600' },
  portrait: {
    width: '100%',
    aspectRatio: 0.78,
    borderRadius: 28,
    backgroundColor: color.surface,
    marginTop: 8,
  },
  bio: { color: color.ink, fontFamily: font.body, fontSize: 16, lineHeight: 24, marginTop: 4 },
  reason: { color: color.ink, fontFamily: font.body, fontSize: 18, lineHeight: 26, marginTop: 8 },
  framing: { color: color.mute, fontFamily: font.body, fontSize: 16, lineHeight: 24 },
  verbs: { gap: 18, paddingTop: 8, paddingBottom: 12 },
  more: {
    color: color.rose,
    fontFamily: font.body,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pass: { color: color.mute, fontFamily: font.body, fontSize: 18, fontWeight: '600' },
  yes: { color: color.rose, fontFamily: font.display, fontSize: 22, fontWeight: '700' },
});
