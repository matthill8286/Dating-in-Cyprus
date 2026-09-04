import { Pressable, Text, View, StyleSheet } from 'react-native';
import { IslandMap } from './IslandMap';
import type { Profile } from './profile';
import { color, font } from './theme';
import { asText } from './ui/mark';

export function DiscoverHeader({
  city,
  mapOn,
  filtersOn,
  onToggleMap,
  onToggleFilters,
  overlay,
}: {
  city: string;
  mapOn: boolean;
  filtersOn: boolean;
  onToggleMap: () => void;
  onToggleFilters: () => void;
  overlay?: boolean;
}) {
  const place = city === 'all' ? 'Republic of Cyprus' : city;
  return (
    <View style={[styles.header, overlay && styles.headerOverlay]} pointerEvents="box-none">
      <PlaceLabel overlay={overlay} place={place} />
      <View style={styles.tools}>
        <MapTool mark={asText('◎')} label="Map" on={mapOn} overlay={overlay} onPress={onToggleMap} />
        <MapTool mark={asText('☰')} label="Filters" on={filtersOn} overlay={overlay} onPress={onToggleFilters} />
      </View>
    </View>
  );
}

function PlaceLabel({ overlay, place }: { overlay?: boolean; place: string }) {
  if (overlay) {
    return (
      <View style={styles.placePill}>
        <Text style={styles.placePillText} numberOfLines={1}>
          {place}
        </Text>
      </View>
    );
  }
  return (
    <View>
      <Text style={styles.title}>Discover</Text>
      <Text style={styles.place}>{place}</Text>
    </View>
  );
}

function MapTool({
  mark,
  label,
  on,
  overlay,
  onPress,
}: {
  mark: string;
  label: string;
  on: boolean;
  overlay?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.tool, overlay && styles.toolFloat, on && styles.toolOn]}
    >
      <Text style={[styles.toolMark, on && styles.toolMarkOn]}>{mark}</Text>
    </Pressable>
  );
}

export function MapStage({
  people,
  city,
  mapOn,
  filtersOn,
  onToggleMap,
  onToggleFilters,
  onOpen,
}: {
  people: Profile[];
  city: string;
  mapOn: boolean;
  filtersOn: boolean;
  onToggleMap: () => void;
  onToggleFilters: () => void;
  onOpen: (profile: Profile) => void;
}) {
  return (
    <View style={styles.mapStage}>
      <IslandMap people={people} city={city} onOpen={onOpen} />
      <DiscoverHeader
        city={city}
        mapOn={mapOn}
        filtersOn={filtersOn}
        overlay
        onToggleMap={onToggleMap}
        onToggleFilters={onToggleFilters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mapStage: { flex: 1, minHeight: 0, backgroundColor: '#d7e6ee' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 12,
  },
  headerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 0,
    gap: 12,
  },
  title: { color: color.ink, fontFamily: font.display, fontSize: 28, fontWeight: '700' },
  place: { color: color.mute, fontFamily: font.body, fontSize: 13, marginTop: 2 },
  placePill: {
    flexShrink: 1,
    maxWidth: '58%',
    backgroundColor: color.paper,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#1A1A1A',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  placePillText: { fontFamily: font.body, fontSize: 14, fontWeight: '700', color: color.ink },
  tools: { flexDirection: 'row', gap: 8 },
  tool: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolFloat: {
    backgroundColor: color.paper,
    shadowColor: '#1A1A1A',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  toolOn: { backgroundColor: color.rose },
  toolMark: { color: color.ink, fontSize: 20, fontWeight: '800' },
  toolMarkOn: { color: color.onRose },
});
