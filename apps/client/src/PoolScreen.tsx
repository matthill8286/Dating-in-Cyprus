import { useState, type ReactNode } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { useApp } from './context/AppContext';
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
  const { card, city, setCity, ageBand, setAgeBand, matched, setMatched, decide } = useDeck(sessionToken);
  const [filters, setFilters] = useState(false);
  const [open, setOpen] = useState(false);
  const tabs = <TabBar active="people" go={go} />;

  if (open && card) {
    return (
      <PersonScreen
        profile={card}
        onBack={() => setOpen(false)}
        onPass={() => {
          setOpen(false);
          void decide('pass');
        }}
        onLike={() => {
          setOpen(false);
          void decide('like');
        }}
        footer={tabs}
      />
    );
  }

  return (
    <DiscoverDeck
      card={card}
      city={city}
      ageBand={ageBand}
      filters={filters}
      matched={matched}
      viewerUri={profile?.photos[0]?.url}
      footer={tabs}
      onToggleFilters={() => setFilters((value) => !value)}
      onCity={setCity}
      onAge={setAgeBand}
      onLike={() => void decide('like')}
      onPass={() => void decide('pass')}
      onOpen={() => setOpen(true)}
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
  city: string;
  ageBand: AgeBandId;
  filters: boolean;
  matched: MatchedCard | null;
  viewerUri?: string;
  footer: ReactNode;
  onToggleFilters: () => void;
  onCity: (city: string) => void;
  onAge: (id: AgeBandId) => void;
  onLike: () => void;
  onPass: () => void;
  onOpen: () => void;
  onChat: () => void;
  onKeep: () => void;
};

function DiscoverDeck({
  card,
  city,
  ageBand,
  filters,
  matched,
  viewerUri,
  footer,
  onToggleFilters,
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
          <Pressable
            onPress={onToggleFilters}
            accessibilityRole="button"
            accessibilityLabel="Filters"
            style={[styles.filter, filters && styles.filterOn]}
          >
            <Text style={[styles.filterMark, filters && styles.filterMarkOn]}>☰</Text>
          </Pressable>
        </View>
        {card ? (
          <View style={styles.cardSlot}>
            <SwipeCard card={card} onLike={onLike} onPass={onPass} onOpen={onOpen} />
            <View style={styles.actionsDock}>
              <ActionRow onPass={onPass} onLike={onLike} onInfo={onOpen} />
            </View>
          </View>
        ) : (
          <Text style={styles.empty}>No one new right now.</Text>
        )}
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
  filter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterOn: { backgroundColor: color.rose },
  filterMark: { color: color.ink, fontSize: 20, fontWeight: '800', letterSpacing: -2 },
  filterMarkOn: { color: color.onRose },
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
