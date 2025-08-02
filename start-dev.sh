#!/bin/bash

# Start WebSocket server in background
echo "🚀 Starting WebSocket server..."
npm run ws &
WS_PID=$!

# Wait a moment for WebSocket server to start
sleep 2

# Start Next.js development server
echo "🚀 Starting Next.js development server..."
npm run dev

# Cleanup: kill WebSocket server when Next.js exits
trap "echo '🛑 Stopping WebSocket server...'; kill $WS_PID" EXIT 