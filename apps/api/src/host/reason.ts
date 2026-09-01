import { LAUNCH_LANGUAGES, type LaunchLanguage } from '../account/store';
import type { OperatingAreaCity } from '../profile/model';

export const LANGUAGE_NAME: Record<LaunchLanguage, string> = {
  en: 'English',
  uk: 'Ukrainian',
  ru: 'Russian',
  ro: 'Romanian',
  bg: 'Bulgarian',
};

const EVENING: Record<OperatingAreaCity, string> = {
  Limassol: 'An evening walk along the sea path, then somewhere quiet for a drink.',
  Nicosia: 'Coffee in the old town after work.',
  Larnaca: 'A slow evening by the seafront.',
  Paphos: 'A harbour walk before dinner.',
  Paralimni: 'A still evening toward Protaras.',
  'Ayia Napa': 'A simple evening on the east coast, after the day crowds.',
};

export type ReasonFacts = {
  firstName: string;
  city: OperatingAreaCity;
  languagesSpoken: LaunchLanguage[];
  bio?: string;
  photoVerification?: 'verified' | 'unverified';
};

export type ViewerFacts = {
  city: OperatingAreaCity;
  languagesSpoken: LaunchLanguage[];
  bio?: string;
};

export function sharedLanguage(
  viewer: LaunchLanguage[],
  other: LaunchLanguage[],
): LaunchLanguage | undefined {
  return other.find((code) => viewer.includes(code));
}

export function wantedLanguages(want?: string): LaunchLanguage[] {
  if (!want) return [];
  const words = new Set(want.toLowerCase().match(/[a-z]{3,}/g) ?? []);
  return LAUNCH_LANGUAGES.filter(
    (code) => words.has(LANGUAGE_NAME[code].toLowerCase()) || words.has(code),
  );
}

export function languageSearchText(person: ReasonFacts): string {
  return person.languagesSpoken.map((code) => `${code} ${LANGUAGE_NAME[code]}`).join(' ').toLowerCase();
}

export function factReason(viewer: ViewerFacts, person: ReasonFacts, want?: string): string {
  const sameCity = viewer.city === person.city;
  const asked = wantedLanguages(want).filter((code) => person.languagesSpoken.includes(code));
  if (asked.length > 0) {
    const spoken = asked.map((code) => LANGUAGE_NAME[code]).join(' and ');
    if (sameCity) return `You both live in ${person.city}. ${person.firstName} speaks ${spoken}.`;
    return `${person.firstName} lives in ${person.city} and speaks ${spoken}.`;
  }
  const language = sharedLanguage(viewer.languagesSpoken, person.languagesSpoken);
  const spoken = language ? LANGUAGE_NAME[language] : null;
  if (sameCity && spoken) {
    return `You both live in ${person.city}, and you both speak ${spoken}.`;
  }
  if (sameCity) return `You both live in ${person.city}.`;
  if (spoken) {
    return `${person.firstName} lives in ${person.city}. You both speak ${spoken}.`;
  }
  return `${person.firstName} lives in ${person.city}.`;
}

export function quoteFromBio(bio: string, hint?: string): string | undefined {
  const parts = bio
    .split(/[.!?]/)
    .map((part) => part.trim())
    .filter(Boolean);
  const hintWords = (hint ?? '').toLowerCase().match(/[a-z]{3,}/g) ?? [];
  const hit = hintWords.length
    ? parts.find((part) => hintWords.some((word) => part.toLowerCase().includes(word)))
    : parts[0];
  if (!hit || !bio.includes(hit)) return undefined;
  return hit.length > 88 ? `${hit.slice(0, 85).trimEnd()}…` : hit;
}

export function introductionReason(viewer: ViewerFacts, person: ReasonFacts, want?: string): string {
  const facts = factReason(viewer, person, want);
  const quote = quoteFromBio(person.bio ?? '', want || viewer.bio);
  if (!quote) return facts;
  return `${facts} ${person.firstName} writes, “${quote}.”`;
}

export function meetFraming(city: OperatingAreaCity): string {
  return EVENING[city];
}

export function pickFromPool<T extends { city: string }>(
  visible: T[],
  viewerCity: string,
): T | undefined {
  return visible.find((person) => person.city === viewerCity) ?? visible[0];
}

export function isFresh(expiresAt: string, now: Date): boolean {
  return new Date(expiresAt).getTime() > now.getTime();
}
