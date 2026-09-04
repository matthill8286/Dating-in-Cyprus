/**
 * Every cache entry is named here, so a mutation can invalidate exactly what it changed
 * rather than reaching for the whole cache.
 */
export const keys = {
  me: () => ['me'] as const,
  intro: () => ['intro'] as const,
  pool: () => ['pool'] as const,
  matches: () => ['matches'] as const,
  messages: (matchId: string) => ['messages', matchId] as const,
};

export type QueryKey =
  | ReturnType<typeof keys.me>
  | ReturnType<typeof keys.intro>
  | ReturnType<typeof keys.pool>
  | ReturnType<typeof keys.matches>
  | ReturnType<typeof keys.messages>;
