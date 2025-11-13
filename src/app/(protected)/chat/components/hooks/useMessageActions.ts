import { useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";

import { socketManager } from "@/lib/socket";

interface UseMessageActionsParams {
  chatId: string;
}

export function useMessageActions({ chatId }: UseMessageActionsParams) {
  const addReaction = useCallback(
    async (messageId: string, emoji: string) => {
      try {
        await axios.post("/api/message/reaction", {
          messageId,
          emoji,
          chatId,
        });

        socketManager.emit("message_reaction", {
          chatId,
          messageId,
          emoji,
        });
      } catch (_error) {
        toast.error("Failed to add reaction");
      }
    },
    [chatId],
  );

  const editMessage = useCallback(
    async (messageId: string, newText: string) => {
      try {
        await axios.put(`/api/message/${messageId}`, {
          text: newText,
        });

        socketManager.emit("message_edited", {
          chatId,
          messageId,
          text: newText,
        });
      } catch (_error) {
        toast.error("Failed to edit message");
      }
    },
    [chatId],
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      try {
        await axios.delete(`/api/message/${messageId}`);

        socketManager.emit("message_deleted", {
          chatId,
          messageId,
        });
      } catch (_error) {
        toast.error("Failed to delete message");
      }
    },
    [chatId],
  );

  return { addReaction, editMessage, deleteMessage };
}
