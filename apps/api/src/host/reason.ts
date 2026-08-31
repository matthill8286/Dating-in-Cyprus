import type { LaunchLanguage } from '../account/store';
import type { OperatingAreaCity } from '../profile/model';

const LANGUAGE_NAME: Record<LaunchLanguage, string> = {
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
};

export type ViewerFacts = {
  city: OperatingAreaCity;
  languagesSpoken: LaunchLanguage[];
};

export function sharedLanguage(
  viewer: LaunchLanguage[],
  other: LaunchLanguage[],
): LaunchLanguage | undefined {
  return other.find((code) => viewer.includes(code));
}

export function introductionReason(viewer: ViewerFacts, person: ReasonFacts): string {
  const sameCity = viewer.city === person.city;
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
