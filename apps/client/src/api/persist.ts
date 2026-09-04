import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import type { PersistQueryClientOptions } from '@tanstack/react-query-persist-client';

const CACHE_KEY = 'here.queryCache';

/** Anything older than this is more likely to mislead than to help, so it is dropped. */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** An answer with nothing in it, which is never worth painting on a cold start. */
export function isEmptyResult(data: unknown): boolean {
  if (data === null || data === undefined) return true;
  if (Array.isArray(data)) return data.length === 0;
  return false;
}

/**
 * Writing the cache to disk is what makes a cold start paint real content: the last known
 * intro, island and inbox are on screen before the first request comes back.
 */
export const cachePersistOptions: Omit<PersistQueryClientOptions, 'queryClient'> = {
  persister: createAsyncStoragePersister({ storage: AsyncStorage, key: CACHE_KEY }),
  maxAge: MAX_AGE_MS,
  dehydrateOptions: {
    // A failed query would otherwise be restored as a failure on the next launch, and an
    // empty answer would paint an empty screen before the refetch that could fill it.
    shouldDehydrateQuery: (query) =>
      query.state.status === 'success' && !isEmptyResult(query.state.data),
  },
};
