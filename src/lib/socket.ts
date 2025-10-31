class SocketManager {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private eventListeners: Map<string, ((data: unknown) => void)[]> = new Map();
  private lastUserId: string | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private endpoints: string[] | null = null;
  private endpointIndex = 0;
  private loggedErrorOnce = false;
  private loggedCloseOnce = false;

  connect(userId: string) {
    // Only run in the browser
    if (typeof window === "undefined" || typeof WebSocket === "undefined") {
      return;
    }
    // Save for reconnect
    this.lastUserId = userId;
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    if (!this.endpoints) {
      const hasWindow = typeof window !== "undefined";
      const scheme =
        hasWindow && window.location.protocol === "https:" ? "wss" : "ws";
      const host = hasWindow ? window.location.hostname : "localhost";
      const defaults = [`${scheme}://${host}:3002`, `${scheme}://${host}:3001`];
      const envRaw = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();
      const envList = envRaw
        ? envRaw
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
      const list = envList.length ? [...envList, ...defaults] : defaults;
      // dedupe while preserving order
      this.endpoints = Array.from(new Set(list));
      this.endpointIndex = 0;
    }
    const base = this.endpoints[this.endpointIndex % this.endpoints.length];
    const wsUrl = `${base}?userId=${encodeURIComponent(userId)}`;
    try {
      this.socket = new WebSocket(wsUrl);
      console.log("[WS] Connecting to", wsUrl);
    } catch (error) {
      console.error("[WS] WebSocket creation failed for", wsUrl, error);

      if (!this.loggedErrorOnce) {
        console.warn("[WS] WebSocket creation failed for", wsUrl);
        this.loggedErrorOnce = true;
      }
      this.scheduleReconnect(true);
      return;
    }

    this.socket.onopen = () => {
      console.log("Connected to WebSocket server");
      this.reconnectAttempts = 0;
      this.loggedErrorOnce = false;
      this.loggedCloseOnce = false;
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      this.triggerEvent("ws_open", null);
      // Start health pings
      this.startHealthChecks();
    };

    this.socket.onclose = (evt) => {
      try {
        const url = (this.socket as unknown as { url: string })?.url || wsUrl;
        const code = (evt as CloseEvent).code;
        const reason = (evt as CloseEvent).reason;
        if (!this.loggedCloseOnce) {
          console.warn("[WS] Disconnected", { url, code, reason });
          this.loggedCloseOnce = true;
        }
      } catch {
        if (!this.loggedCloseOnce) {
          console.log("Disconnected from WebSocket server");
          this.loggedCloseOnce = true;
        }
      }
      this.triggerEvent("ws_close", null);
      this.stopHealthChecks();
      this.scheduleReconnect(true);
    };

    this.socket.onerror = (evt) => {
      try {
        const url = (this.socket as unknown as { url: string })?.url || wsUrl;
        const state = this.socket?.readyState;
        // Extract a readable message when possible
        const errMsg =
          (evt as unknown as { message: string })?.message ||
          (evt as ErrorEvent)?.message ||
          "Connection error";
        if (!this.loggedErrorOnce) {
          // Log once to avoid noisy console spam
          console.warn("[WS] WebSocket error", { url, state, message: errMsg });
          this.loggedErrorOnce = true;
        }
      } catch {
        if (!this.loggedErrorOnce) {
          console.warn("WebSocket error");
          this.loggedErrorOnce = true;
        }
      }
      // Schedule a reconnect and rotate endpoints on repeated failures
      this.scheduleReconnect(true);
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "pong") {
          const now = Date.now();
          const ts = Number(data.payload?.ts) || now;
          const rtt = Math.max(0, now - ts);
          this.triggerEvent("ws_health", { latency: rtt, ts: now });
          return;
        }
        this.triggerEvent(data.type as string, data.payload);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };
  }

  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private startHealthChecks() {
    if (this.pingTimer) return;
    // Send first ping immediately
    this.emit("ping", { ts: Date.now() });
    this.pingTimer = setInterval(() => {
      this.emit("ping", { ts: Date.now() });
    }, 30000);
  }
  private stopHealthChecks() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private scheduleReconnect(rotateEndpoint = false) {
    if (!this.lastUserId) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    this.reconnectAttempts += 1;
    const delay = Math.min(1000 * this.reconnectAttempts, 5000);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      console.log(
        `Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
      );
      if (rotateEndpoint && this.endpoints && this.endpoints.length > 1) {
        this.endpointIndex = (this.endpointIndex + 1) % this.endpoints.length;
      }
      this.connect(this.lastUserId!);
    }, delay);
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      try {
        this.socket.close();
      } catch {}
      this.socket = null;
    }
  }

  emit(event: string, data: unknown) {
    const payload = JSON.stringify({ type: event, payload: data });
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(payload);
    } else {
      // Best-effort: try reconnect immediately and send after open
      if (
        this.lastUserId &&
        (!this.socket || this.socket.readyState !== WebSocket.CONNECTING)
      ) {
        this.connect(this.lastUserId);
      }
      const sock = this.socket;
      if (sock) {
        sock.addEventListener(
          "open",
          () => {
            try {
              sock.send(payload);
            } catch {}
          },
          { once: true },
        );
      }
    }
  }

  on(event: string, callback: (data: unknown) => void) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
    // Return an unsubscribe for convenience
    return () => this.off(event, callback);
  }

  off(event: string, callback?: (data: unknown) => void) {
    if (!callback) {
      // remove all listeners for the event
      this.eventListeners.delete(event);
      return;
    }
    const list = this.eventListeners.get(event);
    if (!list) return;
    const idx = list.indexOf(callback);
    if (idx >= 0) list.splice(idx, 1);
    if (list.length === 0) this.eventListeners.delete(event);
  }

  private triggerEvent(event: string, data: unknown) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }

  isConnected() {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

export const socketManager = new SocketManager();
