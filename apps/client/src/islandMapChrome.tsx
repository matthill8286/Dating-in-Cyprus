import { useEffect, useRef } from 'react';
import { Image, Platform, Pressable, ScrollView, Text, View, StyleSheet, type ViewStyle } from 'react-native';
import type { MapView } from './map';
import { mapTiles, MAX_ZOOM, MIN_ZOOM } from './map';
import type { Profile } from './profile';
import { color, font } from './theme';
import { asText } from './ui/mark';
import { photoVerificationLabel, photoVerificationOf } from './verify';

export function MapBackdrop({ view, width, height }: { view: MapView; width: number; height: number }) {
  return (
    <View style={styles.sea} pointerEvents="none">
      {mapTiles(view, width, height).map((tile) => (
        <Image
          key={tile.key}
          source={{ uri: tile.url }}
          style={{ position: 'absolute', left: tile.x, top: tile.y, width: tile.width, height: tile.height }}
        />
      ))}
    </View>
  );
}

export function MapPin({
  profile,
  x,
  y,
  active,
  onPress,
}: {
  profile: Profile;
  x: number;
  y: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${profile.firstName}, ${profile.city}`}
      style={[styles.pin, active && styles.pinOn, { left: x - 28, top: y - 28 }]}
    >
      <View style={[styles.halo, active && styles.haloOn]} />
      {profile.photos[0]?.url ? (
        <Image source={{ uri: profile.photos[0].url }} style={styles.face} />
      ) : (
        <View style={styles.face} />
      )}
    </Pressable>
  );
}

export function ZoomPad({
  zoom,
  onIn,
  onOut,
  onFit,
}: {
  zoom: number;
  onIn: () => void;
  onOut: () => void;
  onFit: () => void;
}) {
  return (
    <View style={styles.zoom}>
      <Pressable accessibilityRole="button" accessibilityLabel="Zoom in" onPress={onIn} disabled={zoom >= MAX_ZOOM} style={styles.zoomBtn}>
        <Text style={styles.zoomMark}>+</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Zoom out" onPress={onOut} disabled={zoom <= MIN_ZOOM} style={styles.zoomBtn}>
        <Text style={styles.zoomMark}>−</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Show whole island" onPress={onFit} style={styles.zoomBtn}>
        <Text style={styles.zoomMark}>{asText('◎')}</Text>
      </Pressable>
    </View>
  );
}

export const PEEK_WIDTH = 268;
export const PEEK_GAP = 10;

export function PeekStrip({
  people,
  selectedId,
  empty = 'No one new right now.',
  onPick,
  onOpen,
}: {
  people: Profile[];
  selectedId?: string;
  empty?: string;
  onPick: (profile: Profile) => void;
  onOpen: (profile: Profile) => void;
}) {
  const list = useRef<ScrollView>(null);
  const snap = PEEK_WIDTH + PEEK_GAP;
  const peopleRef = useRef(people);
  peopleRef.current = people;
  const ids = people.map((person) => person.profileId).join();

  useEffect(() => {
    const index = peopleRef.current.findIndex((person) => person.profileId === selectedId);
    if (index < 0) return;
    list.current?.scrollTo({ x: index * snap, animated: true });
  }, [selectedId, snap, ids]);

  return (
    <View style={styles.dock} pointerEvents="box-none">
      {people.length === 0 ? (
        <Text style={styles.empty}>{empty}</Text>
      ) : (
        <ScrollView
          ref={list}
          horizontal
          nestedScrollEnabled
          pointerEvents="auto"
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={snap}
          snapToAlignment="start"
          disableIntervalMomentum
          style={[styles.stripScroll, Platform.OS === 'web' ? webStripScroll : null]}
          contentContainerStyle={styles.strip}
          accessibilityLabel="People on the map"
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / snap);
            const person = people[index];
            if (person) onPick(person);
          }}
        >
          {people.map((profile) => (
            <PeekCard
              key={profile.profileId}
              profile={profile}
              active={profile.profileId === selectedId}
              onPick={() => onPick(profile)}
              onOpen={() => onOpen(profile)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

export function PeekCard({
  profile,
  active,
  onPick,
  onOpen,
}: {
  profile: Profile;
  active?: boolean;
  onPick?: () => void;
  onOpen: () => void;
}) {
  return (
    <View style={[styles.peek, active && styles.peekOn]}>
      <Pressable
        onPress={onPick ?? onOpen}
        accessibilityRole="button"
        accessibilityLabel={`${profile.firstName} profile`}
        style={styles.peekMain}
      >
        {profile.photos[0]?.url ? (
          <Image source={{ uri: profile.photos[0].url }} style={styles.peekPhoto} />
        ) : (
          <View style={styles.peekPhoto} />
        )}
        <View style={styles.peekCopy}>
          <Text style={styles.peekName}>
            {profile.firstName}, {profile.age}
          </Text>
          <Text style={styles.peekPlace}>{profile.city} · {photoVerificationLabel(photoVerificationOf(profile))}</Text>
        </View>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`View ${profile.firstName}`} onPress={onOpen}>
        <Text style={styles.peekGo}>View</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sea: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: '#d7e6ee' },
  pin: { position: 'absolute', width: 56, height: 56, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  pinOn: { zIndex: 4, transform: [{ scale: 1.08 }] },
  halo: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(233, 64, 87, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(233, 64, 87, 0.28)',
  },
  haloOn: { backgroundColor: 'rgba(233, 64, 87, 0.32)', borderColor: color.rose },
  face: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: color.paper, backgroundColor: color.surface },
  zoom: { position: 'absolute', right: 12, top: 64, gap: 6, zIndex: 5 },
  zoomBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: color.paper,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A1A1A',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  zoomMark: { fontFamily: font.display, fontSize: 20, fontWeight: '700', color: color.ink },
  dock: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 6, paddingBottom: 12 },
  stripScroll: { width: '100%', flexGrow: 0 },
  peek: {
    width: PEEK_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: color.paper,
    borderRadius: 18,
    padding: 8,
    paddingRight: 12,
    shadowColor: '#1A1A1A',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  peekOn: { borderWidth: 2, borderColor: color.rose },
  strip: { gap: PEEK_GAP, paddingHorizontal: 12 },
  empty: {
    alignSelf: 'center',
    fontFamily: font.body,
    fontSize: 13,
    color: color.ink,
    textAlign: 'center',
    backgroundColor: color.paper,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#1A1A1A',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  peekMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  peekPhoto: { width: 48, height: 48, borderRadius: 12, backgroundColor: color.surface },
  peekCopy: { flex: 1 },
  peekName: { fontFamily: font.display, fontSize: 16, fontWeight: '700', color: color.ink },
  peekPlace: { fontFamily: font.body, fontSize: 12, color: color.mute, marginTop: 1 },
  peekGo: { fontFamily: font.body, fontSize: 14, fontWeight: '700', color: color.rose },
});

const webStripScroll = { touchAction: 'pan-x', overflowX: 'auto' } as ViewStyle;
