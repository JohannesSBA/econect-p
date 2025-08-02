import { PushNotification } from '@/types/message';

class PushNotificationService {
  private isSupported: boolean;
  private permission: NotificationPermission = 'default';

  constructor() {
    this.isSupported = 'Notification' in window;
    if (this.isSupported) {
      this.permission = Notification.permission;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Push notifications are not supported in this browser');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    if (this.permission === 'denied') {
      console.warn('Push notification permission denied');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      this.permission = result;
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  async showNotification(notification: PushNotification): Promise<void> {
    if (!this.isSupported || this.permission !== 'granted') {
      return;
    }

    try {
      const browserNotification = new Notification(notification.title, {
        body: notification.body,
        icon: notification.icon || '/favicon.ico',
        badge: notification.badge,
        tag: notification.tag,
        requireInteraction: notification.requireInteraction || false,
        data: notification.data
      });

      // Handle notification click
      browserNotification.onclick = (event) => {
        event.preventDefault();
        
        if (notification.data?.chatId) {
          // Navigate to the chat
          window.focus();
          window.location.href = `/chat/${notification.data.chatId}`;
        }
        
        browserNotification.close();
      };

      // Auto-close after 5 seconds
      setTimeout(() => {
        browserNotification.close();
      }, 5000);

    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  async showMessageNotification(
    senderName: string,
    messageText: string,
    chatId: string
  ): Promise<void> {
    const notification: PushNotification = {
      id: `msg-${Date.now()}`,
      title: `New message from ${senderName}`,
      body: messageText.length > 100 ? messageText.substring(0, 100) + '...' : messageText,
      icon: '/message-icon.png',
      tag: `chat-${chatId}`,
      data: { chatId },
      requireInteraction: false
    };

    await this.showNotification(notification);
  }

  async showTypingNotification(
    senderName: string,
    chatId: string
  ): Promise<void> {
    const notification: PushNotification = {
      id: `typing-${Date.now()}`,
      title: `${senderName} is typing...`,
      body: 'Someone is typing a message',
      icon: '/typing-icon.png',
      tag: `typing-${chatId}`,
      data: { chatId },
      requireInteraction: false
    };

    await this.showNotification(notification);
  }

  isPermissionGranted(): boolean {
    return this.permission === 'granted';
  }

  getSupported(): boolean {
    return this.isSupported;
  }
}

export const pushNotificationService = new PushNotificationService(); 