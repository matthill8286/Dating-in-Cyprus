import { useEffect, useState } from 'react';
import { api } from './api/client';
import { afterDecision, ageBandById, filterDeck, interestMatched, type AgeBandId, type MatchedCard } from './match';
import type { Profile } from './profile';

export function useDeck(sessionToken: string | null) {
  const [people, setPeople] = useState<Profile[]>([]);
  const [city, setCity] = useState('all');
  const [ageBand, setAgeBand] = useState<AgeBandId>('all');
  const [matched, setMatched] = useState<MatchedCard | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!sessionToken) return;
    void api
      .GET('/v1/pool', { headers: { authorization: `Bearer ${sessionToken}` } })
      .then(({ data }) => {
        if (data?.profiles) setPeople(data.profiles as Profile[]);
      });
  }, [sessionToken]);

  const band = ageBandById(ageBand);
  const visible = filterDeck(people, city, band.min, band.max);
  const card = visible[0];

  async function decide(kind: 'pass' | 'like', target?: Profile) {
    const chosen = target ?? card;
    if (!chosen || !sessionToken || busy) return;
    setBusy(true);
    const headers = { authorization: `Bearer ${sessionToken}` };
    if (kind === 'pass') {
      await api.POST('/v1/passes', { headers, body: { profileId: chosen.profileId } });
    } else {
      const { data } = await api.POST('/v1/interests', {
        headers,
        body: { profileId: chosen.profileId },
      });
      setMatched(interestMatched(data, chosen));
    }
    setPeople((prev) => afterDecision(prev, chosen.profileId));
    setBusy(false);
  }

  function hide(profileId: string) {
    setPeople((prev) => afterDecision(prev, profileId));
  }

  return { card, visible, city, setCity, ageBand, setAgeBand, matched, setMatched, decide, hide };
}
