"use client";

import { RefObject, useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

import { pushNotificationService } from "@/lib/push-notifications";

import { MessageSearchBar } from "./MessageSearchBar";
import { MessageList } from "./MessageList";
import { MessageComposer } from "./MessageComposer";
import { useConversationMessages } from "./hooks/useConversationMessages";
import { useConversationRealtime } from "./hooks/useConversationRealtime";
import { useMessageComposer } from "./hooks/useMessageComposer";
import { useMessageSearch } from "./hooks/useMessageSearch";
import { useMessageActions } from "./hooks/useMessageActions";
import { useCurrentUserId } from "./hooks/useCurrentUserId";

interface ConversationProps {
  chatPartner: string;
  chatId: string;
}

export default function Conversations({
  chatPartner,
  chatId,
}: ConversationProps) {
  const { data: session } = useSession();

  const currentUserId = useCurrentUserId(session?.user?.email ?? null);

  const {
    messages,
    setMessages,
    userReadStatus,
    loading,
    loadingMore,
    listRef,
    scrollAnchorRef,
  } = useConversationMessages({ chatId, chatPartner });

  const { typingUsers } = useConversationRealtime({
    sessionEmail: session?.user?.email,
    chatId,
    chatPartner,
    currentUserId,
    setMessages,
  });

  const {
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
  } = useMessageComposer({
    chatId,
    chatPartner,
    currentUserId,
    sessionUser: session?.user ?? null,
    setMessages,
  });

  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    clearSearch,
    handleSearchSelect,
  } = useMessageSearch(chatId);

  const { addReaction, editMessage, deleteMessage } = useMessageActions({
    chatId,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      pushNotificationService.requestPermission().catch(() => {
        // ignore
      });
    }
  }, []);

  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "numeric",
      }),
    [],
  );

  const dayFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    [],
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl bg-white/70">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-[460px] flex-col overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_top,_#f5f9ff,_#eef2ff_55%,_#f8f9fb)] shadow-inner">
      <MessageSearchBar
        query={searchQuery}
        results={searchResults}
        onQueryChange={setSearchQuery}
        onClear={clearSearch}
        onSelectResult={handleSearchSelect}
        timeFormatter={timeFormatter}
      />

      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        userReadStatus={userReadStatus}
        typingUsers={typingUsers}
        loadingMore={loadingMore}
        dayFormatter={dayFormatter}
        timeFormatter={timeFormatter}
        onAddReaction={addReaction}
        onEditMessage={editMessage}
        onDeleteMessage={deleteMessage}
        onReplyToMessage={(message) => setReplyTo(message)}
        listRef={listRef}
        scrollAnchorRef={scrollAnchorRef}
      />

      <MessageComposer
        value={value}
        onChange={setValue}
        onSend={sendMessage}
        onTyping={handleTyping}
        sending={sending}
        uploading={uploading}
        attachments={attachments}
        onFileSelect={handleFileSelect}
        onRemoveAttachment={removeAttachment}
        fileInputRef={fileInputRef as RefObject<HTMLInputElement>}
        replyTo={replyTo}
        onClearReply={clearReply}
        showEmojiPicker={showEmojiPicker}
        onToggleEmojiPicker={toggleEmojiPicker}
        onSelectEmoji={selectEmoji}
      />
    </div>
  );
}
