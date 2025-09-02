#!/usr/bin/env bash
set -euo pipefail

PORT="${WS_PORT:-3002}"

cleanup() {
  echo '🛑 Stopping WebSocket server...'
  if [[ -n "${WS_PID-}" ]]; then
    kill "${WS_PID}" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

echo "🚀 Starting WebSocket server on :$PORT..."
WS_PORT="$PORT" npm run ws &
WS_PID=$!

# Wait briefly for the WebSocket server to accept connections (max ~10s)
for i in {1..20}; do
  node -e "const net=require('net'); const s=net.createConnection({host:'127.0.0.1', port:${PORT}},()=>{process.exit(0)}); s.on('error',()=>process.exit(1));" && break || sleep 0.5
done

echo "🚀 Starting Next.js development server..."
exec npm run dev:next 
