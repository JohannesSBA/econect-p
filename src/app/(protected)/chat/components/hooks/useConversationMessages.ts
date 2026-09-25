import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "sonner";

import { socketManager } from "@/lib/socket";
import { Message } from "@/types/message";

type MessagesResponse =
  | { messages?: Message[]; hasMore?: boolean; nextCursor?: string | null }
  | Message[];

const normalizePayload = (data: MessagesResponse) => {
  if (Array.isArray(data)) {
    return { messages: data, hasMore: false, nextCursor: null };
  }

  return {
    messages: data.messages ?? [],
    hasMore: Boolean(data.hasMore),
    nextCursor: data.nextCursor ?? null,
  };
};

interface UseConversationMessagesParams {
  chatId: string;
  chatPartner: string;
}

interface UseConversationMessagesResult {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  userReadStatus: Record<string, boolean>;
  setUserReadStatus: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  loading: boolean;
  loadingMore: boolean;
  listRef: React.RefObject<HTMLDivElement | null>;
  scrollAnchorRef: React.RefObject<HTMLDivElement | null>;
}

export function useConversationMessages({
  chatId,
  chatPartner,
}: UseConversationMessagesParams): UseConversationMessagesResult {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userReadStatus, setUserReadStatus] = useState<Record<string, boolean>>(
    {},
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const cursorRef = useRef<string | null>(null);

  const listRef = useRef<HTMLDivElement | null>(null);
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);
  const isPrependingRef = useRef<boolean>(false);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post("/api/message/get", {
        chatPartner,
        chatId,
        limit: 15,
      });

      const payload = normalizePayload(response.data as MessagesResponse);

      const sortedMessages = payload.messages.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );

      setMessages(sortedMessages);
      setHasMore(payload.hasMore);
      cursorRef.current =
        payload.nextCursor ?? sortedMessages.at(0)?.id ?? null;

      const initialReadStatus: Record<string, boolean> = {};
      sortedMessages.forEach((message) => {
        initialReadStatus[message.id] = message.readBy.length > 0;
      });
      setUserReadStatus(initialReadStatus);
    } catch (_error) {
      toast.error("Sorry, this chat isn't available.");
    } finally {
      setLoading(false);
    }
  }, [chatId, chatPartner]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || messages.length === 0) {
      return;
    }

    setLoadingMore(true);
    isPrependingRef.current = true;

    const topBefore = messages[0];
    const topId = topBefore?.id ?? cursorRef.current;
    const container = listRef.current;
    const prevScrollHeight = container?.scrollHeight || 0;
    const prevScrollTop = container?.scrollTop || 0;

    try {
      const response = await axios.post("/api/message/get", {
        chatPartner,
        chatId,
        limit: 15,
        cursor: topId,
      });

      const payload = normalizePayload(response.data as MessagesResponse);
      const olderMessages = payload.messages;

      if (olderMessages.length > 0) {
        setMessages((prev) => [...olderMessages, ...prev]);
        setHasMore(payload.hasMore);
        cursorRef.current =
          payload.nextCursor ?? olderMessages.at(0)?.id ?? topId ?? null;

        setUserReadStatus((prev) => {
          const next = { ...prev };
          olderMessages.forEach((message) => {
            next[message.id] = message.readBy.length > 0;
          });
          return next;
        });

        requestAnimationFrame(() => {
          if (container && topId) {
            const newScrollHeight = container.scrollHeight;
            const delta = newScrollHeight - prevScrollHeight;
            container.scrollTop = prevScrollTop + delta;
          }
        });
      } else {
        setHasMore(false);
      }
    } finally {
      setLoadingMore(false);
      requestAnimationFrame(() => {
        isPrependingRef.current = false;
      });
    }
  }, [chatId, chatPartner, hasMore, loadingMore, messages]);

  useEffect(() => {
    const element = listRef.current;
    if (!element) return;

    const onScroll = () => {
      if (element.scrollTop < 60) {
        void loadMore();
      }
    };

    element.addEventListener("scroll", onScroll);

    return () => {
      element.removeEventListener("scroll", onScroll);
    };
  }, [loadMore]);

  useEffect(() => {
    if (isPrependingRef.current) {
      return;
    }

    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    let isMounted = true;

    const markRead = async () => {
      try {
        await axios.post("/api/message/mark-read", { chatPartner });
        socketManager.emit("messages_read", { chatPartner, chatId });
      } catch (_error) {
        // ignore
      }
    };

    const load = async () => {
      await loadMessages();
      if (isMounted) {
        await markRead();
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [chatId, chatPartner, loadMessages]);

  return {
    messages,
    setMessages,
    userReadStatus,
    setUserReadStatus,
    loading,
    loadingMore,
    listRef,
    scrollAnchorRef,
  };
}
