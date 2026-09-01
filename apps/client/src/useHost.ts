import { useCallback, useEffect, useState } from 'react';
import { api } from './api/client';
import { asIntroduction, type HostIntroduction, type HostMatch, type HostVerb } from './host';
import { interestMatched } from './match';
import type { Profile } from './profile';

export function useHost(sessionToken: string | null) {
  const [introduction, setIntroduction] = useState<HostIntroduction | null>(null);
  const [people, setPeople] = useState<Profile[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [verb, setVerb] = useState<HostVerb>(null);
  const [matched, setMatched] = useState<HostMatch | null>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [want, setWant] = useState<string | null>(null);
  const [looking, setLooking] = useState(false);

  const load = useCallback(async () => {
    if (!sessionToken) return;
    const next = await fetchHost(sessionToken);
    setIntroduction(next.intro);
    setPeople(next.people);
    setRevealed(false);
    setVerb(null);
    setReady(true);
  }, [sessionToken]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    introduction,
    people,
    revealed,
    verb,
    matched,
    busy,
    ready,
    want,
    looking,
    more: () => {
      setRevealed(true);
      setVerb('more');
    },
    yes: () =>
      void decideYes(sessionToken, introduction, busy, matched, setBusy, setMatched, setVerb, load),
    pass: () => void decidePass(sessionToken, introduction, busy, matched, setBusy, load),
    ask: (text: string) =>
      void askHere(text, sessionToken, busy, setBusy, setLooking, setWant, setIntroduction, setRevealed, setVerb),
    reload: () => void load(),
  };
}

async function fetchHost(sessionToken: string) {
  const headers = { authorization: `Bearer ${sessionToken}` };
  const [intro, pool] = await Promise.all([
    api.GET('/v1/introductions', { headers }),
    api.GET('/v1/pool', { headers }),
  ]);
  return {
    intro: asIntroduction(intro.data),
    people: (pool.data?.profiles ?? []) as Profile[],
  };
}

async function decideYes(
  sessionToken: string | null,
  introduction: HostIntroduction | null,
  busy: boolean,
  matched: HostMatch | null,
  setBusy: (value: boolean) => void,
  setMatched: (value: HostMatch) => void,
  setVerb: (value: HostVerb) => void,
  load: () => Promise<void>,
) {
  if (!introduction || !sessionToken || busy) return;
  if (matched?.profileId === introduction.profileId) return;
  setBusy(true);
  const headers = { authorization: `Bearer ${sessionToken}` };
  const params = { path: { introductionId: introduction.introductionId } };
  const { data } = await api.POST('/v1/introductions/{introductionId}/yes', { headers, params });
  const opened = interestMatched(data, hostAsProfile(introduction));
  if (opened) {
    setMatched({ matchId: opened.matchId, firstName: introduction.firstName, profileId: introduction.profileId });
    setVerb('yes');
  }
  await load();
  setBusy(false);
}

async function decidePass(
  sessionToken: string | null,
  introduction: HostIntroduction | null,
  busy: boolean,
  matched: HostMatch | null,
  setBusy: (value: boolean) => void,
  load: () => Promise<void>,
) {
  if (!introduction || !sessionToken || busy) return;
  if (matched?.profileId === introduction.profileId) return;
  setBusy(true);
  await api.POST('/v1/introductions/{introductionId}/pass', {
    headers: { authorization: `Bearer ${sessionToken}` },
    params: { path: { introductionId: introduction.introductionId } },
  });
  await load();
  setBusy(false);
}

async function askHere(
  text: string,
  sessionToken: string | null,
  busy: boolean,
  setBusy: (value: boolean) => void,
  setLooking: (value: boolean) => void,
  setWant: (value: string) => void,
  setIntroduction: (value: HostIntroduction | null) => void,
  setRevealed: (value: boolean) => void,
  setVerb: (value: HostVerb) => void,
) {
  const note = text.trim();
  if (!note || !sessionToken || busy) return;
  setBusy(true);
  setLooking(true);
  setWant(note);
  const { data } = await api.POST('/v1/introductions', {
    headers: { authorization: `Bearer ${sessionToken}` },
    body: { want: note },
  });
  setIntroduction(asIntroduction(data));
  setRevealed(false);
  setVerb(null);
  setLooking(false);
  setBusy(false);
}

function hostAsProfile(intro: HostIntroduction): Profile {
  return {
    profileId: intro.profileId,
    accountId: '',
    firstName: intro.firstName,
    age: 0,
    city: intro.city as Profile['city'],
    languagesSpoken: intro.languagesSpoken as Profile['languagesSpoken'],
    bio: intro.bio,
    photos: intro.portraitUrl ? [{ photoId: 'portrait', url: intro.portraitUrl }] : [],
    photoVerification: intro.photoVerification,
  };
}
