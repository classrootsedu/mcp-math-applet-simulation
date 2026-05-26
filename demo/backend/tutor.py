"""Interactive math tutor — LangGraph agent that guides a student through long division."""

import json
import logging
import os
from typing import Annotated, AsyncIterator

from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from typing_extensions import TypedDict
from langchain_aws import ChatBedrockConverse

load_dotenv()

logger = logging.getLogger("tutor")

# Keep system message + last N conversation messages to avoid rate-limit blowout.
# Each exchange is roughly: HumanMessage + AIMessage (+ optional ToolMessages).
# 20 messages ≈ 5-6 full exchanges including tool calls.
MAX_HISTORY = 20

SYSTEM_PROMPT = """You are a warm, encouraging math tutor helping a student learn long division.

━━ GOLDEN RULE — ONE RESPONSE PER TURN ━━
Call ALL tools silently first. Do NOT write any text before or between tool calls.
After all tool calls are done, write ONE complete response to the student.
The student should never see you "thinking out loud" or narrating that you are checking something.

━━ YOUR ROLE ━━
You guide — the student acts.
• React to what they did (correct or wrong)
• Explain the math briefly ("9 ÷ 3 = 3, so the quotient digit is 3")
• Ask the SPECIFIC math question for the next step
• Hint when wrong — never give away the answer

━━ MECHANICAL STEPS — INVISIBLE TO THE STUDENT ━━
The applet auto-fills these three steps. They are NEVER something you ask the student to do:
  • setPartialProduct     — appears automatically after a correct quotient digit
  • setSubtractionResult  — appears automatically after partial product
  • bringDownDigit        — usually auto-triggered

After a correct quotient, call describe_page to see the new currentStep.
You will find the mechanicals already done. Mention them briefly as context
("the applet worked out 3×3=9 and 9−9=0 for you") but focus on asking the
next STUDENT step — never say "the next step is partial product."

━━ STUDENT STEPS — ALWAYS ASK FIRST ━━
These steps belong to the student. Ask a specific question, then wait for their reply:
  • chooseDividendDigits  — "Which digits of [dividend] should we start with?"
  • chooseQuotientDigit   — "How many times does [divisor] go into [partial dividend]?"
  • setRemainder          — "What is the remainder after dividing?"

NEVER call choose_dividend_digits, choose_quotient_digit, or set_remainder in a turn
where the student has not provided a number. If they haven't answered yet, just ask.
When they DO answer, call the tool with their exact value (right or wrong — applet validates).

━━ HOW TO ASK — BE SPECIFIC ━━
Ask a real math question, not a navigation prompt.
  ✓ "How many times does 3 fit into 9? Type your answer!"
  ✓ "What digit goes in the quotient here? 9 ÷ 3 = ?"
  ✓ "After bringing down the 6, what is 6 ÷ 3?"
  ✗ "What should we do next?" ← NEVER say this
  ✗ "What do you think?" ← too vague
  ✗ "Let me know when ready!" ← not a question

━━ TURN FLOWS ━━

SESSION START:
  [silently] call describe_page → call start → call describe_page
  Then write ONE response: greet, state the problem, ask the first specific question.
  Do NOT call any student step tool here.

STUDENT TYPES AN ANSWER:
  [silently] call the matching tool with their value → call describe_page
  Then write ONE response:
    Correct: one sentence of praise + brief math explanation + specific question for next step
    Wrong:   one specific hint (no answer) + re-ask the same question

[Applet Event] STUDENT CLICKED IN THE APPLET:
  [silently] call describe_page
  Then write ONE response: feedback on what they clicked + specific question for next step

━━ TOOL RULES ━━
• Call describe_page whenever unsure of state — always before responding
• On any tool error, call describe_page immediately
• NEVER call set_partial_product, set_subtraction_result, or bring_down_digit
• NEVER call a student-step tool unless this turn contains their answer

Respond in 2–4 sentences. Warm, direct, never robotic."""


def get_llm() -> ChatBedrockConverse:
    aws_kwargs: dict = {}
    if os.getenv("AWS_ACCESS_KEY_ID"):
        aws_kwargs["aws_access_key_id"] = os.getenv("AWS_ACCESS_KEY_ID")
    if os.getenv("AWS_SECRET_ACCESS_KEY"):
        aws_kwargs["aws_secret_access_key"] = os.getenv("AWS_SECRET_ACCESS_KEY")

    return ChatBedrockConverse(
        model=os.getenv("BEDROCK_MODEL", "apac.amazon.nova-lite-v1:0"),
        region_name=os.getenv("BEDROCK_REGION", "ap-south-1"),
        temperature=0.3,
        max_tokens=512,
        **aws_kwargs,
    )

