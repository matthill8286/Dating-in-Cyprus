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
  projectOnView,
  viewForCity,
  zoomAt,
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
});
