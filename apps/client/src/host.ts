const LANGUAGE_NAME: Record<string, string> = {
  en: 'English',
  uk: 'Ukrainian',
  ru: 'Russian',
  ro: 'Romanian',
  bg: 'Bulgarian',
};

export type HostIntroduction = {
  introductionId: string;
  profileId: string;
  firstName: string;
  city: string;
  languagesSpoken: string[];
  photoVerification: 'verified' | 'unverified';
  reason: string;
  meetFraming: string;
  portraitUrl: string;
  bio: string;
  expiresAt: string;
};

export type HostMatch = { matchId: string; firstName: string; profileId: string };

export type HostVerb = 'yes' | 'pass' | 'more' | null;

export type HostLine =
  | { id: string; kind: 'host'; body: string }
  | { id: string; kind: 'you'; body: string }
  | { id: string; kind: 'intro'; introduction: HostIntroduction; revealed: boolean };

export const HOST_OPENING =
  "I'm Here. Tell me who you're hoping to meet — I'll look across the island and introduce one person.";

export const HOST_EMPTY = "No one new this evening. Tell me a little more, and I'll look again.";

export const HOST_LOOKING = "I'm looking across the island.";

export function spokenList(codes: readonly string[]): string {
  return codes.map((code) => LANGUAGE_NAME[code] ?? code).join(' · ');
}

export function verificationCopy(mark: string): string {
  return mark === 'verified' ? 'Photo verified' : 'Unverified';
}

export function hostLines(input: {
  introduction: HostIntroduction | null;
  revealed: boolean;
  verb: HostVerb;
  matched: HostMatch | null;
  want?: string | null;
  looking?: boolean;
}): HostLine[] {
  const lines: HostLine[] = [{ id: 'open', kind: 'host', body: HOST_OPENING }];
  if (input.want) {
    lines.push({ id: 'want', kind: 'you', body: input.want });
  }
  if (input.looking) {
    lines.push({ id: 'look', kind: 'host', body: HOST_LOOKING });
    return lines;
  }
  if (input.matched) {
    lines.push({ id: 'yes', kind: 'you', body: 'Yes.' });
    lines.push({
      id: 'leave',
      kind: 'host',
      body: `You're both interested. I'll step back — you can write to ${input.matched.firstName}.`,
    });
    return lines;
  }
  if (!input.introduction) {
    lines.push({ id: 'empty', kind: 'host', body: HOST_EMPTY });
    return lines;
  }
  lines.push({
    id: input.introduction.introductionId,
    kind: 'intro',
    introduction: input.introduction,
    revealed: input.revealed,
  });
  if (input.verb === 'more') {
    lines.push({ id: 'more', kind: 'you', body: 'Tell me more.' });
  }
  return lines;
}

export function canDecide(
  introduction: HostIntroduction | null,
  busy: boolean,
  matched: HostMatch | null,
): boolean {
  return Boolean(introduction && !busy && !matched);
}

export function asIntroduction(data: unknown): HostIntroduction | null {
  if (!data || typeof data !== 'object') return null;
  if (!('introduction' in data)) return null;
  const intro = (data as { introduction: HostIntroduction | null }).introduction;
  return intro?.introductionId ? intro : null;
}
