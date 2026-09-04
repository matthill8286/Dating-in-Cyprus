import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { fetchIntroduction, fetchMatchPage, fetchPoolPage } from '../api/endpoints';
import { keys } from '../api/keys';
import { STALE } from '../api/queryClient';
import type { InboxRow } from '../match';
import type { Profile } from '../profile';
import { nextPageParam } from './feeds';

/**
 * Warm the three tab feeds in parallel the moment a session exists, so the tabs are
 * populated before they mount rather than each one fetching when it first renders.
 */
export function usePrefetchFeeds(sessionToken: string | null): void {
  const client = useQueryClient();
  useEffect(() => {
    if (!sessionToken) return;
    void client.prefetchQuery({
      queryKey: keys.intro(),
      staleTime: STALE.intro,
      queryFn: () => fetchIntroduction(sessionToken),
    });
    void client.prefetchInfiniteQuery({
      queryKey: keys.pool(),
      staleTime: STALE.pool,
      initialPageParam: 0,
      queryFn: ({ pageParam }) => fetchPoolPage(sessionToken, pageParam),
      getNextPageParam: nextPageParam<Profile>,
    });
    void client.prefetchInfiniteQuery({
      queryKey: keys.matches(),
      staleTime: STALE.matches,
      initialPageParam: 0,
      queryFn: ({ pageParam }) => fetchMatchPage(sessionToken, pageParam),
      getNextPageParam: nextPageParam<InboxRow>,
    });
  }, [client, sessionToken]);
}
