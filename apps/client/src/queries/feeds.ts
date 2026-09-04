import { useCallback } from 'react';
import { useInfiniteQuery, useQuery, type InfiniteData } from '@tanstack/react-query';
import { fetchIntroduction, fetchMatchPage, fetchMe, fetchPoolPage } from '../api/endpoints';
import { keys } from '../api/keys';
import { STALE } from '../api/queryClient';
import { ApiError, shouldRetry } from '../api/unwrap';
import { asIntroduction } from '../host';
import type { InboxRow } from '../match';
import { hasFullPage, nextOffset, PAGE_SIZE } from '../page';
import type { Profile } from '../profile';

/**
 * Pages are addressed by offset. `undefined` from `getNextPageParam` is how React Query
 * learns there is nothing left to load.
 */
export function nextPageParam<T>(last: T[], all: T[][]): number | undefined {
  if (!hasFullPage(last.length)) return undefined;
  return nextOffset(all.reduce((count, page) => count + page.length, 0));
}

function flatten<T>(data: InfiniteData<T[]> | undefined): T[] {
  return data?.pages.flat() ?? [];
}

export function usePool(sessionToken: string | null) {
  const query = useInfiniteQuery({
    queryKey: keys.pool(),
    enabled: Boolean(sessionToken),
    staleTime: STALE.pool,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchPoolPage(sessionToken as string, pageParam),
    getNextPageParam: nextPageParam<Profile>,
  });
  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
  }, [query.fetchNextPage, query.hasNextPage, query.isFetchingNextPage]);
  return {
    people: flatten(query.data),
    loading: query.isPending,
    failed: query.isError,
    hasMore: Boolean(query.hasNextPage),
    loadMore,
  };
}

export function useMatchInbox(sessionToken: string | null) {
  const query = useInfiniteQuery({
    queryKey: keys.matches(),
    enabled: Boolean(sessionToken),
    staleTime: STALE.matches,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchMatchPage(sessionToken as string, pageParam),
    getNextPageParam: nextPageParam<InboxRow>,
  });
  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
  }, [query.fetchNextPage, query.hasNextPage, query.isFetchingNextPage]);
  return {
    matches: flatten(query.data),
    loading: query.isPending,
    failed: query.isError,
    hasMore: Boolean(query.hasNextPage),
    loadMore,
  };
}

export function useIntroduction(sessionToken: string | null) {
  const query = useQuery({
    queryKey: keys.intro(),
    enabled: Boolean(sessionToken),
    /**
     * A live introduction is only ever replaced by an action, so it never goes stale on its
     * own. An absent one is not an answer worth keeping — the Host may have someone the
     * moment the pool moves — and pinning it would leave the Host screen empty for good.
     */
    staleTime: (entry) => (entry.state.data ? STALE.intro : 0),
    queryFn: () => fetchIntroduction(sessionToken as string),
  });
  return {
    // Restored cache entries skip the fetcher, so a value written by an older build would
    // reach the thread unchecked and render as a card with no fields. Re-assert the shape.
    introduction: asIntroduction({ introduction: query.data ?? null }),
    loading: query.isPending,
    failed: query.isError,
  };
}

export function useMe(sessionToken: string | null) {
  const query = useQuery({
    queryKey: keys.me(),
    enabled: Boolean(sessionToken),
    staleTime: STALE.me,
    queryFn: () => fetchMe(sessionToken as string),
    retry: shouldRetry,
  });
  return {
    profile: query.data ?? null,
    settled: !query.isPending || !sessionToken,
    error: query.error,
    /**
     * A 404 means this Resident has no Profile yet. Anything else — an unreachable API most
     * of all — must not read as "no Profile", or a signed-in Resident is sent back through
     * intake and their answers are posted into the void.
     */
    needsProfile: !query.isPending && !query.data && isMissing(query.error),
    unreachable: !query.isPending && !query.data && !isMissing(query.error) && Boolean(query.error),
    retry: () => {
      void query.refetch();
    },
  };
}

function isMissing(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

export { PAGE_SIZE };
