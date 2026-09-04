import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { postAsk, postPass, postYes } from './api/endpoints';
import { keys } from './api/keys';
import { useIntroduction, usePool } from './queries/feeds';
import type { HostIntroduction, HostMatch, HostVerb } from './host';

export function useHost(sessionToken: string | null) {
  const client = useQueryClient();
  const pool = usePool(sessionToken);
  const intro = useIntroduction(sessionToken);
  const [revealed, setRevealed] = useState(false);
  const [verb, setVerb] = useState<HostVerb>(null);
  const [matched, setMatched] = useState<HostMatch | null>(null);
  const [want, setWant] = useState<string | null>(null);

  /** Drop the card and wait for the next one; the island pool is deliberately left alone. */
  const awaitNextIntroduction = useCallback(() => {
    client.setQueryData(keys.intro(), null);
    void client.invalidateQueries({ queryKey: keys.intro() });
  }, [client]);

  const yes = useMutation({
    mutationFn: (introduction: HostIntroduction) => postYes(sessionToken as string, introduction.introductionId),
    onSuccess: (result, introduction) => {
      if (result.matched && result.matchId) {
        setMatched({
          matchId: result.matchId,
          firstName: introduction.firstName,
          profileId: introduction.profileId,
        });
        setVerb('yes');
      }
      void client.invalidateQueries({ queryKey: keys.matches() });
      awaitNextIntroduction();
    },
  });

  const pass = useMutation({
    mutationFn: (introduction: HostIntroduction) => postPass(sessionToken as string, introduction.introductionId),
    onSuccess: awaitNextIntroduction,
  });

  const ask = useMutation({
    mutationFn: (note: string) => postAsk(sessionToken as string, note),
    onSuccess: (next) => {
      client.setQueryData(keys.intro(), next);
      setRevealed(false);
      setVerb(null);
    },
  });

  const busy = yes.isPending || pass.isPending || ask.isPending;
  const decidable = intro.introduction && !busy && matched?.profileId !== intro.introduction.profileId;

  return {
    introduction: intro.introduction,
    people: pool.people,
    hasMore: pool.hasMore,
    poolLoading: pool.loading,
    poolFailed: pool.failed,
    // The card is missing either because the first fetch is in flight or because Ask is running.
    introPending: intro.loading || ask.isPending,
    introFailed: intro.failed,
    actionFailed: yes.isError || pass.isError || ask.isError,
    revealed,
    verb,
    matched,
    busy,
    want,
    looking: ask.isPending,
    more: () => {
      setRevealed(true);
      setVerb('more');
    },
    yes: () => {
      if (decidable && intro.introduction) yes.mutate(intro.introduction);
    },
    pass: () => {
      if (decidable && intro.introduction) pass.mutate(intro.introduction);
    },
    ask: (text: string) => {
      const note = text.trim();
      if (!note || !sessionToken || busy) return;
      setWant(note);
      ask.mutate(note);
    },
    reload: awaitNextIntroduction,
    loadMore: pool.loadMore,
  };
}
