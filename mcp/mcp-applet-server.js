#!/usr/bin/env node
// mcp-applet-server.js
// MCP server that exposes the math applet's window.AppAPI as MCP tools.
// Drives the applet in a real browser via Playwright; the LLM (Claude Code,
// Claude Desktop, or any MCP-compatible client) calls those tools and sees
// the real applet update.

import { Server }                from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport }  from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport }    from '@modelcontextprotocol/sdk/server/sse.js';
import express                   from 'express';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
}                                from '@modelcontextprotocol/sdk/types.js';
import { chromium }              from 'playwright';

// ===== Configuration (override via env vars) =====
const CONFIG = {
  appletUrl:    process.env.APPLET_URL    || 'http://localhost:8080/index.html?ai=1',
  headless:     process.env.HEADLESS      === 'true',          // default: visible browser
  tutorMode:    process.env.TUTOR_MODE    !== 'false',         // default: tutor capability ON
  viewportW:    Number(process.env.VIEWPORT_W) || 1600,
  viewportH:    Number(process.env.VIEWPORT_H) || 900,
  startupDelay: Number(process.env.STARTUP_DELAY_MS) || 500,
  navTimeout:   Number(process.env.NAV_TIMEOUT_MS)   || 15000,
};

// ===== Browser singleton =====
let browser = null;
let page    = null;

async function ensureBrowser() {
  if (browser && page && !page.isClosed()) return page;
  process.stderr.write(`[mcp-applet] launching browser (headless=${CONFIG.headless})\n`);
  browser = await chromium.launch({ headless: CONFIG.headless });
  const context = await browser.newContext({
    viewport: { width: CONFIG.viewportW, height: CONFIG.viewportH },
  });
  page = await context.newPage();

  page.on('console',   msg  => process.stderr.write(`[browser:${msg.type()}] ${msg.text()}\n`));
  page.on('pageerror', err  => process.stderr.write(`[page error] ${err}\n`));

  try {
    await page.goto(CONFIG.appletUrl, { waitUntil: 'load', timeout: CONFIG.navTimeout });
  } catch (e) {
    throw new Error(
      `Failed to load ${CONFIG.appletUrl}. ` +
      `Is the applet served over HTTP? Run: npx http-server -p 8080 in the applet directory. ` +
      `Original error: ${e.message}`
    );
  }
  await page.waitForFunction(() => typeof window.AppAPI === 'object' && window.AppAPI !== null,
    null, { timeout: CONFIG.navTimeout });
  // PageConfig.js's DOMContentLoaded handler registers surfaces on a 200ms timeout.
  await page.waitForTimeout(CONFIG.startupDelay);

  if (CONFIG.tutorMode) {
    await page.evaluate(() => { window.AppAPI._tutorCapabilityActive = true; });
  }
  process.stderr.write(`[mcp-applet] connected (tutor=${CONFIG.tutorMode})\n`);
  return page;
}

async function callApi(path, args = {}) {
  const p = await ensureBrowser();
  return p.evaluate(({ path, args }) => {
    const parts = path.split('.');
    let target = window.AppAPI;
    for (let i = 0; i < parts.length - 1; i++) target = target && target[parts[i]];
    const fn = target && target[parts[parts.length - 1]];
    if (typeof fn !== 'function') {
      return { ok: false, error: { code: 'E_UNKNOWN_METHOD', message: 'no method ' + path } };
    }
    try {
      const result = fn.call(target, args);
      // describePage / snapshot / transcript / checkGoal return plain objects (no `ok`).
      // Surface dispatch and admin methods return { ok, ... }. Pass through if so; wrap if not.
      if (result && typeof result === 'object' && 'ok' in result) return result;
      return { ok: true, result };
    } catch (e) {
      return { ok: false, error: { code: 'E_INTERNAL', message: e.message, stack: e.stack } };
    }
  }, { path, args });
}

