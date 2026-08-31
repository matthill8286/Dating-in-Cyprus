import type { Profile } from './profile';

export const CITY_CENTERS: Record<string, { lat: number; lng: number }> = {
  Limassol: { lat: 34.685, lng: 33.038 },
  Nicosia: { lat: 35.185, lng: 33.382 },
  Larnaca: { lat: 34.917, lng: 33.63 },
  Paphos: { lat: 34.772, lng: 32.43 },
  Paralimni: { lat: 35.039, lng: 33.983 },
  'Ayia Napa': { lat: 34.992, lng: 34.001 },
};

export const MAP_BOUNDS = {
  west: 32.2,
  east: 34.7,
  south: 34.5,
  north: 35.72,
};

export const TILE = 256;
export const MIN_ZOOM = 7;
export const MAX_ZOOM = 12;

const JITTER_KM = 2.4;

export type MapView = {
  zoom: number;
  centerLat: number;
  centerLng: number;
};

export type MapTile = {
  key: string;
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type MapPin = {
  profile: Profile;
  x: number;
  y: number;
};

export function hashId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return hash;
}

export function approximatePoint(city: string, profileId: string): { lat: number; lng: number } | null {
  const center = CITY_CENTERS[city];
  if (!center) return null;
  const hash = hashId(profileId);
  const angle = ((hash % 360) * Math.PI) / 180;
  const distKm = ((hash % 80) / 80) * JITTER_KM;
  const latKm = 111;
  const lngKm = 111 * Math.cos((center.lat * Math.PI) / 180);
  return {
    lat: center.lat + (Math.cos(angle) * distKm) / latKm,
    lng: center.lng + (Math.sin(angle) * distKm) / lngKm,
  };
}

function world(zoom: number): number {
  return TILE * 2 ** zoom;
}

export function lngToWorldX(lng: number, zoom: number): number {
  return ((lng + 180) / 360) * world(zoom);
}

