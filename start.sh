#!/bin/bash
set -e

# Start the static applet server in the background
echo "Starting static applet server..."
cd /app
npx http-server -p 8080 &

# Start the MCP server
echo "Starting MCP server..."
cd /app/mcp
export APPLET_URL=http://localhost:8080/index.html?ai=1
export HEADLESS=true
export PORT=3000
node mcp-applet-server.js
