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
  const [matchProfile, setMatchProfile] = useState<Profile | null>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    if (!sessionToken) return;
    const headers = { authorization: `Bearer ${sessionToken}` };
    const [intro, pool] = await Promise.all([
      api.GET('/v1/introductions', { headers }),
      api.GET('/v1/pool', { headers }),
    ]);
    setIntroduction(asIntroduction(intro.data));
    setRevealed(false);
    setVerb(null);
    if (pool.data?.profiles) setPeople(pool.data.profiles as Profile[]);
    setReady(true);
  }, [sessionToken]);

  useEffect(() => {
    void load();
  }, [load]);

  async function decide(kind: 'yes' | 'pass') {
    if (!introduction || !sessionToken || busy || matched) return;
    setBusy(true);
    const headers = { authorization: `Bearer ${sessionToken}` };
    const params = { path: { introductionId: introduction.introductionId } };
    if (kind === 'yes') {
      const { data } = await api.POST('/v1/introductions/{introductionId}/yes', { headers, params });
      const opened = interestMatched(data, hostAsProfile(introduction));
      if (opened) {
        setMatched({
          matchId: opened.matchId,
          firstName: introduction.firstName,
          profileId: introduction.profileId,
        });
        setMatchProfile(opened.profile);
        setVerb('yes');
        setBusy(false);
        return;
      }
    } else {
      await api.POST('/v1/introductions/{introductionId}/pass', { headers, params });
    }
    await load();
    setBusy(false);
  }

  return {
    introduction,
    people,
    revealed,
    verb,
    matched,
    matchProfile,
    busy,
    ready,
    more: () => {
      setRevealed(true);
      setVerb('more');
    },
    yes: () => void decide('yes'),
    pass: () => void decide('pass'),
    reload: () => void load(),
  };
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
