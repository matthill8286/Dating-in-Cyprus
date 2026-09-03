import { describe, expect, it } from 'vitest';
import {
  approximatePoint,
  CITY_CENTERS,
  cityMarks,
  clampView,
  islandView,
  mapPins,
  mapTiles,
  panView,
  peopleWestToEast,
  peopleInView,
  pinOnScreen,
  projectOnView,
  viewForCity,
  pinchDistance,
  pinchFocus,
  pinchZoomDelta,
  zoomAt,
  zoomDeltaFromWheel,
} from './map';
import type { Profile } from './profile';

const elena: Profile = {
  profileId: 'p1',
  accountId: 'a1',
  firstName: 'Elena',
  age: 29,
  city: 'Limassol',
  languagesSpoken: ['en'],
  bio: 'Marina.',
  photos: [],
};

describe('approximate map', () => {
  it('jitters a city centre so two people in Limassol are not on the same point', () => {
    const one = approximatePoint('Limassol', 'p1');
    const two = approximatePoint('Limassol', 'p2');
    expect(one).not.toBeNull();
    expect(two).not.toBeNull();
    expect(one).not.toEqual(two);
    expect(one).toEqual(approximatePoint('Limassol', 'p1'));
    const centre = CITY_CENTERS.Limassol;
    expect(Math.abs((one?.lat ?? 0) - centre.lat)).toBeLessThan(0.04);
    expect(approximatePoint('Kyrenia', 'p1')).toBeNull();
  });

  it('puts the camera centre in the middle of the view', () => {
    const view = { zoom: 10, centerLat: 34.685, centerLng: 33.038 };
    const mid = projectOnView(34.685, 33.038, view, 400, 500);
    expect(mid.x).toBeCloseTo(200);
    expect(mid.y).toBeCloseTo(250);
  });

  it('pans so the map follows the finger and stays over the island', () => {
    const view = { zoom: 10, centerLat: 34.685, centerLng: 33.038 };
    const before = projectOnView(34.685, 33.038, view, 400, 400);
    const panned = panView(view, 80, 0);
    const after = projectOnView(34.685, 33.038, panned, 400, 400);
    expect(panned.centerLng).toBeLessThan(view.centerLng);
    expect(after.x).toBeCloseTo(before.x + 80);
    const runaway = clampView({ zoom: 10, centerLat: 40, centerLng: 20 }, 400, 400);
    expect(runaway.centerLng).toBeGreaterThan(32);
    expect(runaway.centerLng).toBeLessThan(35);
    expect(runaway.centerLat).toBeLessThan(36);
    const island = islandView(400, 500);
    const stayed = clampView(panView(island, 120, 30), 400, 500);
    expect(stayed.centerLng).not.toBeCloseTo(island.centerLng, 4);
  });

  it('zooms around a point without jumping that place on screen', () => {
    const view = islandView(400, 400);
    const point = CITY_CENTERS.Paphos;
    const before = projectOnView(point.lat, point.lng, view, 400, 400);
    const next = zoomAt(view, view.zoom + 1, before.x, before.y, 400, 400);
    expect(next.zoom).toBe(view.zoom + 1);
    const after = projectOnView(point.lat, point.lng, next, 400, 400);
    expect(after.x).toBeCloseTo(before.x, 0);
    expect(after.y).toBeCloseTo(before.y, 0);
    expect(zoomAt(view, 99, 200, 200, 400, 400).zoom).toBe(12);
  });

  it('frames a city closer than the whole island and lays tiles in the camera', () => {
    const island = islandView(400, 500);
    const limassol = viewForCity('Limassol', 400, 500);
    expect(limassol.zoom).toBeGreaterThan(island.zoom);
    expect(limassol.centerLat).toBeCloseTo(CITY_CENTERS.Limassol.lat, 1);
    expect(viewForCity('Kyrenia', 400, 500).zoom).toBe(island.zoom);
    expect(mapTiles(island, 0, 400)).toEqual([]);
    const tiles = mapTiles(island, 400, 500);
    expect(tiles.length).toBeGreaterThan(3);
    expect(tiles.every((tile) => tile.width === 256)).toBe(true);
    expect(tiles.every((tile) => tile.url.includes('World_Light_Gray_Base'))).toBe(true);
    const pins = mapPins([elena, { ...elena, profileId: 'p2', city: 'Paphos' }], island, 400, 500);
    expect(pins).toHaveLength(2);
    expect(cityMarks(island, 400, 500).map((mark) => mark.name)).toContain('Limassol');
  });

  it('orders people west to east so the peek strip can be scrolled', () => {
    const paphos: Profile = { ...elena, profileId: 'p2', firstName: 'Ioana', city: 'Paphos' };
    const napa: Profile = { ...elena, profileId: 'p3', firstName: 'Daria', city: 'Ayia Napa' };
    expect(peopleWestToEast([napa, elena, paphos]).map((person) => person.city)).toEqual([
      'Paphos',
      'Limassol',
      'Ayia Napa',
    ]);
  });
});

