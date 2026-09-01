import type { ReasonFacts, ViewerFacts } from './reason';
import { chooseFromPool } from './score';

export type RankedPerson = ReasonFacts & { profileId: string };

export type HostFetch = (url: string, init: RequestInit) => Promise<Response>;

export type HostModelOpts = {
  url?: string;
  key?: string;
  name?: string;
  fetch?: HostFetch;
  timeoutMs?: number;
};

const SYSTEM =
  'Pick one profileId from the list. Reply JSON {"profileId":"..."}. Use only listed people. Do not invent bios, jobs, or pickup lines.';

export function parseModelChoice(raw: string, allowed: Set<string>): string | undefined {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return undefined;
  try {
    const id = (JSON.parse(match[0]) as { profileId?: unknown }).profileId;
    return typeof id === 'string' && allowed.has(id) ? id : undefined;
  } catch {
    return undefined;
  }
}

export async function chooseWithModel<T extends RankedPerson>(
  visible: T[],
  viewer: ViewerFacts,
  want: string | undefined,
  opts: HostModelOpts = {},
): Promise<T | undefined> {
  const local = chooseFromPool(visible, viewer, want);
  if (!opts.url || visible.length === 0) return local;
  const id = await askModel(visible, viewer, want, opts).catch(() => undefined);
  return visible.find((person) => person.profileId === id) ?? local;
}

async function askModel(
  visible: RankedPerson[],
  viewer: ViewerFacts,
  want: string | undefined,
  opts: HostModelOpts,
): Promise<string | undefined> {
  const url = opts.url;
  if (!url) return undefined;
  const allowed = new Set(visible.map((person) => person.profileId));
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), opts.timeoutMs ?? 4000);
  try {
    const res = await (opts.fetch ?? fetch)(url, {
      method: 'POST',
      signal: abort.signal,
      headers: modelHeaders(opts.key),
      body: JSON.stringify(modelBody(visible, viewer, want, opts.name)),
    });
    if (!res.ok) return undefined;
    const payload = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return parseModelChoice(payload.choices?.[0]?.message?.content ?? '', allowed);
  } finally {
    clearTimeout(timer);
  }
}

function modelHeaders(key?: string): Record<string, string> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (key) {
    headers.authorization = `Bearer ${key}`;
    headers['api-key'] = key;
  }
  return headers;
}

function modelBody(visible: RankedPerson[], viewer: ViewerFacts, want: string | undefined, name?: string) {
  const people = visible.map((person) => ({
    profileId: person.profileId,
    firstName: person.firstName,
    city: person.city,
    languagesSpoken: person.languagesSpoken,
    bio: person.bio ?? '',
  }));
  return {
    temperature: 0,
    ...(name ? { model: name } : {}),
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM },
      {
        role: 'user',
        content: JSON.stringify({
          viewer: { city: viewer.city, languagesSpoken: viewer.languagesSpoken, bio: viewer.bio ?? '', want: want ?? '' },
          people,
        }),
      },
    ],
  };
}
