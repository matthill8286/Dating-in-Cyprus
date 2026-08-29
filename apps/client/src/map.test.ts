import { describe, expect, it } from 'vitest';
import { approximatePoint, CITY_CENTERS, cityMarks, mapPins, mapTiles, project } from './map';
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

  it('projects pins inside the island bounds', () => {
    const pins = mapPins([elena, { ...elena, profileId: 'p2', city: 'Paphos' }], 400, 500);
    expect(pins).toHaveLength(2);
    expect(pins.every((pin) => pin.x >= 0 && pin.x <= 400 && pin.y >= 0 && pin.y <= 500)).toBe(true);
    const origin = project(35.72, 32.2, 400, 500);
    expect(origin).toEqual({ x: 0, y: 0 });
  });

  it('covers the island with map tiles and city labels', () => {
    expect(mapTiles(0, 400)).toEqual([]);
    const tiles = mapTiles(400, 500);
    expect(tiles.length).toBeGreaterThan(3);
    expect(tiles.every((tile) => tile.url.includes('World_Light_Gray_Base'))).toBe(true);
    const labels = cityMarks(400, 500);
    expect(labels.map((label) => label.name)).toContain('Limassol');
    expect(labels.every((label) => label.x >= 0 && label.x <= 400)).toBe(true);
  });
});
