import { useState } from 'react';
import { Image, Pressable, Text, View, StyleSheet } from 'react-native';
import { cityMarks, mapPins, mapTiles } from './map';
import type { Profile } from './profile';
import { color, font } from './theme';

export function IslandMap({
  people,
  onOpen,
}: {
  people: Profile[];
  onOpen: (profile: Profile) => void;
}) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [picked, setPicked] = useState<string | null>(null);
  const pins = mapPins(people, size.width, size.height);
  const selected = people.find((person) => person.profileId === picked) ?? people[0];

  return (
    <View style={styles.wrap}>
      <View
        style={styles.board}
        onLayout={(event) => setSize(event.nativeEvent.layout)}
      >
        <MapBackdrop width={size.width} height={size.height} />
        <View style={styles.veil} pointerEvents="none" />
        {cityMarks(size.width, size.height).map((mark) => (
          <Text
            key={mark.name}
            pointerEvents="none"
            style={[styles.city, { left: mark.x - 36, top: mark.y + 14 }]}
          >
            {mark.name}
          </Text>
        ))}
        {pins.map((pin) => (
          <MapPin
            key={pin.profile.profileId}
            profile={pin.profile}
            x={pin.x}
            y={pin.y}
            active={selected?.profileId === pin.profile.profileId}
            onPress={() => setPicked(pin.profile.profileId)}
          />
        ))}
        <Text style={styles.credit} pointerEvents="none">
          © Esri
        </Text>
      </View>
      <Text style={styles.note}>Approximate area in their city. Never a home address.</Text>
      {selected ? (
        <PeekCard profile={selected} onOpen={() => onOpen(selected)} />
      ) : (
        <Text style={styles.empty}>No one new right now.</Text>
      )}
    </View>
  );
}

function MapBackdrop({ width, height }: { width: number; height: number }) {
  return (
    <View style={styles.sea} pointerEvents="none">
      {mapTiles(width, height).map((tile) => (
        <Image
          key={tile.key}
          source={{ uri: tile.url }}
          style={{
            position: 'absolute',
            left: tile.x,
            top: tile.y,
            width: tile.width,
            height: tile.height,
          }}
        />
      ))}
    </View>
  );
}

function MapPin({
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

function PeekCard({ profile, onOpen }: { profile: Profile; onOpen: () => void }) {
  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`${profile.firstName} profile`}
      style={styles.peek}
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
        <Text style={styles.peekPlace}>{profile.city} · Republic of Cyprus</Text>
      </View>
      <Text style={styles.peekGo}>View</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, minHeight: 0, gap: 10 },
  board: {
    flex: 1,
    minHeight: 280,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#d7e6ee',
  },
  sea: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: '#d7e6ee' },
  veil: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.04)' },
  city: {
    position: 'absolute',
    width: 72,
    textAlign: 'center',
    fontFamily: font.body,
    fontSize: 10,
    fontWeight: '700',
    color: '#4a5560',
    letterSpacing: 0.2,
  },
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
  note: { fontFamily: font.body, fontSize: 12, color: color.mute, textAlign: 'center' },
  peek: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: color.paper,
    borderRadius: 20,
    padding: 10,
    shadowColor: '#1A1A1A',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  peekPhoto: { width: 56, height: 56, borderRadius: 14, backgroundColor: color.surface },
  peekCopy: { flex: 1 },
  peekName: { fontFamily: font.display, fontSize: 18, fontWeight: '700', color: color.ink },
  peekPlace: { fontFamily: font.body, fontSize: 13, color: color.mute, marginTop: 2 },
  peekGo: { fontFamily: font.body, fontSize: 14, fontWeight: '700', color: color.rose, paddingRight: 8 },
  empty: { fontFamily: font.body, fontSize: 15, color: color.mute, textAlign: 'center', paddingVertical: 12 },
  credit: {
    position: 'absolute',
    left: 10,
    bottom: 8,
    fontFamily: font.body,
    fontSize: 9,
    color: '#5a6570',
  },
});
