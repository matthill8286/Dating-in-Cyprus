import { useIsFocused } from '@react-navigation/native';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { fetchMessages, postMessage } from '../api/endpoints';
import { keys } from '../api/keys';
import { CHAT_POLL_MS, canSend, type ChatLine } from '../chat';
import { hasFullPage } from '../page';

type Thread = InfiniteData<ChatLine[]>;

/** Pages arrive newest-first, each ascending inside. Flip the page order to read oldest to newest. */
function inOrder(data: Thread | undefined): ChatLine[] {
  return [...(data?.pages ?? [])].reverse().flat();
}

/** Cap what a poll revalidates: without this every tick would re-request the whole history. */
const MAX_PAGES = 3;

export function useChatThread(sessionToken: string | null, matchId: string) {
  const client = useQueryClient();
  const focused = useIsFocused();

  const query = useInfiniteQuery({
    queryKey: keys.messages(matchId),
    enabled: Boolean(sessionToken),
    initialPageParam: undefined as string | undefined,
    maxPages: MAX_PAGES,
    queryFn: ({ pageParam }) => fetchMessages(sessionToken as string, matchId, pageParam),
    getNextPageParam: (oldest) => (hasFullPage(oldest.length) ? oldest[0]?.sentAt : undefined),
    refetchInterval: focused ? CHAT_POLL_MS : false,
  });

  const send = useMutation({
    mutationFn: (body: string) => postMessage(sessionToken as string, matchId, body.trim()),
    onMutate: async (body: string) => {
      await client.cancelQueries({ queryKey: keys.messages(matchId) });
      const previous = client.getQueryData<Thread>(keys.messages(matchId));
      client.setQueryData<Thread>(keys.messages(matchId), (current) =>
        current ? withPending(current, body.trim()) : current,
      );
      return { previous };
    },
    onError: (_error, _body, context) => {
      if (context?.previous) client.setQueryData(keys.messages(matchId), context.previous);
    },
    onSettled: () => {
      void client.invalidateQueries({ queryKey: keys.messages(matchId) });
      void client.invalidateQueries({ queryKey: keys.matches() });
    },
  });

  return {
    lines: inOrder(query.data),
    ready: !query.isPending,
    failed: query.isError,
    sendFailed: send.isError,
    hasOlder: query.hasNextPage,
    loadOlder: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
    },
    send: (body: string) => {
      if (!sessionToken || !canSend(body)) return;
      send.mutate(body);
    },
  };
}

/** The newest page is `pages[0]`, ascending, so an outgoing line belongs at its end. */
function withPending(thread: Thread, body: string): Thread {
  const line: ChatLine = {
    messageId: `pending-${Date.now()}`,
    fromMe: true,
    body,
    sentAt: new Date().toISOString(),
  };
  const [newest = [], ...older] = thread.pages;
  return { ...thread, pages: [[...newest, line], ...older] };
}