describe('calm zoom', () => {
  it('zooms in small fractional steps so a pinch does not skip a level', () => {
    const view = islandView(400, 400);
    expect(Math.abs(zoomDeltaFromWheel(12))).toBeLessThan(0.1);
    expect(Math.abs(zoomDeltaFromWheel(800))).toBeLessThanOrEqual(0.28);
    expect(zoomDeltaFromWheel(-40)).toBeGreaterThan(0);
    const next = zoomAt(view, view.zoom + zoomDeltaFromWheel(-40), 200, 200, 400, 400);
    expect(next.zoom).toBeGreaterThan(view.zoom);
    expect(next.zoom).toBeLessThan(view.zoom + 1);
    const mid = mapTiles({ ...view, zoom: view.zoom + 0.5 }, 400, 400);
    expect(mid[0]?.width).toBeGreaterThan(256);
    expect(mid[0]?.url).toContain(`/tile/${Math.floor(view.zoom + 0.5)}/`);
  });

  it('zooms a pinch by the log of the finger span, around the midpoint', () => {
    expect(pinchDistance({ pageX: 0, pageY: 0 }, { pageX: 80, pageY: 60 })).toBe(100);
    expect(pinchFocus({ locationX: 40, locationY: 10 }, { locationX: 120, locationY: 90 })).toEqual({
      x: 80,
      y: 50,
    });
    expect(pinchZoomDelta(100, 200)).toBeCloseTo(1);
    expect(pinchZoomDelta(200, 100)).toBeCloseTo(-1);
    expect(pinchZoomDelta(100, 100)).toBe(0);
    expect(pinchZoomDelta(0, 140)).toBe(0);
    const view = islandView(400, 400);
    const doubled = zoomAt(view, view.zoom + pinchZoomDelta(80, 160), 200, 200, 400, 400);
    expect(doubled.zoom).toBeCloseTo(view.zoom + 1);
  });
});

describe('people in view', () => {
  it('keeps the peek strip to people whose pin is on the map', () => {
    const paphos: Profile = { ...elena, profileId: 'p2', firstName: 'Ioana', city: 'Paphos' };
    const napa: Profile = { ...elena, profileId: 'p3', firstName: 'Daria', city: 'Ayia Napa' };
    const east = viewForCity('Ayia Napa', 360, 400);
    const seen = peopleInView([elena, paphos, napa], east, 360, 400);
    expect(seen.map((person) => person.city)).toContain('Ayia Napa');
    expect(seen.map((person) => person.city)).not.toContain('Paphos');
    expect(pinOnScreen({ profile: elena, x: 500, y: 80 }, 360, 400)).toBe(false);
    expect(pinOnScreen({ profile: elena, x: 500, y: 80 }, 360, 400, { x: -200, y: 0 })).toBe(true);
  });
});
