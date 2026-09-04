import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { useApp } from './context/AppContext';
import { canDecide, hostLines, type HostLine } from './host';
import { HostComposer, HostHeader, HostMessage, VerbRow } from './hostChrome';
import type { PeopleStackParamList } from './navigation/types';
import { OpenSafetySheet } from './SafetySheet';
import { ErrorNote } from './ui/kit';
import { Fixed } from './ui/deck';
import { IntroSkeleton } from './ui/skeleton';
import { page } from './ui/layout';
import { useHost } from './useHost';

export function HostScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<PeopleStackParamList>>();
  const { sessionToken } = useApp();
  const host = useHost(sessionToken);
  const [safety, setSafety] = useState(false);
  const [draft, setDraft] = useState('');
  const pending = host.introPending;

  return (
    <Fixed
      footer={
        <View>
          {canDecide(host.introduction, host.busy, host.matched) ? (
            <VerbRow onYes={host.yes} onPass={host.pass} onMore={host.more} showMore={!host.revealed} />
          ) : null}
          <HostComposer
            value={draft}
            onChange={setDraft}
            busy={host.busy}
            placeholder={
              host.introduction ? 'Ask for someone else' : "Tell Here who you're hoping to meet"
            }
            onSend={() => {
              const text = draft;
              setDraft('');
              host.ask(text);
            }}
          />
        </View>
      }
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.thread}
        style={styles.scroll}
      >
        <HostHeader
          onIsland={() => navigation.navigate('Island')}
          onSafety={host.introduction ? () => setSafety(true) : undefined}
        />
        <View style={styles.lines}>
          {threadFor(host, pending).map((line) => (
            <HostMessage key={line.id} line={line} />
          ))}
          {pending ? <IntroSkeleton /> : null}
          <ErrorNote message={introRefusal(host)} />
        </View>
      </ScrollView>
      <OpenSafetySheet
        open={safety}
        name={host.introduction?.firstName ?? ''}
        profileId={host.introduction?.profileId ?? ''}
        token={sessionToken}
        onClose={() => setSafety(false)}
        onBlocked={() => {
          setSafety(false);
          host.reload();
        }}
      />
    </Fixed>
  );
}

function introRefusal(host: { introFailed: boolean; actionFailed: boolean }): string | null {
  if (host.actionFailed) return 'That did not go through. Try again.';
  if (host.introFailed) return "I could not reach the island just now. Pull down or ask again.";
  return null;
}

function threadFor(
  host: {
    introduction: Parameters<typeof hostLines>[0]['introduction'];
    revealed: boolean;
    verb: Parameters<typeof hostLines>[0]['verb'];
    matched: Parameters<typeof hostLines>[0]['matched'];
    want: string | null;
  },
  pending: boolean,
): HostLine[] {
  return hostLines({
    introduction: pending ? null : host.introduction,
    revealed: pending ? false : host.revealed,
    verb: pending ? null : host.verb,
    matched: host.matched,
    want: host.want,
    looking: pending,
  });
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  thread: {
    ...page,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 20,
  },
  lines: { gap: 16 },
});
