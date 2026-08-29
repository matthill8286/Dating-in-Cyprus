import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useApp } from './context/AppContext';
import { CITY_FILTERS, CITY_FILTER_LABELS, type MatchedCard } from './match';
import type { Profile } from './profile';
import { PersonScreen } from './PersonScreen';
import { color, font } from './theme';
import { ActionRow, Fixed, MatchOverlay } from './ui/deck';
import { ChipRow } from './ui/kit';
import { SwipeCard } from './ui/swipe';
import { TabBar } from './ui/tabs';
import { useDeck } from './useDeck';

export function PoolScreen({
  onProfile,
  onMatches,
  onChat,
}: {
  onProfile: () => void;
  onMatches: () => void;
  onChat: (match: { matchId: string; profile: Profile }) => void;
}) {
  const { sessionToken } = useApp();
  const { card, city, setCity, matched, setMatched, decide } = useDeck(sessionToken);
  const [filters, setFilters] = useState(false);
  const [open, setOpen] = useState(false);
  const tabs = <TabBar active="people" onPeople={() => undefined} onMatches={onMatches} onProfile={onProfile} />;

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
      filters={filters}
      matched={matched}
      footer={tabs}
      onToggleFilters={() => setFilters((value) => !value)}
      onCity={setCity}
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

function DiscoverDeck({
  card,
  city,
  filters,
  matched,
  footer,
  onToggleFilters,
  onCity,
  onLike,
  onPass,
  onOpen,
  onChat,
  onKeep,
}: {
  card: Profile | undefined;
  city: string;
  filters: boolean;
  matched: MatchedCard | null;
  footer: ReactNode;
  onToggleFilters: () => void;
  onCity: (city: string) => void;
  onLike: () => void;
  onPass: () => void;
  onOpen: () => void;
  onChat: () => void;
  onKeep: () => void;
}) {
  return (
    <Fixed footer={footer}>
      <View style={styles.deck}>
        <View style={styles.header}>
          <Text style={styles.title}>Discover</Text>
          <Pressable
            onPress={onToggleFilters}
            accessibilityRole="button"
            accessibilityLabel="Filters"
            style={[styles.filter, filters && styles.filterOn]}
          >
            <Text style={[styles.filterMark, filters && styles.filterMarkOn]}>☰</Text>
          </Pressable>
        </View>
        {filters ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <ChipRow
              options={CITY_FILTERS}
              value={city}
              onChange={onCity}
              labels={CITY_FILTER_LABELS}
              nowrap
            />
          </ScrollView>
        ) : null}
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
      {matched ? (
        <MatchOverlay
          name={matched.profile.firstName}
          uri={matched.profile.photos[0]?.url}
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
  title: {
    color: color.ink,
    fontFamily: font.display,
    fontSize: 28,
    fontWeight: '700',
  },
  filter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterOn: { backgroundColor: color.rose },
  filterMark: { color: color.ink, fontSize: 18, fontWeight: '800', letterSpacing: -1 },
  filterMarkOn: { color: color.onRose },
  cardSlot: { flex: 1, minHeight: 0 },
  actionsDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 18,
    zIndex: 3,
  },
  empty: {
    fontFamily: font.body,
    fontSize: 15,
    color: color.mute,
    textAlign: 'center',
    paddingVertical: 48,
  },
});