# def get_llm() -> ChatGroq:
#     return ChatGroq(
#         model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
#         api_key=os.getenv("GROQ_API_KEY"),
#         temperature=0.3,
#         max_tokens=512,
#     )


class ThinkingFilter:
    """Streaming filter that strips `<thinking>...</thinking>` blocks from model output.

    Bedrock Nova (and some other models) emit chain-of-thought reasoning wrapped in
    <thinking> tags as part of the user-facing content stream. We want to hide those
    from the student. Because tokens arrive a few characters at a time, the tags can be
    split across chunks — this filter buffers a tail of recent text to safely detect
    tags even when they straddle chunk boundaries.
    """

    OPEN = "<thinking>"
    CLOSE = "</thinking>"

    def __init__(self) -> None:
        self.in_thinking = False
        self.pending = ""

    def process(self, text: str) -> str:
        """Feed a chunk; return only the user-visible portion."""
        self.pending += text
        out: list = []
        while True:
            if self.in_thinking:
                idx = self.pending.find(self.CLOSE)
                if idx == -1:
                    # Could be in the middle of a `</thinking>`; hold back enough chars.
                    keep = len(self.CLOSE) - 1
                    if len(self.pending) > keep:
                        self.pending = self.pending[-keep:]
                    return "".join(out)
                self.pending = self.pending[idx + len(self.CLOSE):]
                self.in_thinking = False
            else:
                idx = self.pending.find(self.OPEN)
                if idx == -1:
                    # No tag in buffer; emit everything except a possible partial-tag tail.
                    keep = len(self.OPEN) - 1
                    if len(self.pending) > keep:
                        out.append(self.pending[:-keep])
                        self.pending = self.pending[-keep:]
                    return "".join(out)
                if idx > 0:
                    out.append(self.pending[:idx])
                self.pending = self.pending[idx + len(self.OPEN):]
                self.in_thinking = True

    def flush(self) -> str:
        """Emit any trailing non-thinking text at end of stream."""
        if self.in_thinking:
            # Unclosed `<thinking>` — drop the rest, it's reasoning that never closed.
            self.pending = ""
            return ""
        result = self.pending
        self.pending = ""
        return result


class TutorState(TypedDict):
    messages: Annotated[list, add_messages]


