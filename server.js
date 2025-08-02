import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { parse } from 'url';

const server = createServer();
const wss = new WebSocketServer({ server });

const connectedUsers = new Map();

wss.on('connection', (ws, request) => {
  const { query } = parse(request.url, true);
  const userId = query.userId;

  if (!userId) {
    ws.close(1008, 'User ID required');
    return;
  }

  // Add user to connected users
  connectedUsers.set(userId, {
    userId,
    ws,
    isOnline: true
  });

  console.log(`User ${userId} connected`);

  // Send online status to other users
  broadcastToOthers(userId, {
    type: 'user_online',
    payload: {
      userId,
      isOnline: true,
      lastSeen: new Date().toISOString()
    }
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      handleMessage(userId, message);
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    handleUserDisconnect(userId);
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error for user ${userId}:`, error);
    handleUserDisconnect(userId);
  });
});

function handleMessage(senderId, message) {
  switch (message.type) {
    case 'new_message':
      broadcastToOthers(senderId, {
        type: 'new_message',
        payload: message.payload
      });
      break;

    case 'typing_start':
      broadcastToOthers(senderId, {
        type: 'typing_start',
        payload: {
          userId: senderId,
          userName: message.payload.userName || 'Unknown User',
          chatId: message.payload.chatId,
          isTyping: true
        }
      });
      break;

    case 'typing_stop':
      broadcastToOthers(senderId, {
        type: 'typing_stop',
        payload: {
          userId: senderId,
          userName: message.payload.userName || 'Unknown User',
          chatId: message.payload.chatId,
          isTyping: false
        }
      });
      break;

    case 'message_reaction':
      broadcastToAll({
        type: 'message_reaction',
        payload: message.payload
      });
      break;

    case 'message_edited':
      broadcastToOthers(senderId, {
        type: 'message_edited',
        payload: message.payload
      });
      break;

    case 'message_deleted':
      broadcastToOthers(senderId, {
        type: 'message_deleted',
        payload: message.payload
      });
      break;

    default:
      console.log('Unknown message type:', message.type);
  }
}

function handleUserDisconnect(userId) {
  const user = connectedUsers.get(userId);
  if (user) {
    user.isOnline = false;
    connectedUsers.delete(userId);
    
    console.log(`User ${userId} disconnected`);

    // Notify other users
    broadcastToOthers(userId, {
      type: 'user_online',
      payload: {
        userId,
        isOnline: false,
        lastSeen: new Date().toISOString()
      }
    });
  }
}

function broadcastToOthers(senderId, message) {
  connectedUsers.forEach((user, userId) => {
    if (userId !== senderId && user.ws.readyState === 1) { // WebSocket.OPEN
      user.ws.send(JSON.stringify(message));
    }
  });
}

function broadcastToAll(message) {
  connectedUsers.forEach((user) => {
    if (user.ws.readyState === 1) { // WebSocket.OPEN
      user.ws.send(JSON.stringify(message));
    }
  });
}

const PORT = process.env.WS_PORT || 3002;

server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  wss.close(() => {
    server.close(() => {
      console.log('WebSocket server closed');
      process.exit(0);
    });
  });
}); 