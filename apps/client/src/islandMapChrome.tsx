import { Image, Pressable, Text, View, StyleSheet } from 'react-native';
import type { MapView } from './map';
import { mapTiles, MAX_ZOOM, MIN_ZOOM } from './map';
import type { Profile } from './profile';
import { color, font } from './theme';

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
        <Text style={styles.zoomMark}>◎</Text>
      </Pressable>
    </View>
  );
}

export function PeekCard({ profile, onOpen }: { profile: Profile; onOpen: () => void }) {
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
  zoom: { position: 'absolute', right: 10, top: 10, gap: 6, zIndex: 5 },
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
});
