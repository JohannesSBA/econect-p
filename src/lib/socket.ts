class SocketManager {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private eventListeners: Map<string, Function[]> = new Map();

  connect(userId: string) {
    if (this.socket?.readyState === WebSocket.OPEN) return;

    const wsUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'ws://localhost:3002';
    this.socket = new WebSocket(`${wsUrl}?userId=${userId}`);

    this.socket.onopen = () => {
      console.log('Connected to WebSocket server');
      this.reconnectAttempts = 0;
    };

    this.socket.onclose = () => {
      console.log('Disconnected from WebSocket server');
      this.handleReconnect();
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.triggerEvent(data.type, data.payload);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        if (this.socket) {
          this.socket.close();
        }
      }, 1000 * this.reconnectAttempts);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  emit(event: string, data: any) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: event, payload: data }));
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string) {
    this.eventListeners.delete(event);
  }

  private triggerEvent(event: string, data: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  isConnected() {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

export const socketManager = new SocketManager(); 