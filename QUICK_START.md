# 🚀 Quick Start - Advanced Messaging System

## ⚡ Fast Setup

### Option 1: Start Everything at Once (Recommended)
```bash
npm run dev
```
This will start both the WebSocket server and the Next.js development server automatically.

### Option 2: Start Services Separately
```bash
# Terminal 1: Start WebSocket server
npm run ws

# Terminal 2: Start Next.js app
npm run dev:next
```

## 🎯 What's Ready

✅ **Real-time messaging** with WebSocket integration  
✅ **File attachments** (images, videos, audio, documents)  
✅ **Message reactions** with emoji support  
✅ **Typing indicators** and online status  
✅ **Message search** and filtering  
✅ **Push notifications** for new messages  
✅ **Message editing** and deletion  
✅ **Reply-to messages** functionality  

## 🔧 Database Setup

If you haven't set up the database yet:
```bash
npx prisma generate
npx prisma db push
npm run seed
```

## 🌐 Access the Application

1. Open your browser to `http://localhost:3000`
2. Log in with any seeded user (e.g., `jbekele@bu.edu`)
3. Navigate to the **Chat** section
4. Start messaging with real-time features!

## 📱 Test the Features

- **Send messages** with text and file attachments
- **React to messages** with emojis (👍, ❤️, 😂, etc.)
- **Search messages** using the search bar
- **See typing indicators** when someone is typing
- **Edit/delete** your own messages
- **Reply to specific messages**
- **Experience real-time updates** across browser tabs

## 🛠️ Troubleshooting

**WebSocket not connecting?**
- Use `npm run dev` so the WS server starts automatically
- Or set `NEXT_PUBLIC_SOCKET_URL` (comma-separated to provide fallbacks), e.g.
  ```bash
  NEXT_PUBLIC_SOCKET_URL=ws://localhost:3002
  ```
- Check that port 3002 is free and listening
- Check browser console for connection errors

**File uploads not working?**
- Verify `public/uploads/` directory exists
- Check file size (max 10MB) and type

**Database errors?**
- Run `npx prisma db push` to sync schema
- Ensure PostgreSQL is running

---

**🎉 Enjoy your advanced LinkedIn-style messaging system!** 
