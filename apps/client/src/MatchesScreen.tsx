import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { Image, Platform, Pressable, Text, View, StyleSheet, useWindowDimensions } from 'react-native';
import { matchGridWidth, matchTileSize, type InboxRow } from './match';
import type { MatchesStackParamList } from './navigation/types';
import { shouldLoadMore } from './page';
import { useApp } from './context/AppContext';
import { useMatchInbox } from './queries/feeds';
import { ErrorNote, MuteNote, Screen, Sheet } from './ui/kit';
import { page, WEB_COLUMN } from './ui/layout';
import { MatchGridSkeleton } from './ui/skeleton';
import { color, font } from './theme';

export function MatchesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MatchesStackParamList>>();
  const { sessionToken } = useApp();
  const { matches, loading, failed, hasMore, loadMore } = useMatchInbox(sessionToken);
  const { width: windowWidth } = useWindowDimensions();
  const tile = matchTileSize(
    matchGridWidth(windowWidth, Platform.OS === 'web' ? WEB_COLUMN : Number.POSITIVE_INFINITY),
  );

  useEffect(() => {
    if (shouldLoadMore(matches.length - 2, matches.length, hasMore)) loadMore();
  }, [hasMore, loadMore, matches.length]);

  const open = (item: InboxRow) => {
    navigation.navigate('Person', { matchId: item.matchId, profile: item.profile });
  };

  return (
    <Screen>
      <View style={styles.head}>
        <Text style={styles.title}>Matches</Text>
        <Text style={styles.sub}>People you both want to meet.</Text>
      </View>
      <Sheet>
        {loading ? (
          <MatchGridSkeleton tile={tile} />
        ) : (
          <>
            <View style={styles.grid}>
              {matches.map((item) => (
                <MatchTile
                  key={item.matchId}
                  item={item}
                  tile={tile}
                  onPress={() => open(item)}
                />
              ))}
            </View>
            <ErrorNote message={failed ? 'Matches did not load. Try again in a moment.' : null} />
            {matches.length === 0 && !failed ? (
              <MuteNote>No Matches yet. Here will introduce you.</MuteNote>
            ) : null}
          </>
        )}
      </Sheet>
    </Screen>
  );
}

function MatchTile({
  item,
  tile,
  onPress,
}: {
  item: InboxRow;
  tile: { width: number; height: number };
  onPress: () => void;
}) {
  const uri = item.profile.photos?.[0]?.url;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.profile.firstName}, ${item.profile.age}`}
      style={[styles.tile, { width: tile.width, height: tile.height }]}
    >
      {uri ? (
        <Image source={{ uri }} style={styles.photo} accessibilityLabel={item.profile.firstName} />
      ) : (
        <View style={styles.photo} />
      )}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{item.profile.city}</Text>
      </View>
      <View style={styles.caption}>
        <Text style={styles.name}>
          {item.profile.firstName}, {item.profile.age}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  head: { ...page, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8 },
  title: { fontFamily: font.display, fontSize: 28, fontWeight: '700', color: color.ink },
  sub: { fontFamily: font.body, fontSize: 14, color: color.mute, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, width: '100%' },
  tile: {
    flexShrink: 0,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: color.surface,
  },
  photo: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: color.surface },
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: { color: color.onRose, fontFamily: font.body, fontSize: 11, fontWeight: '600' },
  caption: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: color.overlay,
  },
  name: { color: color.onRose, fontFamily: font.display, fontSize: 16, fontWeight: '700' },
});
