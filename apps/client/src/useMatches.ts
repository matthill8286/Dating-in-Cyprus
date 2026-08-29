import { useEffect, useState } from 'react';
import { api } from './api/client';
import type { InboxRow } from './match';

export function useMatches(sessionToken: string | null) {
  const [matches, setMatches] = useState<InboxRow[]>([]);

  useEffect(() => {
    if (!sessionToken) return;
    void api
      .GET('/v1/matches', { headers: { authorization: `Bearer ${sessionToken}` } })
      .then(({ data }) => {
        if (data?.matches) setMatches(data.matches as InboxRow[]);
      });
  }, [sessionToken]);

  return matches;
}
