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

export function filterDeck(
  people: Profile[],
  city: string,
  ageMin = 21,
  ageMax = 55,
): Profile[] {
  return people.filter((person) => {
    if (city !== 'all' && person.city !== city) return false;
    return person.age >= ageMin && person.age <= ageMax;
  });
}

export const AGE_BANDS = [
  { id: 'all', label: 'Any age', min: 21, max: 55 },
  { id: '20s', label: '21–29', min: 21, max: 29 },
  { id: '30s', label: '30–39', min: 30, max: 39 },
  { id: '40s', label: '40+', min: 40, max: 55 },
] as const;

export type AgeBandId = (typeof AGE_BANDS)[number]['id'];

export const AGE_BAND_LABELS: Record<string, string> = Object.fromEntries(
  AGE_BANDS.map((band) => [band.id, band.label]),
);

export function ageBandById(id: AgeBandId) {
  return AGE_BANDS.find((band) => band.id === id) ?? AGE_BANDS[0];
}

export type InboxRow = {
  matchId: string;
  profile: Profile;
  lastMessage: { body: string; fromMe: boolean; sentAt: string } | null;
};

export function splitInbox(matches: InboxRow[]): { fresh: InboxRow[]; threads: InboxRow[] } {
  return {
    fresh: matches.filter((item) => !item.lastMessage),
    threads: matches.filter((item) => item.lastMessage),
  };
}

export function searchInbox(rows: InboxRow[], query: string): InboxRow[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((row) => row.profile.firstName.toLowerCase().includes(needle));
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
