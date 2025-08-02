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
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        socketManager.off('new_message');
        socketManager.off('typing_start');
        socketManager.off('typing_stop');
        socketManager.off('user_online');
        socketManager.off('message_reaction');
        socketManager.off('message_edited');
        socketManager.off('message_deleted');
      };
    }
  }, [session?.user?.email]);

  // Load messages
  useEffect(() => {
    loadMessages();
  }, [chatId, chatPartner]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollDownRef.current) {
      scrollDownRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const loadMessages = async () => {
    try {
      const res = await axios.post("/api/message/get", {
        chatPartner,
        chatId,
      });
      const sortedMessages = res.data.sort(
        (a: Message, b: Message) =>
          new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime()
      );
      setMessages(sortedMessages);

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

  // Real-time event handlers
  const handleNewMessage = useCallback((data: { message: Message }) => {
    setMessages(prev => [...prev, data.message]);
  }, []);

  const handleTypingStart = useCallback((data: TypingIndicator) => {
    if (data.chatId === chatId) {
      setTypingUsers(prev => {
        const existing = prev.find(t => t.userId === data.userId);
        if (existing) {
          return prev.map(t => t.userId === data.userId ? { ...t, isTyping: true, userName: data.userName } : t);
        }
        return [...prev, { ...data, userName: data.userName }];
      });
    }
  }, [chatId]);

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
      {/* Search Bar */}
      <div className="p-4 border-b bg-white">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchMessages()}
            className="pl-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-2 max-h-40 overflow-y-auto">
            {searchResults.map((result) => (
              <div
                key={result.message.id}
                className="p-2 hover:bg-gray-50 cursor-pointer text-sm"
                onClick={() => {
                  // Scroll to message
                  const element = document.getElementById(`message-${result.message.id}`);
                  element?.scrollIntoView({ behavior: 'smooth' });
                  setSearchResults([]);
                  setSearchQuery("");
                }}
              >
                <div className="font-medium">{result.chatPartnerName}</div>
                <div className="text-gray-600">{result.highlightedText}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                              <div className="absolute bottom-full right-0 mb-1 bg-white border rounded-lg shadow-lg p-1 z-10">
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
      <div className="border-t bg-white p-4">
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
