import type { ChatLine } from '../chat';
import { asIntroduction, type HostIntroduction } from '../host';
import type { InboxRow } from '../match';
import { pageQuery, PAGE_SIZE } from '../page';
import type { Profile } from '../profile';
import { api } from './client';
import { unwrap } from './unwrap';

function bearer(sessionToken: string) {
  return { authorization: `Bearer ${sessionToken}` };
}

export async function fetchMe(sessionToken: string): Promise<Profile> {
  const result = await api.GET('/v1/profiles/me', { headers: bearer(sessionToken) });
  return unwrap(result) as Profile;
}

export async function fetchPoolPage(sessionToken: string, offset: number): Promise<Profile[]> {
  const result = await api.GET('/v1/pool', {
    headers: bearer(sessionToken),
    params: { query: pageQuery(offset) },
  });
  return (unwrap(result).profiles ?? []) as Profile[];
}

export async function fetchMatchPage(sessionToken: string, offset: number): Promise<InboxRow[]> {
  const result = await api.GET('/v1/matches', {
    headers: bearer(sessionToken),
    params: { query: pageQuery(offset) },
  });
  return (unwrap(result).matches ?? []) as InboxRow[];
}

export async function fetchIntroduction(sessionToken: string): Promise<HostIntroduction | null> {
  const result = await api.GET('/v1/introductions', { headers: bearer(sessionToken) });
  return asIntroduction(unwrap(result));
}

/** Newest page of a thread, or the page immediately older than `before`. */
export async function fetchMessages(
  sessionToken: string,
  matchId: string,
  before?: string,
): Promise<ChatLine[]> {
  const result = await api.GET('/v1/matches/{matchId}/messages', {
    headers: bearer(sessionToken),
    params: {
      path: { matchId },
      query: before ? { limit: PAGE_SIZE, before } : { limit: PAGE_SIZE },
    },
  });
  return (unwrap(result).messages ?? []) as ChatLine[];
}

export async function postAsk(sessionToken: string, want: string): Promise<HostIntroduction | null> {
  const result = await api.POST('/v1/introductions', {
    headers: bearer(sessionToken),
    body: { want },
  });
  return asIntroduction(unwrap(result));
}

export async function postYes(
  sessionToken: string,
  introductionId: string,
): Promise<{ matched: boolean; matchId?: string }> {
  const result = await api.POST('/v1/introductions/{introductionId}/yes', {
    headers: bearer(sessionToken),
    params: { path: { introductionId } },
  });
  return unwrap(result);
}

export async function postPass(sessionToken: string, introductionId: string): Promise<void> {
  const result = await api.POST('/v1/introductions/{introductionId}/pass', {
    headers: bearer(sessionToken),
    params: { path: { introductionId } },
  });
  unwrap(result);
}

export async function postMessage(
  sessionToken: string,
  matchId: string,
  body: string,
): Promise<ChatLine> {
  const result = await api.POST('/v1/matches/{matchId}/messages', {
    headers: bearer(sessionToken),
    params: { path: { matchId } },
    body: { body },
  });
  return unwrap(result) as ChatLine;
}