// ===== Tool definitions =====
const TOOLS = [
  // ---------- Information ----------
  { name: 'describe_page',
    description: 'Get the full schema and live state of the current page. Returns page number, semanticActions, uiElements, goal, and stateBySurface (currentStep, expectedActions, etc.). Call this whenever you need to know what to do next.',
    inputSchema: { type: 'object', properties: {} } },

  { name: 'snapshot',
    description: 'Same as describe_page but with a timestamp. Use to diff state between calls.',
    inputSchema: { type: 'object', properties: {} } },

  { name: 'check_goal',
    description: 'Check whether the current page-level objective has been met. Returns { reached, goal, actual }.',
    inputSchema: { type: 'object', properties: {} } },

  { name: 'check_session_goal',
    description: 'Check whether the multi-question session has been completed (last question + division complete).',
    inputSchema: { type: 'object', properties: {} } },

  { name: 'transcript',
    description: 'Read the event transcript ring buffer. Useful for inspecting human-driven events when tutoring.',
    inputSchema: { type: 'object',
      properties: {
        since: { type: 'integer', minimum: 0, description: 'Start sequence (default 0)' },
        limit: { type: 'integer', minimum: 1, description: 'Max events to return' },
      } } },

  // ---------- Page 1 ----------
  { name: 'start',
    description: 'Page 1 — tap Start to begin solving the current problem and navigate to Page 2.',
    inputSchema: { type: 'object', properties: {} } },

  // ---------- Page 2 — long division ----------
  { name: 'choose_dividend_digits',
    description: 'Page 2 — select which digit indices of the dividend to start dividing. For 96 ÷ 3, [0] selects the "9". If the first digit < divisor, you may need [0, 1] to form a value ≥ divisor.',
    inputSchema: { type: 'object',
      properties: { digits: { type: 'array', items: { type: 'integer', minimum: 0 },
                              description: 'Indices into the dividend, e.g. [0] or [0, 1]' } },
      required: ['digits'] } },

  { name: 'choose_quotient_digit',
    description: 'Page 2 — fill the quotient digit at a column. PEDAGOGICAL: ask the student first; pass their answer (right or wrong) here. The applet validates and provides correct/incorrect feedback in the response.',
    inputSchema: { type: 'object',
      properties: {
        column: { type: 'integer', minimum: 0,             description: 'Quotient column index, 0 = leftmost' },
        value:  { type: 'integer', minimum: 0, maximum: 9, description: 'Digit 0-9' },
      },
      required: ['column', 'value'] } },

  { name: 'set_partial_product',
    description: 'Page 2 — fill the partial product digit at a column. NOTE: in the current applet config, this is often auto-filled by the grid after a correct quotient digit. Call describe_page first to confirm the step is writePartialProduct.',
    inputSchema: { type: 'object',
      properties: {
        column: { type: 'integer', minimum: 0 },
        value:  { type: 'integer', minimum: 0, maximum: 9 },
      },
      required: ['column', 'value'] } },

  { name: 'set_subtraction_result',
    description: 'Page 2 — fill the subtraction result digit at a column. Mechanical (not pedagogical) — the answer is fully determined by the previous quotient choice.',
    inputSchema: { type: 'object',
      properties: {
        column: { type: 'integer', minimum: 0 },
        value:  { type: 'integer', minimum: 0, maximum: 9 },
      },
      required: ['column', 'value'] } },

  { name: 'bring_down_digit',
    description: 'Page 2 — bring down the next digit of the dividend.',
    inputSchema: { type: 'object',
      properties: { fromColumn: { type: 'integer', minimum: 0 } },
      required: ['fromColumn'] } },

  { name: 'set_remainder',
    description: 'Page 2 — fill the final remainder digit. Pedagogical: ask the student.',
    inputSchema: { type: 'object',
      properties: { value: { type: 'integer', minimum: 0, maximum: 9 } },
      required: ['value'] } },

  { name: 'select_multiplication_table_row',
    description: 'Page 2 — click a row in the multiplication table. When at the chooseQuotientDigit step, this also fills the quotient digit (equivalent to choose_quotient_digit with that multiplier).',
    inputSchema: { type: 'object',
      properties: { multiplier: { type: 'integer', minimum: 1, maximum: 10 } },
      required: ['multiplier'] } },

  // ---------- Navigation ----------
  { name: 'click_next',
    description: 'Click the » button. On Page 2 mid-bank: advance to next question. On Page 2 last question: reset to Page 1. On Page 1: go to Page 2.',
    inputSchema: { type: 'object', properties: {} } },

  { name: 'click_previous',
    description: 'Click the « button. On Page 2: go back to Page 1.',
    inputSchema: { type: 'object', properties: {} } },

  // ---------- Admin ----------
  { name: 'set_question',
    description: 'Admin — replace the current question with a new dividend and divisor. Useful for authoring/testing arbitrary problems.',
    inputSchema: { type: 'object',
      properties: {
        dividend: { type: 'integer', minimum: 1 },
        divisor:  { type: 'integer', minimum: 1 },
      },
      required: ['dividend', 'divisor'] } },

  { name: 'set_question_index',
    description: 'Admin — jump to question N in the bank (0-indexed). The bank has 5 questions: 96÷3, 96÷6, 74÷5, 13÷2, 125÷5.',
    inputSchema: { type: 'object',
      properties: { index: { type: 'integer', minimum: 0 } },
      required: ['index'] } },

  { name: 'reset',
    description: 'Admin — reset completion state and optionally navigate. `to` ∈ {page1, page2-fresh, currentPage-fresh}.',
    inputSchema: { type: 'object',
      properties: { to: { type: 'string', enum: ['page1', 'page2-fresh', 'currentPage-fresh'] } },
      required: ['to'] } },

  // ---------- UI escape hatches ----------
  { name: 'click',
    description: 'UI escape hatch — click an element by id. Prefer semantic actions; use this only for QA-style coverage of UI elements.',
    inputSchema: { type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'] } },

  { name: 'press_key',
    description: 'UI escape hatch — synthesize a keypress (e.g. "3" for typing the digit 3 on the active number pad).',
    inputSchema: { type: 'object',
      properties: { key: { type: 'string' } },
      required: ['key'] } },
];

// Tool name → AppAPI method path.
const TOOL_PATHS = {
  describe_page:                   'describePage',
  snapshot:                        'snapshot',
  check_goal:                      'checkGoal',
  check_session_goal:              'checkSessionGoal',
  transcript:                      'transcript',
  start:                           'actions.start',
  choose_dividend_digits:          'actions.chooseDividendDigits',
  choose_quotient_digit:           'actions.chooseQuotientDigit',
  set_partial_product:             'actions.setPartialProduct',
  set_subtraction_result:          'actions.setSubtractionResult',
  bring_down_digit:                'actions.bringDownDigit',
  set_remainder:                   'actions.setRemainder',
  select_multiplication_table_row: 'actions.selectMultiplicationTableRow',
  click_next:                      'actions.clickNext',
  click_previous:                  'actions.clickPrevious',
  set_question:                    'admin.setQuestion',
  set_question_index:              'admin.setQuestionIndex',
  reset:                           'admin.reset',
  click:                           'actions.click',
  press_key:                       'actions.pressKey',
};

// ===== MCP server =====
const server = new Server(
  { name: 'math-applet', version: '0.1.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const path = TOOL_PATHS[name];
  if (!path) {
    return { isError: true, content: [{ type: 'text', text: 'Unknown tool: ' + name }] };
  }
  try {
    const result = await callApi(path, args || {});
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (e) {
    return { isError: true,
             content: [{ type: 'text', text: 'Error: ' + e.message + (e.stack ? '\n' + e.stack : '') }] };
  }
});

// ===== Lifecycle =====
async function shutdown(code = 0) {
  try { if (browser) await browser.close(); } catch (_) { /* noop */ }
  process.exit(code);
}
process.on('SIGINT',  () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
process.on('uncaughtException', (e) => {
  process.stderr.write('[mcp-applet] uncaught: ' + (e.stack || e) + '\n');
  shutdown(1);
});

// Open the browser eagerly so the first tool call is fast and surface registration completes.
try {
  await ensureBrowser();
} catch (e) {
  process.stderr.write('[mcp-applet] startup failed: ' + e.message + '\n');
  process.exit(1);
}

// Start the MCP transport.
const port = process.env.PORT || null;
if (port) {
  const app = express();
  let sseTransport = null;
  
  app.get("/sse", async (req, res) => {
    sseTransport = new SSEServerTransport("/message", res);
    await server.connect(sseTransport);
  });
  
  app.post("/message", async (req, res) => {
    if (!sseTransport) {
      res.status(400).send("No active SSE connection");
      return;
    }
    await sseTransport.handlePostMessage(req, res);
  });

  app.get("/health", (req, res) => {
    res.status(200).send("OK");
  });

  app.listen(port, () => {
    process.stderr.write(`[mcp-applet] MCP server ready (SSE) on port ${port}\n`);
  });
} else {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('[mcp-applet] MCP server ready (stdio)\n');
}
