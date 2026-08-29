import { useState, type ReactNode } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { useApp } from './context/AppContext';
import { IslandMap } from './IslandMap';
import type { AgeBandId, MatchedCard } from './match';
import type { Profile } from './profile';
import { PersonScreen } from './PersonScreen';
import { color, font } from './theme';
import { ActionRow, Fixed, MatchOverlay } from './ui/deck';
import { FilterSheet } from './ui/filters';
import { SwipeCard } from './ui/swipe';
import { TabBar, type TabGo } from './ui/tabs';
import { useDeck } from './useDeck';

export function PoolScreen({
  go,
  onChat,
}: {
  go: TabGo;
  onChat: (match: { matchId: string; profile: Profile }) => void;
}) {
  const { sessionToken, profile } = useApp();
  const { card, visible, city, setCity, ageBand, setAgeBand, matched, setMatched, decide } =
    useDeck(sessionToken);
  const [filters, setFilters] = useState(false);
  const [map, setMap] = useState(false);
  const [open, setOpen] = useState<Profile | null>(null);
  const tabs = <TabBar active="people" go={go} />;

  if (open) {
    return (
      <PersonScreen
        profile={open}
        onBack={() => setOpen(null)}
        onPass={() => {
          setOpen(null);
          void decide('pass', open);
        }}
        onLike={() => {
          setOpen(null);
          void decide('like', open);
        }}
        footer={tabs}
      />
    );
  }

  return (
    <DiscoverDeck
      card={card}
      visible={visible}
      city={city}
      ageBand={ageBand}
      filters={filters}
      map={map}
      matched={matched}
      viewerUri={profile?.photos[0]?.url}
      footer={tabs}
      onToggleFilters={() => setFilters((value) => !value)}
      onToggleMap={() => setMap((value) => !value)}
      onCity={setCity}
      onAge={setAgeBand}
      onLike={() => void decide('like')}
      onPass={() => void decide('pass')}
      onOpen={(person) => setOpen(person ?? card ?? null)}
      onChat={() => {
        if (!matched) return;
        onChat(matched);
        setMatched(null);
      }}
      onKeep={() => setMatched(null)}
    />
  );
}

type DeckProps = {
  card: Profile | undefined;
  visible: Profile[];
  city: string;
  ageBand: AgeBandId;
  filters: boolean;
  map: boolean;
  matched: MatchedCard | null;
  viewerUri?: string;
  footer: ReactNode;
  onToggleFilters: () => void;
  onToggleMap: () => void;
  onCity: (city: string) => void;
  onAge: (id: AgeBandId) => void;
  onLike: () => void;
  onPass: () => void;
  onOpen: (profile?: Profile) => void;
  onChat: () => void;
  onKeep: () => void;
};

function DiscoverDeck({
  card,
  visible,
  city,
  ageBand,
  filters,
  map,
  matched,
  viewerUri,
  footer,
  onToggleFilters,
  onToggleMap,
  onCity,
  onAge,
  onLike,
  onPass,
  onOpen,
  onChat,
  onKeep,
}: DeckProps) {
  return (
    <Fixed footer={footer}>
      <View style={styles.deck}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Discover</Text>
            <Text style={styles.place}>{city === 'all' ? 'Republic of Cyprus' : city}</Text>
          </View>
          <View style={styles.tools}>
            <Pressable
              onPress={onToggleMap}
              accessibilityRole="button"
              accessibilityLabel="Map"
              style={[styles.tool, map && styles.toolOn]}
            >
              <Text style={[styles.toolMark, map && styles.toolMarkOn]}>◎</Text>
            </Pressable>
            <Pressable
              onPress={onToggleFilters}
              accessibilityRole="button"
              accessibilityLabel="Filters"
              style={[styles.tool, filters && styles.toolOn]}
            >
              <Text style={[styles.toolMark, filters && styles.toolMarkOn]}>☰</Text>
            </Pressable>
          </View>
        </View>
        <DiscoverBody
          map={map}
          card={card}
          visible={visible}
          onOpen={onOpen}
          onLike={onLike}
          onPass={onPass}
        />
      </View>
      {filters ? (
        <FilterSheet city={city} ageBand={ageBand} onCity={onCity} onAge={onAge} onDone={onToggleFilters} />
      ) : null}
      {matched ? (
        <MatchOverlay
          name={matched.profile.firstName}
          uri={matched.profile.photos[0]?.url}
          viewerUri={viewerUri}
          onMessage={onChat}
          onKeep={onKeep}
        />
      ) : null}
    </Fixed>
  );
}

function DiscoverBody({
  map,
  card,
  visible,
  onOpen,
  onLike,
  onPass,
}: {
  map: boolean;
  card: Profile | undefined;
  visible: Profile[];
  onOpen: (profile?: Profile) => void;
  onLike: () => void;
  onPass: () => void;
}) {
  if (map) return <IslandMap people={visible} onOpen={onOpen} />;
  if (!card) return <Text style={styles.empty}>No one new right now.</Text>;
  return (
    <View style={styles.cardSlot}>
      <SwipeCard card={card} onLike={onLike} onPass={onPass} onOpen={() => onOpen()} />
      <View style={styles.actionsDock}>
        <ActionRow onPass={onPass} onLike={onLike} onInfo={() => onOpen()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  deck: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 12,
  },
  title: { color: color.ink, fontFamily: font.display, fontSize: 28, fontWeight: '700' },
  place: { color: color.mute, fontFamily: font.body, fontSize: 13, marginTop: 2 },
  tools: { flexDirection: 'row', gap: 8 },
  tool: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolOn: { backgroundColor: color.rose },
  toolMark: { color: color.ink, fontSize: 20, fontWeight: '800' },
  toolMarkOn: { color: color.onRose },
  cardSlot: { flex: 1, minHeight: 0 },
  actionsDock: { position: 'absolute', left: 0, right: 0, bottom: 18, zIndex: 3 },
  empty: {
    fontFamily: font.body,
    fontSize: 15,
    color: color.mute,
    textAlign: 'center',
    paddingVertical: 48,
  },
});
