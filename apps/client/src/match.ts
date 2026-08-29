import type { Profile } from './profile';

export const CITY_FILTERS = [
  'all',
  'Limassol',
  'Nicosia',
  'Larnaca',
  'Paphos',
  'Paralimni',
  'Ayia Napa',
] as const;

export const CITY_FILTER_LABELS: Record<string, string> = {
  all: 'All',
};

export type MatchedCard = { matchId: string; profile: Profile };

export function filterDeck(people: Profile[], city: string): Profile[] {
  if (city === 'all') return people;
  return people.filter((person) => person.city === city);
}

export function afterDecision(people: Profile[], profileId: string): Profile[] {
  return people.filter((person) => person.profileId !== profileId);
}

export function interestMatched(
  data: { matched?: boolean; matchId?: string } | undefined,
  profile: Profile,
): MatchedCard | null {
  if (!data?.matched || !data.matchId) return null;
  return { matchId: data.matchId, profile };
}

export function swipeDecision(dx: number, threshold = 110): 'like' | 'pass' | null {
  if (dx >= threshold) return 'like';
  if (dx <= -threshold) return 'pass';
  return null;
}

export function nextPhotoIndex(current: number, count: number, step: 1 | -1): number {
  if (count <= 0) return 0;
  return (current + step + count) % count;
}

export function photoTap(x: number, width: number): 1 | -1 {
  return x < width * 0.35 ? -1 : 1;
}

export function deckTap(
  x: number,
  y: number,
  width: number,
  height: number,
): 'open' | 'photo-prev' | 'photo-next' {
  if (height > 0 && y > height * 0.72) return 'open';
  return photoTap(x, width) === -1 ? 'photo-prev' : 'photo-next';
}
