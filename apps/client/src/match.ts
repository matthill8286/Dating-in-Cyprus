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
