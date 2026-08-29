import { useState, type ReactNode } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useApp } from './context/AppContext';
import { DiscoverHeader, MapStage } from './discoverChrome';
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
  const { card, visible, city, setCity, ageBand, setAgeBand, matched, setMatched, decide, hide } =
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
        onBlocked={() => {
          hide(open.profileId);
          setOpen(null);
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
      {map ? (
        <MapStage
          people={visible}
          city={city}
          mapOn={map}
          filtersOn={filters}
          onToggleMap={onToggleMap}
          onToggleFilters={onToggleFilters}
          onOpen={(person) => onOpen(person)}
        />
      ) : (
        <View style={styles.deck}>
          <DiscoverHeader
            city={city}
            mapOn={map}
            filtersOn={filters}
            onToggleMap={onToggleMap}
            onToggleFilters={onToggleFilters}
          />
          <DiscoverBody card={card} onOpen={onOpen} onLike={onLike} onPass={onPass} />
        </View>
      )}
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
  card,
  onOpen,
  onLike,
  onPass,
}: {
  card: Profile | undefined;
  onOpen: (profile?: Profile) => void;
  onLike: () => void;
  onPass: () => void;
}) {
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
