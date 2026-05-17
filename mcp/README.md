# Math Applet MCP Server

Exposes the offline math applet's `window.AppAPI` as MCP tools so an LLM
(Claude Code, Claude Desktop, or any MCP client) can drive the live applet
in a real browser.

## Architecture

```
LLM client (Claude Code / Desktop)
        │  MCP / stdio
        ▼
  mcp-applet-server.js  ────►  Playwright (Chromium)  ────►  index.html?ai=1
                                      │                            │
                                      └──── page.evaluate() ──────►│
                                                                   │
                                                            window.AppAPI
```

The MCP server keeps one Chromium window open. Each tool call invokes the
matching `AppAPI` method via `page.evaluate()`. The user sees the applet
update live in the browser as the LLM works.

## One-time setup

```bash
cd E:/Downloads/G4C3M20A1_v1/mcp
npm install
npm run install:browser     # downloads Chromium for Playwright
```

## Running

You need TWO things running:

1. **The applet over HTTP** (once, in any terminal):
   ```bash
   cd E:/Downloads/G4C3M20A1_v1
   npx http-server -p 8080
   ```

2. **The MCP server** — Claude Code / Desktop launches this on demand;
   you do NOT run it manually. See "Wire to Claude Code" below.

## Wire to Claude Code

Add to your project's `.mcp.json` (create if missing) at the repo root:

```json
{
  "mcpServers": {
    "math-applet": {
      "command": "node",
      "args": ["E:/Downloads/G4C3M20A1_v1/mcp/mcp-applet-server.js"]
    }
  }
}
```

Use forward slashes in paths even on Windows; JSON parsing accepts them.

Restart Claude Code in that project. Run `/mcp` and confirm the
`math-applet` server lists 18 tools (describe_page, start,
choose_quotient_digit, etc.).

## Wire to Claude Desktop

Edit `claude_desktop_config.json`:

- macOS:   `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "math-applet": {
      "command": "node",
      "args": ["E:/Downloads/G4C3M20A1_v1/mcp/mcp-applet-server.js"]
    }
  }
}
```

Restart Claude Desktop. The math-applet tools become available in any chat.

## Configuration (env vars)

| Variable           | Default                                            | Meaning                                              |
|--------------------|----------------------------------------------------|------------------------------------------------------|
| `APPLET_URL`       | `http://localhost:8080/index.html?ai=1`            | URL the server navigates Chromium to                 |
| `HEADLESS`         | `false` (browser visible)                          | Set `true` for headless mode                         |
| `TUTOR_MODE`       | `true` (tutor capability ON)                       | Set `false` for lean responses without tutor copy    |
| `VIEWPORT_W`       | `1600`                                             | Browser viewport width                               |
| `VIEWPORT_H`       | `900`                                              | Browser viewport height                              |
| `STARTUP_DELAY_MS` | `500`                                              | Wait after page load for surface registration       |
| `NAV_TIMEOUT_MS`   | `15000`                                            | goto / waitForFunction timeout                       |

To pass them via Claude Code's `.mcp.json`:

```json
{
  "mcpServers": {
    "math-applet": {
      "command": "node",
      "args": ["E:/Downloads/G4C3M20A1_v1/mcp/mcp-applet-server.js"],
      "env": {
        "HEADLESS":   "false",
        "TUTOR_MODE": "true"
      }
    }
  }
}
```

## Tools exposed

### Information
- `describe_page` — full schema + state for the current page
- `snapshot` — same plus a timestamp
- `check_goal` — page-level objective status
- `check_session_goal` — multi-question session status
- `transcript` — event ring buffer

### Page 1
- `start`

### Page 2 — long division
- `choose_dividend_digits({digits})`
- `choose_quotient_digit({column, value})`
- `set_partial_product({column, value})`
- `set_subtraction_result({column, value})`
- `bring_down_digit({fromColumn})`
- `set_remainder({value})`
- `select_multiplication_table_row({multiplier})`

### Navigation
- `click_next`
- `click_previous`

### Admin
- `set_question({dividend, divisor})`
- `set_question_index({index})`
- `reset({to})`

### UI escape hatches
- `click({id})`
- `press_key({key})`

## Troubleshooting

**"Failed to load http://localhost:8080/..."** — start the static HTTP
server first (Step 1 in "Running"). The MCP server will exit if it can't
reach the applet on startup.

**"E_NOT_INTERACTABLE" on action calls** — the applet is on Page 1, not
Page 2. Call `start` first, then verify with `describe_page`.

**Browser closes unexpectedly** — check the MCP server's stderr in
Claude Code's logs. Common cause: navigation away from the applet (e.g.,
a chat-driven URL change). Restart the MCP server.

**Tutor block missing on responses** — confirm `TUTOR_MODE !== 'false'`.
Or in the Claude session, ask the model to call `describe_page` to verify
`AppAPI._tutorCapabilityActive` was set on startup.

## A typical Claude prompt

> You are tutoring a 4th-grade student through long division. Use the
> math-applet MCP tools to drive the applet. Start with `describe_page`,
> call `start` to enter Page 2, then walk the student through the
> division by asking what they think each step's answer is, calling the
> matching action with their answer, and using the `tutor` block in
> the response to coach them. Don't auto-reveal answers when
> `next.recommended.pedagogical === true`.

## Stopping

Close Claude Code (or remove the entry from `.mcp.json`). The MCP server
shuts down with the client; the Chromium window closes with it. The
static HTTP server (`npx http-server`) keeps running until you Ctrl+C it.
