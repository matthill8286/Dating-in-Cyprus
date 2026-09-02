import { useEffect, useState } from 'react';
import { api } from './api/client';
import type { InboxRow } from './match';

export function useMatches(sessionToken: string | null): { matches: InboxRow[]; ready: boolean } {
  const [matches, setMatches] = useState<InboxRow[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!sessionToken) return;
    setReady(false);
    void api
      .GET('/v1/matches', { headers: { authorization: `Bearer ${sessionToken}` } })
      .then(({ data }) => {
        if (data?.matches) setMatches(data.matches as InboxRow[]);
      })
      .finally(() => setReady(true));
  }, [sessionToken]);

  return { matches, ready };
}
