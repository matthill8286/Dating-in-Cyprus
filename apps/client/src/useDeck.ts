import { useEffect, useState } from 'react';
import { api } from './api/client';
import { afterDecision, filterDeck, interestMatched, type MatchedCard } from './match';
import type { Profile } from './profile';

export function useDeck(sessionToken: string | null) {
  const [people, setPeople] = useState<Profile[]>([]);
  const [city, setCity] = useState('all');
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

  const card = filterDeck(people, city)[0];

  async function decide(kind: 'pass' | 'like') {
    if (!card || !sessionToken || busy) return;
    setBusy(true);
    const headers = { authorization: `Bearer ${sessionToken}` };
    if (kind === 'pass') {
      await api.POST('/v1/passes', { headers, body: { profileId: card.profileId } });
    } else {
      const { data } = await api.POST('/v1/interests', {
        headers,
        body: { profileId: card.profileId },
      });
      setMatched(interestMatched(data, card));
    }
    setPeople((prev) => afterDecision(prev, card.profileId));
    setBusy(false);
  }

  return { card, city, setCity, matched, setMatched, decide };
}
