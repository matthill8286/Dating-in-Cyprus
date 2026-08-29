import { useState } from 'react';
import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useApp } from './context/AppContext';
import { CITY_FILTERS, CITY_FILTER_LABELS } from './match';
import type { Profile } from './profile';
import { color, font } from './theme';
import { ActionRow, Fixed, MatchOverlay } from './ui/deck';
import { ChipRow, PhotoCard } from './ui/kit';
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

  return (
    <Fixed
      footer={<TabBar active="people" onPeople={() => undefined} onMatches={onMatches} onProfile={onProfile} />}
    >
      <View style={styles.deck}>
        <View style={styles.header}>
          <Text style={styles.title}>Discover</Text>
          <Pressable
            onPress={() => setFilters((open) => !open)}
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
              onChange={setCity}
              labels={CITY_FILTER_LABELS}
              nowrap
            />
          </ScrollView>
        ) : null}
        {card ? (
          <View style={styles.cardSlot}>
            <PhotoCard
              uri={card.photos[0]?.url}
              name={card.firstName}
              age={card.age}
              place={card.city}
              bio={card.bio}
            />
            <View style={styles.actionsDock}>
              <ActionRow onPass={() => void decide('pass')} onLike={() => void decide('like')} />
            </View>
          </View>
        ) : (
          <Text style={styles.empty}>No one new right now.</Text>
        )}
      </View>
      {matched ? (
        <MatchOverlay
          name={matched.profile.firstName}
          onMessage={() => {
            onChat(matched);
            setMatched(null);
          }}
          onKeep={() => setMatched(null)}
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
