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

    const handleNewMessage = (data: { message: Message }) => {
      if (!data?.message) {
        return;
      }

      setMessages((previous) => [...previous, data.message]);

      try {
        if (data.message.senderId && data.message.senderId !== currentUserId) {
          if (typeof document !== "undefined" && !document.hasFocus()) {
            const senderName = data.message.senderId || chatPartner;
            const text = data.message.text || "";
            pushNotificationService.showMessageNotification(
              senderName,
              text,
              chatId,
              chatPartner,
              data.message.id,
            );
          }
        }
      } catch (_error) {
        // best-effort
      }
    };

    const handleTypingStart = (data: TypingIndicator) => {
      if (data.chatId !== chatId) return;

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

    const handleTypingStop = (data: TypingIndicator) => {
      if (data.chatId !== chatId) return;
      setTypingUsers((previous) =>
        previous.filter((item) => item.userId !== data.userId),
      );
    };

    const handleUserOnline = (data: OnlineStatus) => {
      if (data.userId === chatPartner) {
        // Reserved for future presence indicators
      }
    };

    const handleMessageReaction = (data: {
      messageId: string;
      reaction: MessageReaction;
    }) => {
      if (!data.messageId) return;
      setMessages((previous) =>
        previous.map((message) =>
          message.id === data.messageId
            ? {
                ...message,
                reactions: [...(message.reactions || []), data.reaction],
              }
            : message,
        ),
      );
    };

    const handleMessageEdited = (data: { messageId: string; text: string }) => {
      if (!data.messageId) return;
      setMessages((previous) =>
        previous.map((message) =>
          message.id === data.messageId
            ? {
                ...message,
                text: data.text,
                isEdited: true,
                editedAt: new Date().toISOString(),
              }
            : message,
        ),
      );
    };

    const handleMessageDeleted = (data: { messageId: string }) => {
      if (!data.messageId) return;
      setMessages((previous) =>
        previous.filter((message) => message.id !== data.messageId),
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
