import { useState, type ReactNode } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { useApp } from './context/AppContext';
import { canDecide, hostLines, type HostLine } from './host';
import { HostComposer, HostHeader, HostMessage, IslandBack, VerbRow } from './hostChrome';
import { IslandMap } from './IslandMap';
import type { Profile } from './profile';
import { OpenSafetySheet } from './SafetySheet';
import { Fixed } from './ui/deck';
import { introPending } from './ui/pending';
import { IntroSkeleton } from './ui/skeleton';
import { TabBar, type TabGo } from './ui/tabs';
import { useHost } from './useHost';

export function HostScreen({
  go,
}: {
  go: TabGo;
}) {
  const { sessionToken } = useApp();
  const host = useHost(sessionToken);
  const [island, setIsland] = useState(false);
  const [safety, setSafety] = useState(false);
  const [draft, setDraft] = useState('');
  const tabs = <TabBar active="people" go={go} />;
  const pending = introPending(host.ready, host.looking, host.busy);

  if (island) {
    return <IslandStage people={host.people} footer={tabs} onBack={() => setIsland(false)} />;
  }

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
          {tabs}
        </View>
      }
    >
      <ScrollView contentContainerStyle={styles.thread} style={styles.scroll}>
        <HostHeader
          onIsland={() => setIsland(true)}
          onSafety={host.introduction ? () => setSafety(true) : undefined}
        />
        <View style={styles.lines}>
          {threadFor(host, pending).map((line) => (
            <HostMessage key={line.id} line={line} />
          ))}
          {pending ? <IntroSkeleton /> : null}
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

function IslandStage({
  people,
  footer,
  onBack,
}: {
  people: Profile[];
  footer: ReactNode;
  onBack: () => void;
}) {
  return (
    <Fixed footer={footer}>
      <IslandMap people={people} city="all" onOpen={() => undefined} />
      <IslandBack onBack={onBack} />
    </Fixed>
  );
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
    looking: false,
  }).filter((line) => line.id !== 'empty' && line.id !== 'open');
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  thread: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 20,
  },
  lines: { gap: 16 },
});
