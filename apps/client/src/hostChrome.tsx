import { Image, Pressable, Text, TextInput, View, StyleSheet } from 'react-native';
import type { HostIntroduction, HostLine } from './host';
import { spokenList, verificationCopy } from './host';
import { color, font } from './theme';

export function HostHeader({
  onIsland,
  onSafety,
}: {
  onIsland?: () => void;
  onSafety?: () => void;
}) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.kicker}>Your host</Text>
        <Text style={styles.word}>Here</Text>
      </View>
      <View style={styles.headerLinks}>
        {onSafety ? (
          <Pressable onPress={onSafety} accessibilityRole="button" accessibilityLabel="Safety">
            <Text style={styles.islandLink}>Safety</Text>
          </Pressable>
        ) : null}
        {onIsland ? (
          <Pressable onPress={onIsland} accessibilityRole="button" accessibilityLabel="The island">
            <Text style={styles.islandLink}>The island</Text>
          </Pressable>
        ) : null}
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
    return (
      <View style={styles.hostRow}>
        <View style={styles.mark}>
          <Text style={styles.markText}>◇</Text>
        </View>
        <Text style={styles.hostCopy}>{line.body}</Text>
      </View>
    );
  }
  if (line.kind === 'you') {
    return (
      <View style={styles.youRow}>
        <Text style={styles.youCopy}>{line.body}</Text>
      </View>
    );
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
      <Text style={styles.tonight}>Tonight in {introduction.city}</Text>
      <Text style={styles.name}>{introduction.firstName}</Text>
      <Text style={styles.meta}>{spokenList(introduction.languagesSpoken)}</Text>
      <Text style={styles.framing}>{introduction.meetFraming}</Text>
      <Text style={styles.reason}>{introduction.reason}</Text>
      {revealed ? <Text style={styles.markLabel}>{verificationCopy(introduction.photoVerification)}</Text> : null}
      {revealed && introduction.portraitUrl ? (
        <Image
          source={{ uri: introduction.portraitUrl }}
          style={styles.portrait}
          accessibilityLabel={introduction.firstName}
        />
      ) : null}
      {revealed && introduction.bio ? <Text style={styles.bio}>{introduction.bio}</Text> : null}
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
        <Pressable
          onPress={onMore}
          accessibilityRole="button"
          accessibilityLabel="Tell me more"
          style={styles.moreBtn}
        >
          <Text style={styles.more}>Tell me more</Text>
        </Pressable>
      ) : null}
      <View style={styles.row}>
        <Pressable onPress={onPass} accessibilityRole="button" accessibilityLabel="Not this" style={styles.passBtn}>
          <Text style={styles.pass}>Not this</Text>
        </Pressable>
        <Pressable onPress={onYes} accessibilityRole="button" accessibilityLabel="Yes" style={styles.yesBtn}>
          <Text style={styles.yes}>Yes</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function HostComposer({
  value,
  onChange,
  onSend,
  busy,
  placeholder = "Tell Here who you're hoping to meet",
  sendLabel = 'Ask',
}: {
  value: string;
  onChange: (text: string) => void;
  onSend: () => void;
  busy: boolean;
  placeholder?: string;
  sendLabel?: string;
}) {
  return (
    <View style={styles.composer}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={color.mute}
        editable={!busy}
        onSubmitEditing={onSend}
        style={styles.field}
        accessibilityLabel={placeholder}
      />
      <Pressable
        onPress={onSend}
        disabled={busy || !value.trim()}
        accessibilityRole="button"
        accessibilityLabel={sendLabel}
        style={styles.send}
      >
        <Text style={styles.sendText}>{sendLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  kicker: { color: color.rose, fontFamily: font.body, fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  word: { color: color.ink, fontFamily: font.display, fontSize: 32, fontWeight: '700' },
  headerLinks: { flexDirection: 'row', gap: 16, paddingBottom: 6 },
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
  hostRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', maxWidth: 360 },
  mark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: color.roseSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  markText: { color: color.rose, fontSize: 12, fontWeight: '700' },
  hostCopy: { flex: 1, color: color.ink, fontFamily: font.display, fontSize: 22, lineHeight: 30, fontWeight: '600' },
  youRow: { alignSelf: 'flex-end', backgroundColor: color.roseSoft, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, maxWidth: 280 },
  youCopy: { color: color.ink, fontFamily: font.body, fontSize: 15, fontWeight: '600' },
  intro: { gap: 10, padding: 20, backgroundColor: color.surface, borderRadius: 24 },
  tonight: { color: color.rose, fontFamily: font.body, fontSize: 13, fontWeight: '600', letterSpacing: 0.4 },
  name: { color: color.ink, fontFamily: font.display, fontSize: 34, lineHeight: 38, fontWeight: '700' },
  meta: { color: color.mute, fontFamily: font.body, fontSize: 15, lineHeight: 22, fontWeight: '600' },
  markLabel: { color: color.mute, fontFamily: font.body, fontSize: 13, fontWeight: '600' },
  portrait: { width: '100%', aspectRatio: 0.82, borderRadius: 20, backgroundColor: color.line, marginTop: 4 },
  bio: { color: color.ink, fontFamily: font.body, fontSize: 16, lineHeight: 24 },
  framing: { color: color.ink, fontFamily: font.display, fontSize: 20, lineHeight: 28, fontWeight: '600', marginTop: 6 },
  reason: { color: color.mute, fontFamily: font.body, fontSize: 15, lineHeight: 22 },
  verbs: { gap: 10, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8, maxWidth: 430, width: '100%', alignSelf: 'center' },
  moreBtn: {
    borderRadius: 999,
    backgroundColor: color.roseSoft,
    paddingVertical: 14,
    alignItems: 'center',
  },
  more: { color: color.rose, fontFamily: font.body, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  row: { flexDirection: 'row', gap: 10 },
  passBtn: { flex: 1, borderRadius: 999, borderWidth: 1, borderColor: color.line, paddingVertical: 14, alignItems: 'center' },
  pass: { color: color.ink, fontFamily: font.body, fontSize: 16, fontWeight: '600' },
  yesBtn: { flex: 1, borderRadius: 999, backgroundColor: color.rose, paddingVertical: 14, alignItems: 'center' },
  yes: { color: color.onRose, fontFamily: font.display, fontSize: 16, fontWeight: '700' },
  composer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 24,
    paddingBottom: 10,
    maxWidth: 430,
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center',
  },
  field: {
    flex: 1,
    backgroundColor: color.surface,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: font.body,
    fontSize: 15,
    color: color.ink,
  },
  send: { backgroundColor: color.ink, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 12 },
  sendText: { color: color.onRose, fontFamily: font.body, fontSize: 15, fontWeight: '700' },
});
