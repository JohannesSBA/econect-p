/* Basic service worker to handle notification actions */
self.addEventListener('notificationclick', (event) => {
  const action = event.action;
  const notification = event.notification;
  const data = notification?.data || {};
  const chatId = data.chatId;
  const chatPartner = data.chatPartner;
  const messageId = data.messageId;
  const lang = data.lang || 'en';
  const chatUrl = `/${lang}/chat/${chatId}`;

  event.notification.close();

  event.waitUntil((async () => {
    // Helper: focus existing client or open new
    const focusOrOpen = async (url) => {
      const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of allClients) {
        // Focus the first client and navigate
        try { await client.focus(); } catch {}
        try { await client.navigate(url); } catch {}
        return;
      }
      await clients.openWindow(url);
    };

    if (action === 'open_chat' || !action) {
      await focusOrOpen(chatUrl);
      return;
    }

    if (action === 'reply') {
      // On Android Chrome, a text action adds `event.reply`
      const replyText = event.reply || '';
      if (replyText && chatId && chatPartner) {
        try {
          await fetch('/api/message', {
            method: 'POST',
            credentials: 'include',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ text: replyText, chatId, chatPartner, replyTo: messageId }),
          });
          // Optionally, focus chat after sending
          await focusOrOpen(chatUrl);
        } catch (e) {
          await focusOrOpen(chatUrl);
        }
      } else {
        await focusOrOpen(chatUrl);
      }
    }
  })());
});

self.addEventListener('notificationclose', (_event) => {
  // Placeholder for metrics if needed
});