class TutorSession:
    """One interactive tutoring session with persistent LangGraph state."""

    def __init__(self, mcp_url: str, session_id: str = "demo"):
        self.mcp_url = mcp_url
        self.session_id = session_id
        self.config = {"configurable": {"thread_id": session_id}}
        self.graph = None
        self._turn = 0
        self._tools_by_name: dict = {}  # populated in initialize()
        logger.info(f"[{session_id}] TutorSession created mcp_url={mcp_url!r}")

    async def initialize(self) -> str:
        """Connect to MCP server and build the LangGraph graph."""
        logger.info(f"[{self.session_id}] Connecting to MCP at {self.mcp_url}/sse")
        client = MultiServerMCPClient(
            {
                "math-applet": {
                    "url": f"{self.mcp_url}/sse",
                    "transport": "sse",
                }
            }
        )
        tools = await client.get_tools()
        tool_names = [t.name for t in tools]
        self._tools_by_name = {t.name: t for t in tools}
        logger.info(f"[{self.session_id}] MCP tools loaded ({len(tools)}): {tool_names}")

        llm = get_llm()
        llm_with_tools = llm.bind_tools(tools)
        tool_node = ToolNode(tools)

        async def llm_node(state: TutorState):
            messages = state["messages"]
            total = len(messages)

            # Sliding window: always keep SystemMessage(s) + last MAX_HISTORY messages.
            if total > MAX_HISTORY:
                sys_msgs = [m for m in messages if isinstance(m, SystemMessage)]
                other_msgs = [m for m in messages if not isinstance(m, SystemMessage)]
                recent = other_msgs[-MAX_HISTORY:]
                # Bedrock Converse requires the first message to be a user (Human) turn.
                # Slicing mid-exchange can leave a leading AIMessage/ToolMessage — drop them.
                while recent and not isinstance(recent[0], HumanMessage):
                    recent = recent[1:]
                if not recent:
                    # Extreme edge case: fall back to the most recent HumanMessage we can find.
                    for m in reversed(other_msgs):
                        if isinstance(m, HumanMessage):
                            recent = [m]
                            break
                trimmed = sys_msgs + recent
                logger.info(
                    f"[{self.session_id}] History trimmed: {total} → {len(trimmed)} messages"
                )
                messages_to_send = trimmed
            else:
                messages_to_send = messages

            logger.info(
                f"[{self.session_id}] LLM invoke — turn={self._turn} messages={len(messages_to_send)}"
            )
            response = await llm_with_tools.ainvoke(messages_to_send)
            tc = response.tool_calls if hasattr(response, "tool_calls") else []
            logger.info(
                f"[{self.session_id}] LLM response — tool_calls={len(tc)} "
                f"content_len={len(str(response.content))}"
            )
            if tc:
                for call in tc:
                    logger.info(f"[{self.session_id}]   tool_call: {call.get('name')}({call.get('args')})")
            return {"messages": [response]}

        def route(state: TutorState):
            last = state["messages"][-1]
            if hasattr(last, "tool_calls") and last.tool_calls:
                return "tools"
            return END

        builder = StateGraph(TutorState)
        builder.add_node("tutor", llm_node)
        builder.add_node("tools", tool_node)
        builder.set_entry_point("tutor")
        builder.add_conditional_edges("tutor", route, {"tools": "tools", END: END})
        builder.add_edge("tools", "tutor")
        self.graph = builder.compile(checkpointer=MemorySaver())

        logger.info(f"[{self.session_id}] Graph compiled successfully")
        return f"Connected — {len(tools)} MCP tools available"

    # async def _fetch_page_state(self) -> dict:
    #     """Call describe_page directly via the MCP tool (bypassing the LLM).

    #     We do this on session start so the LLM never has to make the first tool call —
    #     it gets the problem state spoon-fed into its initial human message. This avoids
    #     a known failure mode where smaller LLMs (e.g. llama-3.3-70b) skip describe_page
    #     and jump straight to a wrong action like choose_dividend_digits with a malformed
    #     digits argument.
    #     """
    #     tool = self._tools_by_name.get("describe_page")
    #     if tool is None:
    #         logger.warning(f"[{self.session_id}] describe_page tool not available")
    #         return {}
    #     try:
    #         raw = await tool.ainvoke({})
    #         # MCP tools usually return JSON-as-string; some return dicts directly.
    #         data = json.loads(raw) if isinstance(raw, str) else raw
    #         logger.info(f"[{self.session_id}] describe_page direct call OK")
    #         return data if isinstance(data, dict) else {}
    #     except Exception as exc:
    #         logger.error(f"[{self.session_id}] describe_page direct call failed: {exc}")
    #         return {}

    # @staticmethod
    # def _summarize_state(state: dict) -> str:
    #     """Extract the bits that matter for the first turn (problem, current step)."""
    #     if not state:
    #         return "Applet state unknown — call describe_page when you need details."

    #     # describe_page wraps the result; handle both wrapped and unwrapped shapes.
    #     body = state.get("result", state)
    #     if isinstance(body, dict) and "result" in body and isinstance(body["result"], dict):
    #         body = body["result"]

    #     # Pull out the long-division surface info.
    #     problem = None
    #     current_step = None
    #     expected_actions = None
    #     surfaces = body.get("surfaces") or []
    #     for s in surfaces:
    #         mani = s.get("manifest") or {}
    #         st = s.get("state") or {}
    #         if "problem" in mani and not problem:
    #             problem = mani["problem"]
    #         if st.get("currentStep") and not current_step:
    #             current_step = st["currentStep"]
    #         if st.get("expectedActions") and not expected_actions:
    #             expected_actions = st["expectedActions"]

    #     page = body.get("page")
    #     lines = [f"Applet state at session start (from describe_page):"]
    #     if page is not None:
    #         lines.append(f"  • page: {page}")
    #     if problem:
    #         lines.append(f"  • problem: {problem.get('dividend')} ÷ {problem.get('divisor')}")
    #     if current_step:
    #         lines.append(f"  • currentStep: {current_step}")
    #     if expected_actions:
    #         lines.append(f"  • expectedActions: {expected_actions}")
    #     if len(lines) == 1:
    #         # Fall back: dump a compact JSON the LLM can still read.
    #         return f"Applet state at session start:\n{json.dumps(body)[:800]}"
    #     return "\n".join(lines)

    async def _reset_applet_to_page1(self) -> None:
        """Reset the Playwright-controlled applet to page 1 before a new session starts.

        The MCP server uses a singleton browser that persists across sessions.
        Without this, a second session would inherit whatever page/question was
        left over from the previous one.
        """
        tool = self._tools_by_name.get("reset")
        if tool is None:
            logger.warning(f"[{self.session_id}] 'reset' tool not found — skipping page-1 reset")
            return
        try:
            await tool.ainvoke({"to": "page1"})
            logger.info(f"[{self.session_id}] Applet reset to page 1")
        except Exception as exc:
            logger.warning(f"[{self.session_id}] Failed to reset applet to page 1: {exc}")

    async def start(self) -> AsyncIterator[dict]:
        """First turn: reset applet to page 1, then LLM greets + explains Step 1."""
        self._turn = 1
        logger.info(f"[{self.session_id}] Starting session (turn {self._turn})")

        # Always reset to page 1 — the MCP browser is a singleton that persists state.
        await self._reset_applet_to_page1()

        # # 1) Get applet state programmatically (no LLM involved).
        # state = await self._fetch_page_state()
        # state_summary = self._summarize_state(state)
        # logger.info(f"[{self.session_id}] Initial state summary:\n{state_summary}")

        # # Surface the prefetched state to the UI so the user can see we already have it.
        # yield {"type": "status", "content": "Fetched applet state — handing off to tutor…"}

        # # 2) Let the LLM produce ONLY a greeting + first-step explanation. NO tool calls.
        # initial_user_msg = (
        #     f"{state_summary}\n\n"
        #     "Based on the state above, do these three things in a single short reply "
        #     "(do NOT call any MCP tool right now — just write text):\n"
        #     "  1. Greet the student warmly in 1 sentence.\n"
        #     "  2. State the division problem (dividend ÷ divisor).\n"
        #     "  3. Explain what they need to do for the first step (currentStep above) "
        #     "and ask them for their answer.\n"
        #     "After they answer in chat, you'll call the appropriate MCP tool."
        # )

        # async for evt in self._run(
        #     [
        #         SystemMessage(content=SYSTEM_PROMPT),
        #         HumanMessage(content=initial_user_msg),
        #     ]
        # ):
        #     yield evt

        async for evt in self._run(
            [
                SystemMessage(content=SYSTEM_PROMPT),
                HumanMessage(
                    content=(
                        "The student is ready to begin a new session.\n\n"
                        "Do the following IN ORDER:\n"
                        "1. Call describe_page to see page 1.\n"
                        "2. Call start to navigate to page 2.\n"
                        "3. Call describe_page again to confirm page 2 loaded and read the problem.\n"
                        "4. Write a short greeting, state the division problem (e.g. '96 ÷ 3'), "
                        "explain what the first step (chooseDividendDigits) means, "
                        "and ASK the student which digits they want to start with.\n\n"
                        "IMPORTANT: Do NOT call choose_dividend_digits, choose_quotient_digit, "
                        "or set_remainder in this turn — just greet and ask."
                    )
                ),
            ]
        ):
            yield evt

    async def student_message(self, content: str) -> AsyncIterator[dict]:
        """Handle a chat message from the student."""
        self._turn += 1
        logger.info(f"[{self.session_id}] Student turn {self._turn}: {content[:80]!r}")
        async for evt in self._run([HumanMessage(content=content)]):
            yield evt

    async def applet_event(self, event_data: dict) -> AsyncIterator[dict]:
        """Handle a direct applet interaction (student clicked in the applet)."""
        event_type = event_data.get("type", "unknown")

        # Navigation event — student clicked the Back button in the demo iframe.
        # The iframe page has already changed; sync the Playwright browser via MCP.
        if event_type == "page.changed":
            payload = event_data.get("payload", {})
            from_page = payload.get("from", "?")
            to_page = payload.get("to", "?")
            if to_page == 1:
                summary = (
                    f"[Navigation] The student clicked the Back button. "
                    f"The demo iframe has navigated from page {from_page} to page 1. "
                    "The Playwright browser still needs to be synced. "
                    "1. Call click_previous to navigate the Playwright browser back to page 1. "
                    "2. Call describe_page to confirm you are on page 1. "
                    "3. Welcome the student back and let them know they can start a new problem."
                )
            else:
                summary = (
                    f"[Navigation] The applet navigated from page {from_page} to page {to_page}. "
                    "Call describe_page to see the current state and guide the student."
                )
            self._turn += 1
            logger.info(f"[{self.session_id}] Page changed event (turn {self._turn}): {from_page} → {to_page}")
            async for evt in self._run([HumanMessage(content=summary)]):
                yield evt
            return

        # Student answered a step directly in the applet (digit entry, etc.)
        payload = event_data.get("payload", {})
        action = payload.get("name", event_data.get("type", "unknown"))
        validation = payload.get("validation", {})
        correct = validation.get("correct")
        expected = validation.get("expected")
        actual = validation.get("actual", payload.get("digit"))

        result_str = "✓ correct" if correct is True else "✗ incorrect" if correct is False else "processed"
        summary = (
            f"[Applet Event] Student clicked/entered {actual!r} for step '{action}'. "
            f"Result: {result_str}."
        )
        if correct is False and expected is not None:
            summary += f" (expected {expected}, student gave {actual})"
        summary += (
            "\n\n[silently] Call describe_page first — no text before the tool call.\n"
            "Then write ONE response: feedback on the result + specific question for the next step.\n"
            "Do NOT call choose_dividend_digits / choose_quotient_digit / set_remainder — "
            "just ask the question and wait for the student's answer."
        )

        self._turn += 1
        logger.info(
            f"[{self.session_id}] Applet event turn {self._turn}: action={action!r} correct={correct}"
        )
        async for evt in self._run([HumanMessage(content=summary)]):
            yield evt

    async def _run(self, new_messages: list) -> AsyncIterator[dict]:
        """Stream LangGraph events for a new set of input messages.

        A single _run can trigger multiple LLM invocations (LLM → tools → LLM → …).
        We only emit text from the FINAL LLM pass — the one that makes no tool calls.
        Any text the model generates before calling a tool (e.g. "Let me check…") is
        buffered and discarded once we see a tool call, so the student never sees a
        split/double response.
        """
        logger.debug(f"[{self.session_id}] _run with {len(new_messages)} new messages")

        thinking_filter = ThinkingFilter()
        # Buffer for the current LLM pass; flushed to client only if the pass is final.
        current_pass_chunks: list = []

        async for event in self.graph.astream_events(
            {"messages": new_messages},
            config=self.config,
            version="v2",
        ):
            etype = event.get("event", "")

            if etype == "on_chat_model_start":
                thinking_filter = ThinkingFilter()
                current_pass_chunks = []

            elif etype == "on_chat_model_stream":
                chunk = event["data"].get("chunk")
                if not chunk:
                    continue
                content = chunk.content
                raw_text = ""
                if isinstance(content, list):
                    for block in content:
                        if isinstance(block, dict) and block.get("type") == "text":
                            raw_text += block.get("text", "")
                elif isinstance(content, str):
                    raw_text = content
                if not raw_text:
                    continue
                visible = thinking_filter.process(raw_text)
                if visible:
                    current_pass_chunks.append(visible)

            elif etype == "on_chat_model_end":
                tail = thinking_filter.flush()
                if tail:
                    current_pass_chunks.append(tail)

                # Emit this pass's text only if it made NO tool calls (final pass).
                output = event["data"].get("output")
                had_tool_calls = bool(
                    getattr(output, "tool_calls", None)
                )
                if not had_tool_calls:
                    for text_chunk in current_pass_chunks:
                        yield {"type": "ai_text", "content": text_chunk}
                else:
                    logger.debug(
                        f"[{self.session_id}] Suppressed {len(current_pass_chunks)} "
                        "pre-tool text chunks (intermediate LLM pass)"
                    )
                current_pass_chunks = []

            elif etype == "on_tool_start":
                tool_name = event.get("name", "")
                tool_input = event["data"].get("input", {})
                logger.info(f"[{self.session_id}] → TOOL START: {tool_name}({tool_input})")
                yield {
                    "type": "tool_call",
                    "tool": tool_name,
                    "input": tool_input,
                }

            elif etype == "on_tool_end":
                tool_name = event.get("name", "")
                raw = str(event["data"].get("output", ""))
                truncated = raw[:1500] + ("…" if len(raw) > 1500 else "")
                logger.info(f"[{self.session_id}] ← TOOL END: {tool_name} → {truncated[:200]}")
                yield {
                    "type": "tool_result",
                    "tool": tool_name,
                    "output": truncated,
                }

        logger.info(f"[{self.session_id}] Turn complete")
        yield {"type": "ai_done"}
