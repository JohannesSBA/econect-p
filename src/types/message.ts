export interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
  readBy: string[];
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
  replyTo?: string; // ID of the message being replied to
  editedAt?: string;
  isEdited?: boolean;
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'file';
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  thumbnail?: string; // For images/videos
  duration?: number; // For audio/video
}

export interface MessageReaction {
  id: string;
  emoji: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface TypingIndicator {
  userId: string;
  userName: string;
  isTyping: boolean;
  chatId: string;
}

export interface OnlineStatus {
  userId: string;
  isOnline: boolean;
  lastSeen?: string;
}

export interface MessageSearchResult {
  message: Message;
  chatId: string;
  chatPartnerName: string;
  highlightedText: string;
}

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
}

export interface ChatNotification {
  chatId: string;
  unreadCount: number;
  lastMessage?: Message;
  isTyping?: boolean;
}

export type MessageFilter = {
  text?: string;
  dateFrom?: string;
  dateTo?: string;
  hasAttachments?: boolean;
  hasReactions?: boolean;
  senderId?: string;
};

export type MessageSort = 'newest' | 'oldest' | 'relevance'; 