export function latToWorldY(lat: number, zoom: number): number {
  const sin = Math.sin((lat * Math.PI) / 180);
  return (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * world(zoom);
}

export function worldXToLng(x: number, zoom: number): number {
  return (x / world(zoom)) * 360 - 180;
}

export function worldYToLat(y: number, zoom: number): number {
  const n = Math.PI - (2 * Math.PI * y) / world(zoom);
  return (180 / Math.PI) * Math.atan(Math.sinh(n));
}

export function clampZoom(zoom: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
}

const WHEEL_ZOOM_PX = 320;
const WHEEL_ZOOM_CAP = 0.28;

export function zoomDeltaFromWheel(deltaY: number): number {
  return Math.max(-WHEEL_ZOOM_CAP, Math.min(WHEEL_ZOOM_CAP, -deltaY / WHEEL_ZOOM_PX));
}

export function projectOnView(
  lat: number,
  lng: number,
  view: MapView,
  width: number,
  height: number,
): { x: number; y: number } {
  const z = view.zoom;
  return {
    x: width / 2 + lngToWorldX(lng, z) - lngToWorldX(view.centerLng, z),
    y: height / 2 + latToWorldY(lat, z) - latToWorldY(view.centerLat, z),
  };
}

export function islandView(width: number, height: number): MapView {
  return viewForBounds(MAP_BOUNDS, width, height);
}

export function viewForBounds(
  bounds: typeof MAP_BOUNDS,
  width: number,
  height: number,
): MapView {
  if (width <= 0 || height <= 0) {
    return { zoom: MIN_ZOOM, centerLat: 34.9, centerLng: 33.4 };
  }
  let zoom = MAX_ZOOM;
  while (zoom > MIN_ZOOM) {
    const spanX = lngToWorldX(bounds.east, zoom) - lngToWorldX(bounds.west, zoom);
    const spanY = latToWorldY(bounds.south, zoom) - latToWorldY(bounds.north, zoom);
    if (spanX <= width && spanY <= height) break;
    zoom -= 1;
  }
  return {
    zoom,
    centerLat: (bounds.north + bounds.south) / 2,
    centerLng: (bounds.west + bounds.east) / 2,
  };
}

export function viewForCity(city: string, width: number, height: number): MapView {
  const center = CITY_CENTERS[city];
  if (!center) return islandView(width, height);
  return clampView({ zoom: 11, centerLat: center.lat, centerLng: center.lng }, width, height);
}

export function panView(view: MapView, dx: number, dy: number): MapView {
  const z = view.zoom;
  return {
    zoom: z,
    centerLng: worldXToLng(lngToWorldX(view.centerLng, z) - dx, z),
    centerLat: worldYToLat(latToWorldY(view.centerLat, z) - dy, z),
  };
}

export function zoomAt(
  view: MapView,
  nextZoom: number,
  x: number,
  y: number,
  width: number,
  height: number,
): MapView {
  const zoom = clampZoom(nextZoom);
  if (Math.abs(zoom - view.zoom) < 1e-6) return view;
  const { lat, lng } = screenToLatLng(view, x, y, width, height);
  const next = { ...view, zoom };
  const placed = projectOnView(lat, lng, next, width, height);
  return panView(next, x - placed.x, y - placed.y);
}

export function screenToLatLng(
  view: MapView,
  x: number,
  y: number,
  width: number,
  height: number,
): { lat: number; lng: number } {
  const z = view.zoom;
  return {
    lat: worldYToLat(latToWorldY(view.centerLat, z) + (y - height / 2), z),
    lng: worldXToLng(lngToWorldX(view.centerLng, z) + (x - width / 2), z),
  };
}

export function clampView(view: MapView, width: number, height: number): MapView {
  const zoom = clampZoom(view.zoom);
  const west = lngToWorldX(MAP_BOUNDS.west, zoom);
  const east = lngToWorldX(MAP_BOUNDS.east, zoom);
  const north = latToWorldY(MAP_BOUNDS.north, zoom);
  const south = latToWorldY(MAP_BOUNDS.south, zoom);
  const cx = clampAxis(lngToWorldX(view.centerLng, zoom), west, east, width);
  const cy = clampAxis(latToWorldY(view.centerLat, zoom), north, south, height);
  return { zoom, centerLng: worldXToLng(cx, zoom), centerLat: worldYToLat(cy, zoom) };
}

function clampAxis(center: number, min: number, max: number, size: number): number {
  const overlap = Math.min(80, max - min);
  return Math.min(max + size / 2 - overlap, Math.max(min - size / 2 + overlap, center));
}

export function peopleWestToEast(people: Profile[]): Profile[] {
  return [...people].sort((a, b) => {
    const lngA = approximatePoint(a.city, a.profileId)?.lng ?? 0;
    const lngB = approximatePoint(b.city, b.profileId)?.lng ?? 0;
    if (lngA !== lngB) return lngA - lngB;
    return a.firstName.localeCompare(b.firstName);
  });
}

export function mapTiles(view: MapView, width: number, height: number): MapTile[] {
  if (width <= 0 || height <= 0) return [];
  const z = view.zoom;
  const tileZ = Math.floor(z);
  const tileSize = TILE * 2 ** (z - tileZ);
  const left = lngToWorldX(view.centerLng, z) - width / 2;
  const top = latToWorldY(view.centerLat, z) - height / 2;
  const tiles: MapTile[] = [];
  const maxIndex = 2 ** tileZ;
  for (let tx = Math.floor((left - tileSize) / tileSize); tx <= Math.floor((left + width + tileSize) / tileSize); tx += 1) {
    for (let ty = Math.floor((top - tileSize) / tileSize); ty <= Math.floor((top + height + tileSize) / tileSize); ty += 1) {
      if (ty < 0 || ty >= maxIndex) continue;
      const wrapped = ((tx % maxIndex) + maxIndex) % maxIndex;
      tiles.push({
        key: `${tileZ}-${wrapped}-${ty}`,
        url: `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/${tileZ}/${ty}/${wrapped}`,
        x: tx * tileSize - left,
        y: ty * tileSize - top,
        width: tileSize,
        height: tileSize,
      });
    }
  }
  return tiles;
}

export function cityMarks(
  view: MapView,
  width: number,
  height: number,
): { name: string; x: number; y: number }[] {
  if (width <= 0 || height <= 0) return [];
  return Object.entries(CITY_CENTERS).map(([name, point]) => {
    const { x, y } = projectOnView(point.lat, point.lng, view, width, height);
    return { name, x, y };
  });
}

export function mapPins(people: Profile[], view: MapView, width: number, height: number): MapPin[] {
  if (width <= 0 || height <= 0) return [];
  return people.flatMap((person) => {
    const point = approximatePoint(person.city, person.profileId);
    if (!point) return [];
    const { x, y } = projectOnView(point.lat, point.lng, view, width, height);
    return [{ profile: person, x, y }];
  });
}

export function pinOnScreen(
  pin: MapPin,
  width: number,
  height: number,
  drag = { x: 0, y: 0 },
): boolean {
  const x = pin.x + drag.x;
  const y = pin.y + drag.y;
  return x >= -36 && x <= width + 36 && y >= -36 && y <= height + 36;
}

export function mapShouldHandleWheel(
  target: unknown,
  host: { contains: (node: never) => boolean } | null,
): boolean {
  return Boolean(target && host?.contains(target as never));
}

export function peopleInView(
  people: Profile[],
  view: MapView,
  width: number,
  height: number,
  drag = { x: 0, y: 0 },
): Profile[] {
  return mapPins(people, view, width, height)
    .filter((pin) => pinOnScreen(pin, width, height, drag))
    .map((pin) => pin.profile);
}
