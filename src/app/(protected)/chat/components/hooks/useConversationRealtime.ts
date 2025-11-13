import { useEffect, useState } from "react";

import { pushNotificationService } from "@/lib/push-notifications";
import { socketManager } from "@/lib/socket";
import {
  Message,
  MessageReaction,
  OnlineStatus,
  TypingIndicator,
} from "@/types/message";

interface UseConversationRealtimeParams {
  sessionEmail?: string | null;
  chatId: string;
  chatPartner: string;
  currentUserId: string;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const hasMessagePayload = (value: unknown): value is { message: Message } =>
  isRecord(value) && "message" in value;

const isTypingIndicatorPayload = (
  value: unknown,
): value is TypingIndicator => {
  if (!isRecord(value)) {
    return false;
  }
  const candidate = value as Partial<TypingIndicator>;
  return (
    typeof candidate.chatId === "string" &&
    typeof candidate.userId === "string" &&
    typeof candidate.userName === "string" &&
    typeof candidate.isTyping === "boolean"
  );
};

const isOnlineStatusPayload = (
  value: unknown,
): value is OnlineStatus => {
  if (!isRecord(value)) {
    return false;
  }
  const candidate = value as Partial<OnlineStatus>;
  return typeof candidate.userId === "string";
};

const isMessageReactionPayload = (
  value: unknown,
): value is { messageId: string; reaction: MessageReaction } => {
  if (!isRecord(value)) {
    return false;
  }
  const candidate = value as {
    messageId?: unknown;
    reaction?: unknown;
  };
  return (
    typeof candidate.messageId === "string" &&
    typeof candidate.reaction === "object" &&
    candidate.reaction !== null
  );
};

const isMessageEditPayload = (
  value: unknown,
): value is { messageId: string; text: string } => {
  if (!isRecord(value)) {
    return false;
  }
  const candidate = value as { messageId?: unknown; text?: unknown };
  return (
    typeof candidate.messageId === "string" && typeof candidate.text === "string"
  );
};

const isMessageDeletePayload = (
  value: unknown,
): value is { messageId: string } => {
  if (!isRecord(value)) {
    return false;
  }
  const candidate = value as { messageId?: unknown };
  return typeof candidate.messageId === "string";
};

export function useConversationRealtime({
  sessionEmail,
  chatId,
  chatPartner,
  currentUserId,
  setMessages,
}: UseConversationRealtimeParams) {
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);

  useEffect(() => {
    if (!sessionEmail) {
      return;
    }

    socketManager.connect(sessionEmail);

    const handleNewMessage = (payload: unknown) => {
      if (!hasMessagePayload(payload)) {
        return;
      }
      const { message } = payload;

      setMessages((previous) => [...previous, message]);

      try {
        if (message.senderId && message.senderId !== currentUserId) {
          if (typeof document !== "undefined" && !document.hasFocus()) {
            const senderName = message.senderId || chatPartner;
            const text = message.text || "";
            pushNotificationService.showMessageNotification(
              senderName,
              text,
              chatId,
              chatPartner,
              message.id,
            );
          }
        }
      } catch (_error) {
        // best-effort
      }
    };

    const handleTypingStart = (payload: unknown) => {
      if (!isTypingIndicatorPayload(payload) || payload.chatId !== chatId) {
        return;
      }
      const data = payload;

      setTypingUsers((previous) => {
        const existing = previous.find((item) => item.userId === data.userId);
        if (existing) {
          return previous.map((item) =>
            item.userId === data.userId
              ? { ...item, isTyping: true, userName: data.userName }
              : item,
          );
        }
        return [...previous, { ...data }];
      });

      try {
        if (
          typeof document !== "undefined" &&
          !document.hasFocus() &&
          data.userId !== currentUserId
        ) {
          pushNotificationService.showTypingNotification(
            data.userName || "Someone",
            chatId,
          );
        }
      } catch (_error) {
        // best-effort
      }
    };

    const handleTypingStop = (payload: unknown) => {
      if (!isTypingIndicatorPayload(payload) || payload.chatId !== chatId) {
        return;
      }
      const data = payload;
      setTypingUsers((previous) =>
        previous.filter((item) => item.userId !== data.userId),
      );
    };

    const handleUserOnline = (payload: unknown) => {
      if (!isOnlineStatusPayload(payload)) {
        return;
      }
      if (payload.userId === chatPartner) {
        // Reserved for future presence indicators
      }
    };

    const handleMessageReaction = (payload: unknown) => {
      if (!isMessageReactionPayload(payload)) {
        return;
      }
      setMessages((previous) =>
        previous.map((message) =>
          message.id === payload.messageId
            ? {
                ...message,
                reactions: [...(message.reactions || []), payload.reaction],
              }
            : message,
        ),
      );
    };

    const handleMessageEdited = (payload: unknown) => {
      if (!isMessageEditPayload(payload)) {
        return;
      }
      setMessages((previous) =>
        previous.map((message) =>
          message.id === payload.messageId
            ? {
                ...message,
                text: payload.text,
                isEdited: true,
                editedAt: new Date().toISOString(),
              }
            : message,
        ),
      );
    };

    const handleMessageDeleted = (payload: unknown) => {
      if (!isMessageDeletePayload(payload)) {
        return;
      }
      setMessages((previous) =>
        previous.filter((message) => message.id !== payload.messageId),
      );
    };

    socketManager.on("new_message", handleNewMessage);
    socketManager.on("typing_start", handleTypingStart);
    socketManager.on("typing_stop", handleTypingStop);
    socketManager.on("user_online", handleUserOnline);
    socketManager.on("message_reaction", handleMessageReaction);
    socketManager.on("message_edited", handleMessageEdited);
    socketManager.on("message_deleted", handleMessageDeleted);

    return () => {
      socketManager.off("new_message", handleNewMessage);
      socketManager.off("typing_start", handleTypingStart);
      socketManager.off("typing_stop", handleTypingStop);
      socketManager.off("user_online", handleUserOnline);
      socketManager.off("message_reaction", handleMessageReaction);
      socketManager.off("message_edited", handleMessageEdited);
      socketManager.off("message_deleted", handleMessageDeleted);
    };
  }, [chatId, chatPartner, currentUserId, sessionEmail, setMessages]);

  return { typingUsers };
}
