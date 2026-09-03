import { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, Platform, Text, View, StyleSheet } from 'react-native';
import { MapBackdrop, MapPin, PeekStrip, ZoomPad } from './islandMapChrome';
import {
  approximatePoint,
  cityMarks,
  clampView,
  islandView,
  mapPins,
  mapShouldHandleWheel,
  panView,
  peopleInView,
  peopleWestToEast,
  pinchDistance,
  pinchFocus,
  pinchZoomDelta,
  viewForCity,
  zoomAt,
  zoomDeltaFromWheel,
  type MapView,
} from './map';
import type { Profile } from './profile';
import { font } from './theme';

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
      </View>
      <ZoomPad zoom={camera.view.zoom} onIn={() => camera.zoomBy(0.5)} onOut={() => camera.zoomBy(-0.5)} onFit={camera.fit} />
      <Text style={styles.credit} pointerEvents="none">
        © Esri · approximate city area
      </Text>
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
  const viewRef = useRef(view);
  const sizeRef = useRef({ width, height });
  const pinchRef = useRef<{ view: MapView; distance: number; x: number; y: number } | null>(null);
  const zoomByRef = useRef<(delta: number, x?: number, y?: number) => void>(() => undefined);
  const panByRef = useRef<(dx: number, dy: number) => void>(() => undefined);
  viewRef.current = view;
  sizeRef.current = { width, height };

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

  useEffect(() => bindWheel(boardRef.current, zoomByRef), [width, height]);

  const pan = useMemo(
    () =>
      boardPanResponder({
        pinchRef,
        viewRef,
        sizeRef,
        panByRef,
        setDrag,
        setView,
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

type PinchStart = { view: MapView; distance: number; x: number; y: number };

function boardPanResponder(input: {
  pinchRef: { current: PinchStart | null };
  viewRef: { current: MapView };
  sizeRef: { current: { width: number; height: number } };
  panByRef: { current: (dx: number, dy: number) => void };
  setDrag: (drag: { x: number; y: number }) => void;
  setView: (view: MapView) => void;
}) {
  const finish = (gesture: { dx: number; dy: number }) => {
    if (input.pinchRef.current) {
      input.pinchRef.current = null;
      input.setDrag({ x: 0, y: 0 });
      return;
    }
    input.panByRef.current(gesture.dx, gesture.dy);
  };
  return PanResponder.create({
    onMoveShouldSetPanResponder: (event, gesture) =>
      event.nativeEvent.touches.length >= 2 ||
      gesture.numberActiveTouches >= 2 ||
      Math.abs(gesture.dx) > 8 ||
      Math.abs(gesture.dy) > 8,
    onPanResponderMove: (event, gesture) => pinchOrPan(event.nativeEvent.touches, gesture, input),
    onPanResponderRelease: (_event, gesture) => finish(gesture),
    onPanResponderTerminate: (_event, gesture) => finish(gesture),
  });
}

function pinchOrPan(
  touches: { length: number; [index: number]: { pageX: number; pageY: number; locationX: number; locationY: number } },
  gesture: { dx: number; dy: number },
  input: Parameters<typeof boardPanResponder>[0],
) {
  if (touches.length >= 2) {
    applyPinch(touches[0], touches[1], input);
    return;
  }
  if (input.pinchRef.current) return;
  input.setDrag({ x: gesture.dx, y: gesture.dy });
}

function applyPinch(
  a: { pageX: number; pageY: number; locationX: number; locationY: number },
  b: { pageX: number; pageY: number; locationX: number; locationY: number },
  input: Parameters<typeof boardPanResponder>[0],
) {
  const dist = pinchDistance(a, b);
  if (!input.pinchRef.current) {
    const focus = pinchFocus(a, b);
    input.pinchRef.current = { view: input.viewRef.current, distance: dist, x: focus.x, y: focus.y };
    input.setDrag({ x: 0, y: 0 });
    return;
  }
  const start = input.pinchRef.current;
  const board = input.sizeRef.current;
  input.setView(
    clampView(
      zoomAt(start.view, start.view.zoom + pinchZoomDelta(start.distance, dist), start.x, start.y, board.width, board.height),
      board.width,
      board.height,
    ),
  );
}

function bindWheel(
  host: View | null,
  zoomBy: { current: (delta: number, x?: number, y?: number) => void },
): (() => void) | undefined {
  if (Platform.OS !== 'web' || !host) return undefined;
  const node = webNode(host);
  if (!node) return undefined;
  let pending = 0;
  let atX = 0;
  let atY = 0;
  let frame = 0;
  const flush = () => {
    frame = 0;
    if (pending === 0) return;
    zoomBy.current(pending, atX, atY);
    pending = 0;
  };
  const onWheel = (event: WheelEvent) => {
    if (!mapShouldHandleWheel(event.target, node)) return;
    event.preventDefault();
    const rect = node.getBoundingClientRect();
    pending += zoomDeltaFromWheel(event.deltaY);
    atX = event.clientX - rect.left;
    atY = event.clientY - rect.top;
    if (!frame) frame = requestAnimationFrame(flush);
  };
  node.addEventListener('wheel', onWheel, { passive: false });
  return () => {
    node.removeEventListener('wheel', onWheel);
    if (frame) cancelAnimationFrame(frame);
  };
}

function webNode(host: View): HTMLElement | null {
  const node = host as unknown as HTMLElement & { _nativeNode?: HTMLElement };
  if (typeof node.addEventListener === 'function') return node;
  if (node._nativeNode && typeof node._nativeNode.addEventListener === 'function') return node._nativeNode;
  return null;
}

const styles = StyleSheet.create({
  wrap: { flex: 1, minHeight: 0, position: 'relative' },
  board: { flex: 1, minHeight: 0, overflow: 'hidden', backgroundColor: '#d7e6ee' },
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
  credit: {
    position: 'absolute',
    left: 12,
    bottom: 102,
    fontFamily: font.body,
    fontSize: 9,
    color: '#5a6570',
    zIndex: 5,
  },
});
