# start_demo.ps1 — launch all three demo services in separate windows
# Run from the repo root: .\demo\start_demo.ps1

$root = Split-Path -Parent $PSScriptRoot

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Math Tutor AI — MCP Demo Launcher  " -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# 1. Applet static server (port 8080)
Write-Host "[1/3] Starting applet on http://localhost:8080 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList `
  "-NoExit", "-Command", `
  "cd '$root'; Write-Host 'Applet server (port 8080)' -ForegroundColor Green; npx http-server -p 8080"

Start-Sleep -Seconds 2

# 2. MCP server in SSE mode (port 3001)
Write-Host "[2/3] Starting MCP server on http://localhost:3001 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList `
  "-NoExit", "-Command", `
  "cd '$root\mcp'; Write-Host 'MCP Server SSE (port 3001)' -ForegroundColor Yellow; `$env:PORT='3001'; `$env:HEADLESS='false'; `$env:TUTOR_MODE='true'; `$env:APPLET_URL='http://localhost:8080/index.html?ai=1'; node mcp-applet-server.js"

Start-Sleep -Seconds 3

# 3. Demo backend (port 5000)
Write-Host "[3/3] Starting demo backend on http://localhost:5000 ..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList `
  "-NoExit", "-Command", `
  "cd '$root\demo\backend'; Write-Host 'Demo Backend (port 5000)' -ForegroundColor Magenta; uvicorn main:app --port 5000 --reload"

Start-Sleep -Seconds 2

# Write-Host ""
# Write-Host "All services launched!" -ForegroundColor Cyan
# Write-Host ""
# Write-Host "Open your browser at: http://localhost:5000" -ForegroundColor White
# Write-Host ""
# Write-Host "Services:"
# Write-Host "  Applet      → http://localhost:8080"
# Write-Host "  MCP Server  → http://localhost:3001"
# Write-Host "  Demo UI     → http://localhost:5000"
# Write-Host ""
