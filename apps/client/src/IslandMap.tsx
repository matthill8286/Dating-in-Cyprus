import { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, Platform, Text, View, StyleSheet } from 'react-native';
import { MapBackdrop, MapPin, PeekStrip, ZoomPad } from './islandMapChrome';
import {
  approximatePoint,
  cityMarks,
  clampView,
  islandView,
  mapPins,
  panView,
  peopleInView,
  peopleWestToEast,
  viewForCity,
  zoomAt,
  type MapView,
} from './map';
import type { Profile } from './profile';
import { color, font } from './theme';

export function IslandMap({
  people,
  city,
  onOpen,
}: {
  people: Profile[];
  city: string;
  onOpen: (profile: Profile) => void;
}) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [picked, setPicked] = useState<string | null>(null);
  const camera = useMapCamera(size.width, size.height, city);
  const ordered = peopleWestToEast(people);
  const pins = mapPins(ordered, camera.view, size.width, size.height);
  const inView = peopleInView(ordered, camera.view, size.width, size.height, camera.drag);
  const selected = inView.find((person) => person.profileId === picked) ?? inView[0];

  return (
    <View style={styles.wrap}>
      <View
        ref={camera.boardRef}
        collapsable={false}
        style={styles.board}
        onLayout={(event) => setSize(event.nativeEvent.layout)}
        {...camera.pan.panHandlers}
      >
        <View
          pointerEvents="box-none"
          style={[styles.layer, { transform: [{ translateX: camera.drag.x }, { translateY: camera.drag.y }] }]}
        >
          <MapBackdrop view={camera.view} width={size.width} height={size.height} />
          {cityMarks(camera.view, size.width, size.height).map((mark) => (
            <Text key={mark.name} pointerEvents="none" style={[styles.city, { left: mark.x - 36, top: mark.y + 14 }]}>
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
              onPress={() => {
                setPicked(pin.profile.profileId);
                camera.focus(pin.profile);
              }}
            />
          ))}
        </View>
        <ZoomPad zoom={camera.view.zoom} onIn={() => camera.zoomBy(1)} onOut={() => camera.zoomBy(-1)} onFit={camera.fit} />
        <Text style={styles.credit} pointerEvents="none">
          © Esri · drag or scroll
        </Text>
      </View>
      <Text style={styles.note}>Approximate area in their city. Never a home address.</Text>
      <PeekStrip
        people={inView}
        selectedId={selected?.profileId}
        empty="No one in this part of the island."
        onPick={(profile) => setPicked(profile.profileId)}
        onOpen={onOpen}
      />
    </View>
  );
}

function useMapCamera(width: number, height: number, city: string) {
  const boardRef = useRef<View>(null);
  const framed = useRef(false);
  const cityRef = useRef(city);
  const [view, setView] = useState<MapView>(() => islandView(width, height));
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const zoomByRef = useRef<(delta: number, x?: number, y?: number) => void>(() => undefined);
  const panByRef = useRef<(dx: number, dy: number) => void>(() => undefined);

  zoomByRef.current = (delta, x = width / 2, y = height / 2) => {
    setView((current) => clampView(zoomAt(current, current.zoom + delta, x ?? width / 2, y ?? height / 2, width, height), width, height));
  };
  panByRef.current = (dx, dy) => {
    setView((current) => clampView(panView(current, dx, dy), width, height));
    setDrag({ x: 0, y: 0 });
  };

  useEffect(() => {
    if (width <= 0) return;
    const switched = cityRef.current !== city;
    cityRef.current = city;
    if (!framed.current || switched) {
      setView(city === 'all' ? islandView(width, height) : viewForCity(city, width, height));
      framed.current = true;
      setDrag({ x: 0, y: 0 });
      return;
    }
    setView((current) => clampView(current, width, height));
  }, [width, height, city]);

  useEffect(() => bindWheel(boardRef.current, panByRef, zoomByRef), [width, height]);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dx) > 8 || Math.abs(gesture.dy) > 8,
        onPanResponderMove: (_event, gesture) => setDrag({ x: gesture.dx, y: gesture.dy }),
        onPanResponderRelease: (_event, gesture) => panByRef.current(gesture.dx, gesture.dy),
        onPanResponderTerminate: (_event, gesture) => panByRef.current(gesture.dx, gesture.dy),
      }),
    [],
  );

  return {
    boardRef,
    view,
    drag,
    pan,
    zoomBy(delta: number, x = width / 2, y = height / 2) {
      zoomByRef.current(delta, x, y);
    },
    fit() {
      setView(islandView(width, height));
    },
    focus(profile: Profile) {
      const point = approximatePoint(profile.city, profile.profileId);
      if (!point) return;
      setView((current) =>
        clampView({ zoom: Math.max(current.zoom, 11), centerLat: point.lat, centerLng: point.lng }, width, height),
      );
    },
  };
}

function bindWheel(
  host: View | null,
  panBy: { current: (dx: number, dy: number) => void },
  zoomBy: { current: (delta: number, x?: number, y?: number) => void },
): (() => void) | undefined {
  if (Platform.OS !== 'web' || !host) return undefined;
  const node = webNode(host);
  if (!node) return undefined;
  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    const rect = node.getBoundingClientRect();
    if (event.ctrlKey || event.metaKey) {
      zoomBy.current(event.deltaY < 0 ? 1 : -1, event.clientX - rect.left, event.clientY - rect.top);
      return;
    }
    panBy.current(-event.deltaX, -event.deltaY);
  };
  node.addEventListener('wheel', onWheel, { passive: false });
  return () => node.removeEventListener('wheel', onWheel);
}

function webNode(host: View): HTMLElement | null {
  const node = host as unknown as HTMLElement & { _nativeNode?: HTMLElement };
  if (typeof node.addEventListener === 'function') return node;
  if (node._nativeNode && typeof node._nativeNode.addEventListener === 'function') return node._nativeNode;
  return null;
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
  layer: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  city: {
    position: 'absolute',
    width: 72,
    textAlign: 'center',
    fontFamily: font.body,
    fontSize: 10,
    fontWeight: '700',
    color: '#4a5560',
  },
  note: { fontFamily: font.body, fontSize: 12, color: color.mute, textAlign: 'center' },
  credit: {
    position: 'absolute',
    left: 10,
    bottom: 8,
    fontFamily: font.body,
    fontSize: 9,
    color: '#5a6570',
  },
});
