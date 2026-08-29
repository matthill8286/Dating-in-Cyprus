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

const JITTER_KM = 2.4;

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

const TILE = 256;

function mercatorY(lat: number): number {
  const rad = (Math.max(-85, Math.min(85, lat)) * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + rad / 2));
}

export function project(
  lat: number,
  lng: number,
  width: number,
  height: number,
): { x: number; y: number } {
  const x = ((lng - MAP_BOUNDS.west) / (MAP_BOUNDS.east - MAP_BOUNDS.west)) * width;
  const north = mercatorY(MAP_BOUNDS.north);
  const south = mercatorY(MAP_BOUNDS.south);
  const y = ((north - mercatorY(lat)) / (north - south)) * height;
  return { x, y };
}

function lngToWorldX(lng: number, zoom: number): number {
  return ((lng + 180) / 360) * TILE * 2 ** zoom;
}

function latToWorldY(lat: number, zoom: number): number {
  const sin = Math.sin((lat * Math.PI) / 180);
  return (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * TILE * 2 ** zoom;
}

export function mapZoom(width: number): number {
  if (width <= 0) return 8;
  const span = MAP_BOUNDS.east - MAP_BOUNDS.west;
  const zoom = Math.log2((width / span) * (360 / TILE));
  return Math.max(7, Math.min(9, Math.round(zoom)));
}

export type MapTile = {
  key: string;
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export function mapTiles(width: number, height: number): MapTile[] {
  if (width <= 0 || height <= 0) return [];
  const zoom = mapZoom(width);
  const left = lngToWorldX(MAP_BOUNDS.west, zoom);
  const right = lngToWorldX(MAP_BOUNDS.east, zoom);
  const top = latToWorldY(MAP_BOUNDS.north, zoom);
  const bottom = latToWorldY(MAP_BOUNDS.south, zoom);
  const scaleX = width / (right - left);
  const scaleY = height / (bottom - top);
  const tiles: MapTile[] = [];
  for (let tx = Math.floor(left / TILE); tx <= Math.floor((right - 1) / TILE); tx += 1) {
    for (let ty = Math.floor(top / TILE); ty <= Math.floor((bottom - 1) / TILE); ty += 1) {
      tiles.push({
        key: `${zoom}-${tx}-${ty}`,
        url: `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/${zoom}/${ty}/${tx}`,
        x: (tx * TILE - left) * scaleX,
        y: (ty * TILE - top) * scaleY,
        width: TILE * scaleX,
        height: TILE * scaleY,
      });
    }
  }
  return tiles;
}

export function cityMarks(width: number, height: number): { name: string; x: number; y: number }[] {
  if (width <= 0 || height <= 0) return [];
  return Object.entries(CITY_CENTERS).map(([name, point]) => {
    const { x, y } = project(point.lat, point.lng, width, height);
    return { name, x, y };
  });
}

export type MapPin = {
  profile: Profile;
  x: number;
  y: number;
};

export function mapPins(people: Profile[], width: number, height: number): MapPin[] {
  if (width <= 0 || height <= 0) return [];
  return people.flatMap((person) => {
    const point = approximatePoint(person.city, person.profileId);
    if (!point) return [];
    const { x, y } = project(point.lat, point.lng, width, height);
    return [{ profile: person, x, y }];
  });
}
