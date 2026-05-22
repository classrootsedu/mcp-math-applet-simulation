"""LangGraph math tutor agent — drives the math applet via MCP tools using AWS Bedrock."""

import os
from typing import AsyncIterator

from dotenv import load_dotenv
from langchain_aws import ChatBedrockConverse
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph.prebuilt import create_react_agent

load_dotenv()

SYSTEM_PROMPT = """You are an AI math tutor demonstrating long division using an interactive applet.

You control the applet via MCP tools. Solve the problem step by step and explain your reasoning.

STEP ORDER — follow exactly:
1. describe_page → check current state (call this first and after each action)
2. If page=1: call start
3. On page=2, follow currentStep shown in the response:
   - chooseDividendDigits  → choose_dividend_digits(digits=[...])
     Rule: take the fewest leftmost digits of the dividend whose value >= divisor
   - chooseQuotientDigit   → choose_quotient_digit(column=N, value=V)
     Rule: V = floor(working_number / divisor)
   - writePartialProduct   → set_partial_product(column=N, value=V)  [may auto-fill — check first]
     Rule: V = quotient_digit * divisor
   - writeSubtractionResult → set_subtraction_result(column=N, value=V)
     Rule: V = working_number - partial_product
   - bringDownDigit        → bring_down_digit(fromColumn=N)
   - writeRemainder        → set_remainder(value=V)
     Rule: V = dividend % divisor
4. check_goal → verify completion
5. click_next → advance

Before each tool call, write 1-2 sentences explaining what you are doing and why. Show the math calculation explicitly (e.g., "96 ÷ 3: 9 >= 3 so we start with digit 0")."""


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
        max_tokens=2048,
        **aws_kwargs,
    )


async def run_tutor_agent(mcp_url: str) -> AsyncIterator[dict]:
    """Connect to the MCP server (SSE) and stream LangGraph agent events."""

    try:
        # langchain-mcp-adapters 0.1.0: MultiServerMCPClient is NOT an async context manager.
        # Use client directly and call get_tools() to establish the connection.
        client = MultiServerMCPClient(
            {
                "math-applet": {
                    "url": f"{mcp_url}/sse",
                    "transport": "sse",
                }
            }
        )
        tools = await client.get_tools()

    except Exception as exc:
        yield {"type": "error", "content": f"MCP connection failed: {exc}"}
        return

    yield {
        "type": "status",
        "content": f"MCP connected — {len(tools)} tools: {[t.name for t in tools]}",
    }

    try:
        agent = create_react_agent(get_llm(), tools)

        async for event in agent.astream_events(
            {
                "messages": [
                    SystemMessage(content=SYSTEM_PROMPT),
                    HumanMessage(
                        content=(
                            "Start the math tutor demo. "
                            "Walk through solving the long division problem step by step."
                        )
                    ),
                ]
            },
            version="v2",
        ):
            etype = event.get("event", "")

            if etype == "on_chat_model_stream":
                chunk = event["data"].get("chunk")
                if not chunk:
                    continue
                content = chunk.content
                if isinstance(content, list):
                    for block in content:
                        if isinstance(block, dict) and block.get("type") == "text":
                            text = block.get("text", "")
                            if text:
                                yield {"type": "ai_text", "content": text}
                elif isinstance(content, str) and content:
                    yield {"type": "ai_text", "content": content}

            elif etype == "on_tool_start":
                yield {
                    "type": "tool_call",
                    "tool": event.get("name", "unknown"),
                    "input": event["data"].get("input", {}),
                }

            elif etype == "on_tool_end":
                raw = str(event["data"].get("output", ""))
                yield {
                    "type": "tool_result",
                    "tool": event.get("name", "unknown"),
                    "output": raw[:1500] + ("…" if len(raw) > 1500 else ""),
                }

        yield {"type": "done", "content": "Demo complete! Problem solved."}

    except Exception as exc:
        yield {"type": "error", "content": str(exc)}
