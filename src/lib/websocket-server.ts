import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { URL } from 'url';

interface ConnectedUser {
  userId: string;
  ws: WebSocket;
  isOnline: boolean;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private connectedUsers: Map<string, ConnectedUser> = new Map();

  initialize(server: any) {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
      const url = new URL(request.url!, `http://${request.headers.host}`);
      const userId = url.searchParams.get('userId');

      if (!userId) {
        ws.close(1008, 'User ID required');
        return;
      }

      // Add user to connected users
      this.connectedUsers.set(userId, {
        userId,
        ws,
        isOnline: true
      });

      console.log(`User ${userId} connected`);

      // Send online status to other users
      this.broadcastToOthers(userId, {
        type: 'user_online',
        payload: {
          userId,
          isOnline: true,
          lastSeen: new Date().toISOString()
        }
      });

      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(userId, message);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });

      ws.on('close', () => {
        this.handleUserDisconnect(userId);
      });

      ws.on('error', (error: Error) => {
        console.error(`WebSocket error for user ${userId}:`, error);
        this.handleUserDisconnect(userId);
      });
    });
  }

  private handleMessage(senderId: string, message: any) {
    switch (message.type) {
      case 'ping':
        // send pong to sender only
        this.sendToUser(senderId, { type: 'pong', payload: { ts: message.payload?.ts || Date.now() } })
        break;
      case 'new_message':
        this.broadcastToOthers(senderId, {
          type: 'new_message',
          payload: message.payload
        });
        break;

      case 'typing_start':
        this.broadcastToOthers(senderId, {
          type: 'typing_start',
          payload: {
            userId: senderId,
            chatId: message.payload.chatId,
            isTyping: true,
            userName: message.payload.userName,
          }
        });
        break;

      case 'typing_stop':
        this.broadcastToOthers(senderId, {
          type: 'typing_stop',
          payload: {
            userId: senderId,
            chatId: message.payload.chatId,
            isTyping: false,
            userName: message.payload.userName,
          }
        });
        break;

      case 'message_reaction':
        this.broadcastToAll({
          type: 'message_reaction',
          payload: message.payload
        });
        break;

      case 'message_edited':
        this.broadcastToOthers(senderId, {
          type: 'message_edited',
          payload: message.payload
        });
        break;

      case 'message_deleted':
        this.broadcastToOthers(senderId, {
          type: 'message_deleted',
          payload: message.payload
        });
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private handleUserDisconnect(userId: string) {
    const user = this.connectedUsers.get(userId);
    if (user) {
      user.isOnline = false;
      this.connectedUsers.delete(userId);
      
      console.log(`User ${userId} disconnected`);

      // Notify other users
      this.broadcastToOthers(userId, {
        type: 'user_online',
        payload: {
          userId,
          isOnline: false,
          lastSeen: new Date().toISOString()
        }
      });
    }
  }

  private broadcastToOthers(senderId: string, message: any) {
    this.connectedUsers.forEach((user, userId) => {
      if (userId !== senderId && user.ws.readyState === WebSocket.OPEN) {
        user.ws.send(JSON.stringify(message));
      }
    });
  }

  private broadcastToAll(message: any) {
    this.connectedUsers.forEach((user) => {
      if (user.ws.readyState === WebSocket.OPEN) {
        user.ws.send(JSON.stringify(message));
      }
    });
  }

  // Public methods for external use
  sendToUser(userId: string, message: any) {
    const user = this.connectedUsers.get(userId);
    if (user && user.ws.readyState === WebSocket.OPEN) {
      user.ws.send(JSON.stringify(message));
    }
  }

  broadcastToChat(chatId: string, message: any, excludeUserId?: string) {
    this.connectedUsers.forEach((user, userId) => {
      if (userId !== excludeUserId && user.ws.readyState === WebSocket.OPEN) {
        user.ws.send(JSON.stringify(message));
      }
    });
  }

  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  getOnlineUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }
}

export const wsManager = new WebSocketManager(); 
