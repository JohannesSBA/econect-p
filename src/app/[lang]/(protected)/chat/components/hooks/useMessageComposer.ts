import { useCallback, useRef, useState } from "react";
import axios from "axios";
import { toast } from "sonner";

import { socketManager } from "@/lib/socket";
import { Message, MessageAttachment } from "@/types/message";

interface UseMessageComposerParams {
  chatId: string;
  chatPartner: string;
  currentUserId: string;
  sessionUser?: {
    email?: string | null;
    name?: string | null;
  } | null;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export function useMessageComposer({
  chatId,
  chatPartner,
  currentUserId,
  sessionUser,
  setMessages,
}: UseMessageComposerParams) {
  const [value, setValue] = useState<string>("");
  const [sending, setSending] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearTypingTimeout = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const handleTyping = useCallback(() => {
    clearTypingTimeout();

    socketManager.emit("typing_start", {
      chatId,
      chatPartner,
      userName: sessionUser?.name || "Unknown User",
    });

    typingTimeoutRef.current = setTimeout(() => {
      socketManager.emit("typing_stop", {
        chatId,
        chatPartner,
        userName: sessionUser?.name || "Unknown User",
      });
      typingTimeoutRef.current = null;
    }, 3000);
  }, [chatId, chatPartner, sessionUser?.name]);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      const validFiles = files.filter((file) => file.size <= 10 * 1024 * 1024);

      if (validFiles.length !== files.length) {
        toast.error("Some files were too large. Maximum size is 10MB.");
      }

      setAttachments((previous) => [...previous, ...validFiles]);
    },
  []);

  const removeAttachment = useCallback((index: number) => {
    setAttachments((previous) => previous.filter((_, idx) => idx !== index));
  }, []);

  const sendMessage = useCallback(async () => {
    if ((!value.trim() && attachments.length === 0) || sending) {
      return;
    }

    if (!sessionUser?.email) {
      toast.error("You need to be signed in to send messages.");
      return;
    }

    setSending(true);

    const messageText = value.trim();
    setValue("");

    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      senderId: currentUserId,
      text: messageText,
      createdAt: new Date().toISOString(),
      readBy: [],
      attachments: attachments.map((file, index) => ({
        id: `temp-attachment-${index}`,
        type: file.type.startsWith("image/")
          ? "image"
          : file.type.startsWith("video/")
            ? "video"
            : file.type.startsWith("audio/")
              ? "audio"
              : "document",
        url: URL.createObjectURL(file),
        filename: file.name,
        size: file.size,
        mimeType: file.type,
      })),
      replyTo: replyTo?.id,
    };

    setMessages((previous) => [...previous, optimisticMessage]);

    try {
      const uploadedAttachments: MessageAttachment[] = [];

      if (attachments.length > 0) {
        setUploading(true);
        for (const file of attachments) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("chatId", chatId);
          const uploadResponse = await axios.post(
            "/api/message/upload",
            formData,
          );
          uploadedAttachments.push(uploadResponse.data);
        }
        setUploading(false);
      }

      const response = await axios.post("/api/message", {
        text: messageText,
        chatId,
        chatPartner,
        attachments: uploadedAttachments,
        replyTo: replyTo?.id,
      });

      setMessages((previous) =>
        previous.map((message) =>
          message.id === optimisticMessage.id ? response.data : message,
        ),
      );

      setAttachments([]);
      setReplyTo(null);
      setShowEmojiPicker(false);

      socketManager.emit("new_message", {
        chatId,
        message: response.data,
      });

      toast.success("Message sent!");
    } catch (_error) {
      setMessages((previous) =>
        previous.filter((message) => message.id !== optimisticMessage.id),
      );
      setValue(messageText);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSending(false);
      setUploading(false);
    }
  }, [
    attachments,
    chatId,
    chatPartner,
    currentUserId,
    replyTo?.id,
    sending,
    sessionUser?.email,
    setMessages,
    value,
  ]);

  const toggleEmojiPicker = useCallback(() => {
    setShowEmojiPicker((previous) => !previous);
  }, []);

  const selectEmoji = useCallback((emoji: string) => {
    setValue((previous) => previous + emoji);
    setShowEmojiPicker(false);
  }, []);

  const clearReply = useCallback(() => {
    setReplyTo(null);
  }, []);

  return {
    value,
    setValue,
    sending,
    uploading,
    attachments,
    handleFileSelect,
    removeAttachment,
    fileInputRef,
    replyTo,
    setReplyTo,
    sendMessage,
    handleTyping,
    showEmojiPicker,
    toggleEmojiPicker,
    selectEmoji,
    clearReply,
  };
}
