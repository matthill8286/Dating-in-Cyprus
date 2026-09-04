import { QueryClient } from '@tanstack/react-query';
import { shouldRetry } from './unwrap';

/** How long each tier stays trusted without a refetch. */
export const STALE = {
  /** The introduction carries its own `expiresAt`; only an action should replace it. */
  intro: Number.POSITIVE_INFINITY,
  pool: 5 * 60 * 1000,
  matches: 30 * 1000,
  me: 5 * 60 * 1000,
  messages: 0,
} as const;

/** Long enough that a cached screen survives a backgrounded app and a cold start. */
const KEEP_MS = 24 * 60 * 60 * 1000;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: KEEP_MS,
        retry: shouldRetry,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: { retry: false },
    },
  });
}
