#!/bin/bash
set -euo pipefail

echo "Starting static applet server on :8080..."
cd /app
npx http-server -p 8080 -c-1 &
APPLET_PID=$!

for i in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:8080/" >/dev/null 2>&1; then
    echo "Applet server ready on :8080"
    break
  fi
  if ! kill -0 "$APPLET_PID" 2>/dev/null; then
    echo "Applet server exited before becoming ready" >&2
    exit 1
  fi
  sleep 1
done

if ! curl -sf "http://127.0.0.1:8080/" >/dev/null 2>&1; then
  echo "Timed out waiting for applet server on :8080" >&2
  exit 1
fi

echo "Starting MCP server on :3000..."
cd /app/mcp
export APPLET_URL=http://localhost:8080/index.html?ai=1
export HEADLESS=true
export PORT=3000
exec node mcp-applet-server.js
