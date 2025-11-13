import { PushNotification } from "@/types/message";

type NotificationActionDescriptor = {
  action: string;
  title: string;
  icon?: string;
};

type ExtendedNotificationOptions = NotificationOptions & {
  actions?: NotificationActionDescriptor[];
};

class PushNotificationService {
  private isSupported: boolean;
  private permission: NotificationPermission = "default";
  private swReady: Promise<ServiceWorkerRegistration | null> | null = null;

  constructor() {
    const hasWindow = typeof window !== "undefined";
    // Avoid referencing window during SSR
    this.isSupported = hasWindow && "Notification" in window;
    if (this.isSupported) {
      this.permission = Notification.permission;
    }
  }

  private ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === "undefined" || !("serviceWorker" in navigator))
      return Promise.resolve(null);
    if (this.swReady) return this.swReady;
    this.swReady = (async () => {
      try {
        const existing = await navigator.serviceWorker.getRegistration();
        if (existing) return existing;
        const reg = await navigator.serviceWorker.register("/sw.js");
        return reg;
      } catch {
        return null;
      }
    })();
    return this.swReady;
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn("Push notifications are not supported in this browser");
      return false;
    }

    if (this.permission === "granted") {
      // Best-effort: ensure SW registration for actions support
      this.ensureServiceWorker().catch(() => {});
      return true;
    }

    if (this.permission === "denied") {
      console.warn("Push notification permission denied");
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      this.permission = result;
      if (result === "granted") {
        // Register service worker for actionable notifications
        this.ensureServiceWorker().catch(() => {});
      }
      return result === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }

  async showNotification(notification: PushNotification): Promise<void> {
    if (!this.isSupported || this.permission !== "granted") {
      return;
    }

    try {
      const reg = await this.ensureServiceWorker();
      const lang =
        typeof window !== "undefined"
          ? window.location.pathname.split("/")[1] || "en"
          : "en";
      const options: ExtendedNotificationOptions = {
        body: notification.body,
        icon: notification.icon || "/favicon.ico",
        badge: notification.badge,
        tag: notification.tag,
        requireInteraction: notification.requireInteraction || false,
        data: {
          lang,
          ...notification.data,
        },
        actions: [
          {
            action: "reply",
            title: "Reply",
            icon: "/icon1.png",
          },
          { action: "open_chat", title: "Open Chat", icon: "/icon1.png" },
        ],
      };

      if (reg && "showNotification" in reg) {
        await reg.showNotification(notification.title, options);
      } else {
        // Fallback without actions
        const browserNotification = new Notification(
          notification.title,
          options,
        );
        browserNotification.onclick = (event) => {
          event.preventDefault();
          const chatId = (options.data as unknown as { chatId: string })
            ?.chatId;
          const lang =
            (options.data as unknown as { lang: string })?.lang || "en";
          if (chatId && typeof window !== "undefined") {
            window.focus();
            window.location.href = `/${lang}/chat/${chatId}`;
          }
          browserNotification.close();
        };
        setTimeout(() => browserNotification.close(), 5000);
      }
    } catch (error) {
      console.error("Error showing notification:", error);
    }
  }

  async showMessageNotification(
    senderName: string,
    messageText: string,
    chatId: string,
    chatPartner: string,
    messageId?: string,
  ): Promise<void> {
    const notification: PushNotification = {
      id: `msg-${Date.now()}`,
      title: `New message from ${senderName}`,
      body:
        messageText.length > 100
          ? messageText.substring(0, 100) + "..."
          : messageText,
      icon: "/icon1.png",
      tag: `chat-${chatId}`,
      data: { chatId, chatPartner, messageId },
      requireInteraction: false,
    };

    await this.showNotification(notification);
  }

  async showTypingNotification(
    senderName: string,
    chatId: string,
  ): Promise<void> {
    const notification: PushNotification = {
      id: `typing-${Date.now()}`,
      title: `${senderName} is typing...`,
      body: "Someone is typing a message",
      icon: "/icon1.png",
      tag: `typing-${chatId}`,
      data: { chatId },
      requireInteraction: false,
    };

    await this.showNotification(notification);
  }

  isPermissionGranted(): boolean {
    return this.permission === "granted";
  }

  getSupported(): boolean {
    return this.isSupported;
  }
}

export const pushNotificationService = new PushNotificationService();
