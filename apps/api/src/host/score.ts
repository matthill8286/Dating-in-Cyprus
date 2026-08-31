import { sharedLanguage, type ReasonFacts, type ViewerFacts } from './reason';

const SKIP = new Set([
  'the',
  'and',
  'for',
  'you',
  'your',
  'with',
  'this',
  'that',
  'from',
  'then',
  'here',
  'home',
  'live',
  'lives',
  'year',
  'years',
  'work',
  'after',
]);

export function tokens(text: string): string[] {
  return (text.toLowerCase().match(/[a-z]{3,}/g) ?? []).filter((word) => !SKIP.has(word));
}

export function matchScore(
  viewer: ViewerFacts,
  person: ReasonFacts,
  want?: string,
): number {
  let score = 0;
  if (viewer.city === person.city) score += 4;
  if (sharedLanguage(viewer.languagesSpoken, person.languagesSpoken)) score += 3;
  if (person.photoVerification === 'verified') score += 1;
  score += hintHits(person, want) * 5;
  score += Math.min(6, sharedBioTokens(viewer.bio ?? '', person.bio ?? '').length * 2);
  return score;
}

export function chooseFromPool<T extends ReasonFacts>(
  visible: T[],
  viewer: ViewerFacts,
  want?: string,
): T | undefined {
  if (visible.length === 0) return undefined;
  return [...visible].sort((a, b) => {
    const gap = matchScore(viewer, b, want) - matchScore(viewer, a, want);
    if (gap !== 0) return gap;
    return a.firstName.localeCompare(b.firstName);
  })[0];
}

function hintHits(person: ReasonFacts, want?: string): number {
  if (!want) return 0;
  const hay = `${person.city} ${person.bio ?? ''} ${person.firstName}`.toLowerCase();
  return tokens(want).filter((word) => hay.includes(word)).length;
}

function sharedBioTokens(viewerBio: string, otherBio: string): string[] {
  const other = new Set(tokens(otherBio));
  return tokens(viewerBio).filter((word) => other.has(word));
}
