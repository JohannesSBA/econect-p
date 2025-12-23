"use client";

import React, { useState } from "react";
import NextImage from "next/image";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Download,
  Edit,
  MoreHorizontal,
  Trash2,
  Image as ImageIcon,
  File as FileIcon,
  Video,
  Music,
  FileText,
  Reply,
} from "lucide-react";
import type { Message, TypingIndicator } from "@/types/message";
import { getAvatarUrl } from "@/lib/image-utils";

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  userReadStatus: Record<string, boolean>;
  typingUsers: TypingIndicator[];
  loadingMore: boolean;
  dayFormatter: Intl.DateTimeFormat;
  timeFormatter: Intl.DateTimeFormat;
  onAddReaction: (messageId: string, emoji: string) => void;
  onEditMessage: (messageId: string, newText: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onReplyToMessage: (message: Message) => void;
  listRef: React.RefObject<HTMLDivElement | null>;
  scrollAnchorRef: React.RefObject<HTMLDivElement | null>;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const getFileIcon = (type: string) => {
  if (type.startsWith("image/")) return <ImageIcon className="h-4 w-4" />;
  if (type.startsWith("video/")) return <Video className="h-4 w-4" />;
  if (type.startsWith("audio/")) return <Music className="h-4 w-4" />;
  if (type.startsWith("text/") || type.includes("document"))
    return <FileText className="h-4 w-4" />;
  return <FileIcon className="h-4 w-4" />;
};

export function MessageList({
  messages,
  currentUserId,
  userReadStatus,
  typingUsers,
  loadingMore,
  dayFormatter,
  timeFormatter,
  onAddReaction,
  onEditMessage,
  onDeleteMessage,
  onReplyToMessage,
  listRef,
  scrollAnchorRef,
}: MessageListProps) {
  const [activeMessageMenu, setActiveMessageMenu] = useState<string | null>(
    null,
  );
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    alt: string;
  } | null>(null);
  const groupedMessages = messages;

  return (
    <>
      <div
        ref={listRef}
        className="flex-1 space-y-6 overflow-y-auto px-4 py-6 sm:px-8"
      >
        {loadingMore && (
          <div className="flex justify-center">
            <span className="rounded-full bg-white px-3 py-1 text-xs text-slate-400 shadow">
              Loading earlier messages…
            </span>
          </div>
        )}

        {groupedMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-3xl">
              💬
            </div>
            <p className="text-base font-semibold text-slate-700">
              Start something great
            </p>
            <p className="max-w-sm text-sm leading-relaxed text-slate-500">
              Share updates, ask questions, or send a warm hello to keep the
              conversation moving.
            </p>
          </div>
        ) : (
          groupedMessages.map((message, index) => {
            const enriched = message as Message & {
              sender?: { name?: string | null; image?: string | null };
            };
            const chatPartnerAvatar = getAvatarUrl(
              message.senderId === currentUserId
                ? message.senderId
                : enriched.sender?.image,
            );

            const isMine = message.senderId === currentUserId;
            const previous = groupedMessages[index - 1];
            const currentDate = dayFormatter.format(
              new Date(message.createdAt),
            );
            const previousDate = previous
              ? dayFormatter.format(new Date(previous.createdAt))
              : null;
            const showDayChip = !previous || currentDate !== previousDate;
            const readReceipt = userReadStatus[message.id] || false;
            const senderName = isMine
              ? "You"
              : (enriched.sender?.name ?? "Colleague");
            const senderInitial = senderName.charAt(0).toUpperCase();
            const bubbleColour = isMine
              ? "bg-blue-600 text-white"
              : "bg-white text-slate-900 border border-white/60";

            return (
              <div
                key={message.id}
                id={`message-${message.id}`}
                className="flex w-full flex-col gap-3"
              >
                {showDayChip && (
                  <div className="flex justify-center">
                    <span className="rounded-full border border-slate-200 bg-white px-4 py-1 text-xs font-medium text-slate-500 shadow-sm">
                      {currentDate}
                    </span>
                  </div>
                )}

                {message.replyTo && (
                  <div className="text-xs text-slate-500 sm:ml-16">
                    Replying to:{" "}
                    {groupedMessages.find((m) => m.id === message.replyTo)
                      ?.text ?? "Message unavailable"}
                  </div>
                )}

                <div
                  className={`group flex w-full items-start gap-3 ${isMine ? "justify-end" : "justify-start"}`}
                >
                  {!isMine && (
                    <Avatar className="hidden h-9 w-9 bg-blue-100 text-blue-600 sm:flex">
                      <AvatarImage src={chatPartnerAvatar} alt={senderName} />
                      <AvatarFallback>{senderInitial}</AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={`flex w-full max-w-[88%] flex-col gap-2 sm:max-w-xl lg:max-w-2xl xl:max-w-3xl ${
                      isMine ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`w-1/2 rounded-2xl px-4 py-2 shadow-sm backdrop-blur transition ${bubbleColour}`}
                    >
                      {message.text && (
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {message.text}
                        </p>
                      )}

                      {message.attachments &&
                        message.attachments.length > 0 && (
                          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3 w-max">
                            {message.attachments.map((attachment) => {
                              const isImage =
                                attachment.mimeType?.startsWith("image/");
                              return (
                                <div
                                  key={attachment.id}
                                  className={`overflow-hidden rounded-xl w-full ${isImage ? "border border-white/40" : "border border-white/60 bg-white/10"}`}
                                >
                                  {isImage ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setPreviewImage({
                                          url: attachment.url,
                                          alt: attachment.filename,
                                        })
                                      }
                                      className="block"
                                    >
                                      <NextImage
                                        src={attachment.url}
                                        alt={attachment.filename}
                                        width={512}
                                        height={512}
                                        className="max-h-64 w-full object-cover transition hover:scale-[1.01]"
                                        unoptimized
                                      />
                                    </button>
                                  ) : (
                                    <div className="flex items-center gap-3 px-3 py-2 text-sm w-full">
                                      {getFileIcon(attachment.mimeType)}
                                      <div className="flex-1 truncate">
                                        <p className="font-medium">
                                          {attachment.filename}
                                        </p>
                                        <p className="text-xs opacity-70">
                                          {formatFileSize(attachment.size)}
                                        </p>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 rounded-full bg-white/20 p-0 text-white hover:bg-white/30"
                                        onClick={() =>
                                          window.open(attachment.url, "_blank")
                                        }
                                      >
                                        <Download className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                      {message.reactions && message.reactions.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {Object.entries(
                            message.reactions.reduce(
                              (acc, reaction) => {
                                acc[reaction.emoji] =
                                  (acc[reaction.emoji] || 0) + 1;
                                return acc;
                              },
                              {} as Record<string, number>,
                            ),
                          ).map(([emoji, count]) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => onAddReaction(message.id, emoji)}
                              className={`rounded-full px-2 py-1 text-xs shadow-inner transition ${
                                isMine
                                  ? "bg-white/20 text-white hover:bg-white/30"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              {emoji} {count}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div
                      className={`flex items-center gap-2 text-xs text-slate-400 ${isMine ? "flex-row-reverse" : ""}`}
                    >
                      <span>
                        {timeFormatter.format(new Date(message.createdAt))}
                      </span>
                      {isMine && <span>{readReceipt ? "✓✓" : "✓"}</span>}
                      <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 rounded-full p-0 text-slate-400 hover:text-slate-600"
                          onClick={() => onAddReaction(message.id, "👍")}
                          type="button"
                        >
                          👍
                        </Button>
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            className="h-7 w-7 rounded-full p-0 text-slate-400 hover:text-slate-600"
                            onClick={() =>
                              setActiveMessageMenu(
                                activeMessageMenu === message.id
                                  ? null
                                  : message.id,
                              )
                            }
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                          {activeMessageMenu === message.id && (
                            <div className="absolute right-0 top-full z-10 mt-2 min-w-[10rem] rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
                                onClick={() => {
                                  onReplyToMessage(message);
                                  setActiveMessageMenu(null);
                                }}
                              >
                                <Reply className="h-4 w-4" /> Reply
                              </button>
                              {isMine && (
                                <button
                                  type="button"
                                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
                                  onClick={() => {
                                    const newText = prompt(
                                      "Edit message",
                                      message.text,
                                    );
                                    if (newText && newText !== message.text) {
                                      onEditMessage(message.id, newText);
                                    }
                                    setActiveMessageMenu(null);
                                  }}
                                >
                                  <Edit className="h-4 w-4" /> Edit
                                </button>
                              )}
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-rose-500 transition hover:bg-rose-50"
                                onClick={() => {
                                  if (confirm("Delete this message?")) {
                                    onDeleteMessage(message.id);
                                  }
                                  setActiveMessageMenu(null);
                                }}
                              >
                                <Trash2 className="h-4 w-4" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="rounded-full border  border-slate-200 bg-white px-4 py-2 text-xs text-slate-500 shadow-sm">
              {typingUsers.map((u) => u.userName).join(", ")}{" "}
              {typingUsers.length === 1 ? "is" : "are"} typing…
            </div>
          </div>
        )}

        <div ref={scrollAnchorRef} />
      </div>
      <Dialog
        open={Boolean(previewImage)}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewImage(null);
          }
        }}
      >
        <DialogContent
          showCloseButton
          className="max-w-4xl border-none bg-black/80 p-4 text-white shadow-2xl"
        >
          {previewImage && (
            <div className="flex flex-col items-center gap-3">
              <NextImage
                src={previewImage.url}
                alt={previewImage.alt}
                width={1200}
                height={800}
                unoptimized
                className="max-h-[80vh] w-full rounded-lg object-contain"
              />
              <p className="text-sm text-white/80">{previewImage.alt}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
