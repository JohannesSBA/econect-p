"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { 
  Loader2, Send, Paperclip, Smile, Search, X, 
  Image, File, Video, Music, FileText, Reply,
  MoreHorizontal, Edit, Trash2, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";
import { socketManager } from "@/lib/socket";
import { pushNotificationService } from "@/lib/push-notifications";
import { 
  Message, MessageAttachment, MessageReaction, 
  TypingIndicator, OnlineStatus, MessageSearchResult 
} from "@/types/message";

interface ConversationProps {
  chatPartner: string;
  chatId: string;
}

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '👏', '🔥', '💯'];

export default function Conversations({
  chatPartner,
  chatId,
}: ConversationProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [userReadStatus, setUserReadStatus] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [newMessage, setNewMessage] = useState<string>("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<MessageSearchResult[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  
  const scrollDownRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPrependingRef = useRef<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  // Get current user ID
  useEffect(() => {
    const getCurrentUserId = async () => {
      if (session?.user?.email) {
        try {
          const response = await axios.get('/api/user/current');
          setCurrentUserId(response.data.id);
        } catch (error) {
          console.error('Error getting current user ID:', error);
        }
      }
    };
    getCurrentUserId();
  }, [session?.user?.email]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (session?.user?.email) {
      socketManager.connect(session.user.email);
      
      // Listen for real-time events
      socketManager.on('new_message', handleNewMessage);
      socketManager.on('typing_start', handleTypingStart);
      socketManager.on('typing_stop', handleTypingStop);
      socketManager.on('user_online', handleUserOnline);
      socketManager.on('message_reaction', handleMessageReaction);
      socketManager.on('message_edited', handleMessageEdited);
      socketManager.on('message_deleted', handleMessageDeleted);

      return () => {
        socketManager.off('new_message', handleNewMessage);
        socketManager.off('typing_start', handleTypingStart);
        socketManager.off('typing_stop', handleTypingStop);
        socketManager.off('user_online', handleUserOnline);
        socketManager.off('message_reaction', handleMessageReaction);
        socketManager.off('message_edited', handleMessageEdited);
        socketManager.off('message_deleted', handleMessageDeleted);
      };
    }
  }, [session?.user?.email]);

  // Request notification permission once
  useEffect(() => {
    // Only in browser
    if (typeof window !== 'undefined') {
      pushNotificationService.requestPermission().catch(() => {});
    }
  }, []);

  // Load messages
  useEffect(() => {
    loadMessages();
    // Mark all messages from this chat partner as read for current user
    const markRead = async () => {
      try {
        await axios.post('/api/message/mark-read', { chatPartner });
        // Notify others to update unread counters
        socketManager.emit('messages_read', { chatPartner, chatId });
      } catch (err) {
        // ignore
      }
    }
    markRead();
  }, [chatId, chatPartner]);

  // Auto-scroll to bottom (skip when prepending older messages)
  useEffect(() => {
    if (isPrependingRef.current) return;
    if (scrollDownRef.current) {
      scrollDownRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const loadMessages = async () => {
    try {
      const res = await axios.post("/api/message/get", {
        chatPartner,
        chatId,
        limit: 15,
      });
      const payload = res.data?.messages ? res.data : { messages: res.data, hasMore: false } as any;
      const sortedMessages = (payload.messages as Message[]).sort(
        (a: Message, b: Message) =>
          new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime()
      );
      setMessages(sortedMessages);
      setHasMore(Boolean(payload.hasMore));

      const initialReadStatus: Record<string, boolean> = {};
      sortedMessages.forEach((message: Message) => {
        initialReadStatus[message.id] = message.readBy.length > 0;
      });
      setUserReadStatus(initialReadStatus);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Sorry, this chat isn't available.");
    } finally {
      setLoading(false);
    }
  };

  // Load older messages when user scrolls to top
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);
    isPrependingRef.current = true;
    const topBefore = messages[0];
    const topId = topBefore?.id;
    const container = listRef.current;
    const prevScrollHeight = container?.scrollHeight || 0;
    const prevScrollTop = container?.scrollTop || 0;
    try {
      const res = await axios.post('/api/message/get', {
        chatPartner,
        chatId,
        limit: 15,
        before: topBefore?.createdAt
      });
      const payload = res.data?.messages ? res.data : { messages: res.data, hasMore: false } as any;
      const older = (payload.messages || []) as Message[];
      if (older.length > 0) {
        setMessages(prev => [...older, ...prev]);
        setHasMore(Boolean(payload.hasMore));
        // restore scroll position by maintaining top anchor
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
    } catch {}
    finally {
      setLoadingMore(false);
      // Re-enable auto scroll for new messages
      setTimeout(() => { isPrependingRef.current = false }, 0);
    }
  }, [loadingMore, hasMore, messages, chatPartner, chatId]);

  // Attach scroll handler to detect top and load more
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => {
      if (el.scrollTop < 60) loadMore();
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [loadMore]);

  // Real-time event handlers
  const handleNewMessage = useCallback((data: { message: Message }) => {
    setMessages(prev => [...prev, data.message]);
    // Show push notification if message is from partner and window not focused
    try {
      if (data.message && data.message.senderId && data.message.senderId !== currentUserId) {
        if (typeof document !== 'undefined' && !document.hasFocus()) {
          const senderName = (data as any).message.sender?.name || chatPartner;
          const text = (data as any).message.text || '';
          pushNotificationService.showMessageNotification(senderName, text, chatId, chatPartner, (data as any).message.id);
        }
      }
    } catch {
      // best-effort
    }
  }, [chatId, chatPartner, currentUserId]);

  const handleTypingStart = useCallback((data: TypingIndicator) => {
    if (data.chatId === chatId) {
      setTypingUsers(prev => {
        const existing = prev.find(t => t.userId === data.userId);
        if (existing) {
          return prev.map(t => t.userId === data.userId ? { ...t, isTyping: true, userName: data.userName } : t);
        }
        return [...prev, { ...data, userName: data.userName }];
      });
      // Optional: show typing notification if unfocused
      try {
        if (typeof document !== 'undefined' && !document.hasFocus() && data.userId !== currentUserId) {
          pushNotificationService.showTypingNotification(data.userName || 'Someone', chatId);
        }
      } catch {}
    }
  }, [chatId, currentUserId]);

  const handleTypingStop = useCallback((data: TypingIndicator) => {
    if (data.chatId === chatId) {
      setTypingUsers(prev => prev.filter(t => t.userId !== data.userId));
    }
  }, [chatId]);

  const handleUserOnline = useCallback((data: OnlineStatus) => {
    if (data.userId === chatPartner) {
      // setOnlineStatus(data); // This state was removed
    }
  }, [chatPartner]);

  const handleMessageReaction = useCallback((data: { messageId: string; reaction: MessageReaction }) => {
    setMessages(prev => prev.map(msg => 
      msg.id === data.messageId 
        ? { ...msg, reactions: [...(msg.reactions || []), data.reaction] }
        : msg
    ));
  }, []);

  const handleMessageEdited = useCallback((data: { messageId: string; text: string }) => {
    setMessages(prev => prev.map(msg => 
      msg.id === data.messageId 
        ? { ...msg, text: data.text, isEdited: true, editedAt: new Date().toISOString() }
        : msg
    ));
  }, []);

  const handleMessageDeleted = useCallback((data: { messageId: string }) => {
    setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
  }, []);

  // Typing indicator
  const handleTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    socketManager.emit('typing_start', { 
      chatId, 
      chatPartner,
      userName: session?.user?.name || 'Unknown User'
    });
    
    typingTimeoutRef.current = setTimeout(() => {
      socketManager.emit('typing_stop', { 
        chatId, 
        chatPartner,
        userName: session?.user?.name || 'Unknown User'
      });
    }, 3000);
  }, [chatId, chatPartner, session?.user?.name]);

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;
    if (sending || !session?.user?.email) return;

    setSending(true);
    const messageText = newMessage.trim();
    setNewMessage("");

    // Create optimistic message for immediate UI update
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      senderId: currentUserId, // This will be the current user's ID
      text: messageText,
      createdAt: new Date().toISOString(),
      readBy: [],
      attachments: attachments.map((file, index) => ({
        id: `temp-attachment-${index}`,
        type: file.type.startsWith('image/') ? 'image' : 
              file.type.startsWith('video/') ? 'video' : 
              file.type.startsWith('audio/') ? 'audio' : 'document',
        url: URL.createObjectURL(file),
        filename: file.name,
        size: file.size,
        mimeType: file.type,
      })),
      replyTo: replyTo?.id,
    };

    // Add optimistic message to UI immediately
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      // Upload attachments first
      const uploadedAttachments: MessageAttachment[] = [];
      if (attachments.length > 0) {
        setUploading(true);
        for (const file of attachments) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('chatId', chatId);
          
          const uploadRes = await axios.post('/api/message/upload', formData);
          uploadedAttachments.push(uploadRes.data);
        }
        setUploading(false);
      }

      // Send message with attachments
      const response = await axios.post("/api/message", {
        text: messageText,
        chatId: chatId,
        chatPartner: chatPartner,
        attachments: uploadedAttachments,
        replyTo: replyTo?.id,
      });

      // Replace optimistic message with real message
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticMessage.id ? response.data : msg
      ));

      // Clear attachments and reply
      setAttachments([]);
      setReplyTo(null);

      // Emit real-time event
      socketManager.emit('new_message', {
        chatId,
        message: response.data
      });

      toast.success("Message sent!");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  // File handling
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => file.size <= 10 * 1024 * 1024); // 10MB limit
    
    if (validFiles.length !== files.length) {
      toast.error("Some files were too large. Maximum size is 10MB.");
    }
    
    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Search functionality
  const searchMessages = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    // setIsSearching(true); // This state was removed
    try {
      const response = await axios.get(`/api/message/search?q=${encodeURIComponent(searchQuery)}&chatId=${chatId}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error("Error searching messages:", error);
      toast.error("Failed to search messages");
    } finally {
      // setIsSearching(false); // This state was removed
    }
  };

  // Reaction handling
  const addReaction = async (messageId: string, emoji: string) => {
    try {
      await axios.post('/api/message/reaction', {
        messageId,
        emoji,
        chatId
      });
      
      socketManager.emit('message_reaction', {
        chatId,
        messageId,
        emoji
      });
    } catch (error) {
      console.error("Error adding reaction:", error);
      toast.error("Failed to add reaction");
    }
  };

  // Message actions
  const editMessage = async (messageId: string, newText: string) => {
    try {
      await axios.put(`/api/message/${messageId}`, {
        text: newText
      });
      
      socketManager.emit('message_edited', {
        chatId,
        messageId,
        text: newText
      });
    } catch (error) {
      console.error("Error editing message:", error);
      toast.error("Failed to edit message");
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await axios.delete(`/api/message/${messageId}`);
      
      socketManager.emit('message_deleted', {
        chatId,
        messageId
      });
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else {
      handleTyping();
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (type.startsWith('audio/')) return <Music className="h-4 w-4" />;
    if (type.startsWith('text/') || type.includes('document')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">

      {/* Messages Area */}
      <div ref={listRef} className=" overflow-y-scroll p-4 pb-20 space-y-4">
        {loadingMore && (
          <div className="text-center text-xs text-gray-400">Loading more…</div>
        )}
        {messages.length === 0 ? (
          <div className="flex justify-center items-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-lg font-medium">No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            const isCurrentUser = chatPartner !== message.senderId;
            const messageDate = new Date(message.createdAt);
            const month = messageDate.getUTCMonth() + 1;
            const day = messageDate.getUTCDate();
            const year = messageDate.getUTCFullYear();
            const isMessageRead = userReadStatus[message.id] || false;
            const isNewDay = index === 0 || 
              new Date(messages[index - 1].createdAt).getUTCDate() !== day;

            return (
              <div key={message.id} id={`message-${message.id}`} className="w-full">
                {isNewDay && (
                  <div className="flex justify-center my-4">
                    <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                      {`${day}/${month}/${year}`}
                    </span>
                  </div>
                )}

                {/* Reply to message */}
                {message.replyTo && (
                  <div className="ml-4 mb-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                    Replying to: {messages.find(m => m.id === message.replyTo)?.text || 'Message not found'}
                  </div>
                )}

                <div className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} max-w-full`}>
                  <div className={`max-w-xs lg:max-w-md ${isCurrentUser ? "order-2" : "order-1"}`}>
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        isCurrentUser
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p className="text-sm break-words">{message.text}</p>
                      {message.isEdited && (
                        <p className="text-xs opacity-70 mt-1">(edited)</p>
                      )}
                      
                      {/* Attachments */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {message.attachments.map((attachment) => (
                            <div key={attachment.id} className="bg-white bg-opacity-20 rounded p-2">
                              <div className="flex items-center space-x-2">
                                {getFileIcon(attachment.mimeType)}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs truncate">{attachment.filename}</p>
                                  <p className="text-xs opacity-70">{formatFileSize(attachment.size)}</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(attachment.url, '_blank')}
                                  className="h-6 w-6 p-0"
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Reactions */}
                      {message.reactions && message.reactions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {Object.entries(
                            message.reactions.reduce((acc, reaction) => {
                              acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>)
                          ).map(([emoji, count]) => (
                            <button
                              key={emoji}
                              className="bg-white bg-opacity-20 rounded-full px-2 py-1 text-xs hover:bg-opacity-30"
                              onClick={() => addReaction(message.id, emoji)}
                            >
                              {emoji} {count}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-1">
                      <div
                        className={`text-xs ${
                          isCurrentUser ? "text-right" : "text-left"
                        } text-gray-500`}
                      >
                        {new Date(message.createdAt).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "numeric",
                        })}
                        {isCurrentUser && (
                          <span className="ml-1">
                            {isMessageRead ? "✓✓" : "✓"}
                          </span>
                        )}
                      </div>
                      
                      {/* Message actions */}
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addReaction(message.id, '👍')}
                          className="h-6 w-6 p-0"
                        >
                          👍
                        </Button>
                        {isCurrentUser && (
                          <div className="relative">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowReactions(showReactions === message.id ? null : message.id)}
                              className="h-6 w-6 p-0"
                            >
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                            {showReactions === message.id && (
                              <div className="absolute bottom-full right-0 mb-1 bg-white border rounded-lg shadow-lg p-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const newText = prompt("Edit message:", message.text);
                                    if (newText && newText !== message.text) {
                                      editMessage(message.id, newText);
                                    }
                                    setShowReactions(null);
                                  }}
                                  className="h-6 w-6 p-0"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm("Delete this message?")) {
                                      deleteMessage(message.id);
                                    }
                                    setShowReactions(null);
                                  }}
                                  className="h-6 w-6 p-0 text-red-500"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {/* Typing indicators */}
        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <p className="text-sm text-gray-600">
                {typingUsers.map(u => u.userName).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </p>
            </div>
          </div>
        )}
        
        <div ref={scrollDownRef} />
      </div>

      {/* Reply preview */}
      {replyTo && (
        <div className="p-2 bg-blue-50 border-t border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Reply className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-600">Replying to: {replyTo.text.substring(0, 50)}...</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyTo(null)}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="p-2 bg-gray-50 border-t">
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div key={index} className="flex items-center space-x-2 bg-white rounded p-2">
                {getFileIcon(file.type)}
                <span className="text-sm">{file.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAttachment(index)}
                  className="h-4 w-4 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="border-t bg-white h-fit p-4 fixed w-full bottom-0 z-10">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="text-gray-500 hover:text-gray-700"
            disabled={uploading}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
          />
          
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="pr-20 border-gray-200 focus:border-blue-500"
              disabled={sending || uploading}
            />
            <Button 
              variant="ghost" 
              size="sm" 
              className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>
          
          <Button 
            onClick={sendMessage}
            disabled={(!newMessage.trim() && attachments.length === 0) || sending || uploading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
            size="sm"
          >
            {sending || uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {/* Emoji picker */}
        {showEmojiPicker && (
          <div className="mt-2 p-2 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-10 gap-1">
              {EMOJI_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  className="p-1 hover:bg-gray-200 rounded text-lg"
                  onClick={() => {
                    setNewMessage(prev => prev + emoji);
                    setShowEmojiPicker(false);
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="text-xs text-gray-500 mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}
