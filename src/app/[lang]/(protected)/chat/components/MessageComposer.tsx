'use client';

import React, { FormEvent, KeyboardEvent } from 'react';
import { Smile, Paperclip, Send, Loader2, Reply, X, Image as ImageIcon, File as FileIcon, Video, Music, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Message } from '@/types/message';

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '👏', '🔥', '💯'];

interface MessageComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onTyping: () => void;
  sending: boolean;
  uploading: boolean;
  attachments: File[];
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAttachment: (index: number) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  replyTo?: Message | null;
  onClearReply: () => void;
  showEmojiPicker: boolean;
  onToggleEmojiPicker: () => void;
  onSelectEmoji: (emoji: string) => void;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
  if (type.startsWith('video/')) return <Video className="h-4 w-4" />;
  if (type.startsWith('audio/')) return <Music className="h-4 w-4" />;
  if (type.startsWith('text/') || type.includes('document')) return <FileText className="h-4 w-4" />;
  return <FileIcon className="h-4 w-4" />;
};

export function MessageComposer({
  value,
  onChange,
  onSend,
  onTyping,
  sending,
  uploading,
  attachments,
  onFileSelect,
  onRemoveAttachment,
  fileInputRef,
  replyTo,
  onClearReply,
  showEmojiPicker,
  onToggleEmojiPicker,
  onSelectEmoji,
}: MessageComposerProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSend();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSend();
      return;
    }
    onTyping();
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white/85 px-4 py-3 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full text-slate-500 hover:bg-slate-100"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={onFileSelect}
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
          />
        </div>

        <div className="flex-1 space-y-2">
          <Textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write your message..."
            className="resize-none border-slate-200 bg-white/70 text-sm focus-visible:ring-blue-500"
            disabled={sending || uploading}
          />
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Press Enter to send · Shift + Enter for a new line</span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-slate-500 hover:text-slate-700"
                onClick={onToggleEmojiPicker}
              >
                <Smile className="h-4 w-4" />
              </Button>
              <Button
                type="submit"
                disabled={(!value.trim() && attachments.length === 0) || sending || uploading}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {sending || uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="hidden sm:inline">Send</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {replyTo && (
        <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50/80 px-4 py-2 text-sm text-blue-700">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Reply className="h-4 w-4" />
              <span className="line-clamp-1">
                Replying to: {replyTo.text.substring(0, 120)}{replyTo.text.length > 120 ? '…' : ''}
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 rounded-full p-0 text-blue-600 hover:bg-blue-100"
              onClick={onClearReply}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {attachments.length > 0 && (
        <div className="mt-3 border-t border-slate-200 bg-white/80 px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div key={`${file.name}-${index}`} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm">
                {getFileIcon(file.type)}
                <span className="max-w-[10rem] truncate">{file.name}</span>
                <span className="text-xs text-slate-400">{formatFileSize(file.size)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 rounded-full p-0 text-slate-400 hover:text-slate-600"
                  onClick={() => onRemoveAttachment(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showEmojiPicker && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          <div className="grid grid-cols-8 gap-2 sm:grid-cols-10">
            {EMOJI_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="grid h-9 w-9 place-items-center rounded-lg text-lg transition hover:bg-slate-100"
                onClick={() => onSelectEmoji(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}
