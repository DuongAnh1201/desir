"""
Desir WebSocket Bridge Server

Browser ←→ Python Server ←→ OpenAI Realtime API
         ws://localhost:8765    wss://api.openai.com

- Server-side tool calls: send_email, search_web, search_contact, send_imessage, make_call
- Browser-side tool calls: changeThemeColor, update_daily_tasks (forwarded to frontend)

Run: uv run python server.py
"""

import asyncio
import http
import json
import os
import sys
from collections.abc import Awaitable, Callable
from typing import Any

import logfire
import websockets
from websockets.server import WebSocketServerProtocol

sys.path.insert(0, os.path.dirname(__file__))

REALTIME_URL = "wss://api.openai.com/v1/realtime"
FRONTEND_TOOLS = {"changeThemeColor", "update_daily_tasks"}

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "name": "send_email",
        "description": "Mandatory for complete email requests. As soon as recipient, subject, and body are known, call this tool to prepare the draft for on-screen approval. Do not read the full draft aloud instead of using this tool. Use email_type='notification' for automated alerts (HTML template), or 'user_request' for a plain message the user wants to send.",
        "parameters": {
            "type": "object",
            "properties": {
                "email_type": {"type": "string", "enum": ["notification", "user_request"]},
                "to": {"type": "string", "description": "Recipient email address."},
                "subject": {"type": "string"},
                "body": {"type": "string"},
                "link": {"type": "string", "description": "Optional URL for notification emails."},
            },
            "required": ["email_type", "to", "subject", "body"],
        },
    },
    {
        "type": "function",
        "name": "schedule_event",
        "description": "Add or manage an event on the user's Apple Calendar.",
        "parameters": {
            "type": "object",
            "properties": {
                "title": {"type": "string", "description": "Event title."},
                "when": {"type": "string", "description": "Date and time, e.g. 'tomorrow at 9am' or '2026-03-10T09:00'."},
                "details": {"type": "string", "description": "Optional extra details or description."},
            },
            "required": ["title", "when"],
        },
    },
    {
        "type": "function",
        "name": "search_web",
        "description": "Search the internet and return a summary of results.",
        "parameters": {
            "type": "object",
            "properties": {"query": {"type": "string"}},
            "required": ["query"],
        },
    },
    {
        "type": "function",
        "name": "search_contact",
        "description": "Look up a contact's phone number by name from macOS Contacts.",
        "parameters": {
            "type": "object",
            "properties": {"name": {"type": "string"}},
            "required": ["name"],
        },
    },
    {
        "type": "function",
        "name": "send_imessage",
        "description": "Send an iMessage to a phone number or Apple ID.",
        "parameters": {
            "type": "object",
            "properties": {
                "recipient": {"type": "string"},
                "body": {"type": "string"},
            },
            "required": ["recipient", "body"],
        },
    },
    {
        "type": "function",
        "name": "make_call",
        "description": "Initiate a phone call to a number.",
        "parameters": {
            "type": "object",
            "properties": {"recipient": {"type": "string"}},
            "required": ["recipient"],
        },
    },
    {
        "type": "function",
        "name": "changeThemeColor",
        "description": "Change the theme color of the Désir interface.",
        "parameters": {
            "type": "object",
            "properties": {
                "color": {"type": "string", "description": "Hex color code or color name (e.g. 'red', '#ff0000')."}
            },
            "required": ["color"],
        },
    },
    {
        "type": "function",
        "name": "update_daily_tasks",
        "description": "Update the list of daily task recommendations shown on the interface.",
        "parameters": {
            "type": "object",
            "properties": {
                "tasks": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "The new list of recommended tasks.",
                }
            },
            "required": ["tasks"],
        },
    },
]


async def handle_send_email_tool_call(
    call_id: str,
    args: dict[str, Any],
    pending_email_approvals: dict[str, Any],
    send_browser_event: Callable[[dict[str, Any]], Awaitable[None]],
    send_function_call_output: Callable[[str, str], Awaitable[None]],
) -> None:
    from tools.email_approval import EmailDraft, build_email_approval_request

    try:
        draft = EmailDraft.from_tool_args(args)
    except ValueError as error:
        result = (
            "Email draft rejected before sending. "
            f"Ask the user for the missing or corrected details. Reason: {error}"
        )
        print(f"[email-approval] rejected call_id={call_id} reason={error}")
        await send_function_call_output(call_id, result)
        return

    pending_email_approvals[call_id] = draft
    approval_request = build_email_approval_request(call_id, draft)
    print(
        f"[email-approval] prepared call_id={call_id} "
        f"to={draft.to!r} subject={draft.subject!r}"
    )
    await send_browser_event({
        "type": "approval_request",
        "request": approval_request,
    })
    print(f"[email-approval] emitted approval_request call_id={call_id}")


async def session_handler(browser_ws: WebSocketServerProtocol) -> None:
    from config import settings
    from ai.prompts import load_prompt
    from ai.agents.orchestrator import get_orchestrator
    from ai.agents.deps import OrchestratorDeps
    from tools.email_approval import (
        EmailDraft,
        build_revision_output,
        execute_email_draft,
        merge_edited_email_draft,
    )

    # Conversation history — passed as context to the orchestrator each call
    history: list[dict[str, str]] = []

    # Single deps object per session — mutable state (history, event IDs) persists across calls
    deps = OrchestratorDeps(
        search_api_key=settings.serper_api_key,
        history_context={"turns": history},
    )

    # ── Single dispatcher — pass all args to the orchestrator as-is ──────────
    async def dispatch(tool_name: str, args: dict) -> str:
        prompt = f"{tool_name}: {json.dumps(args, ensure_ascii=False)}"
        result = await get_orchestrator().run(prompt, deps=deps)
        return result.output.response

    # ── Connect to OpenAI Realtime ─────────────────────────────────────────────
    headers = {
        "Authorization": f"Bearer {settings.openai_api_key}",
        "OpenAI-Beta": "realtime=v1",
    }
    url = f"{REALTIME_URL}?model={settings.realtime_model}"

    print("[server] Browser connected. Opening OpenAI session...")

    with logfire.span("session"):
        async with websockets.connect(url, additional_headers=headers) as openai_ws:
            await openai_ws.send(json.dumps({
                "type": "session.update",
                "session": {
                    "modalities": ["audio", "text"],
                    "voice": settings.realtime_voice,
                    "instructions": load_prompt("realtime_session"),
                    "input_audio_format": "pcm16",
                    "output_audio_format": "pcm16",
                    "input_audio_transcription": {"model": "whisper-1"},
                    "turn_detection": {
                        "type": "server_vad",
                        "silence_duration_ms": 600,
                        "threshold": 0.5,
                    },
                    "tools": TOOL_DEFINITIONS,
                    "tool_choice": "auto",
                },
            }))

            pending_fn_calls: dict[str, dict] = {}
            pending_email_approvals: dict[str, EmailDraft] = {}
            _pending_user: str = ""
            _pending_desir: str = ""

            async def send_function_call_output(call_id: str, output: str) -> None:
                await openai_ws.send(json.dumps({
                    "type": "conversation.item.create",
                    "item": {
                        "type": "function_call_output",
                        "call_id": call_id,
                        "output": output,
                    },
                }))
                await openai_ws.send(json.dumps({"type": "response.create"}))

            # ── Browser → OpenAI ───────────────────────────────────────────────
            async def forward_browser_to_openai() -> None:
                async for raw in browser_ws:
                    msg = json.loads(raw)

                    if msg.get("type") == "audio":
                        await openai_ws.send(json.dumps({
                            "type": "input_audio_buffer.append",
                            "audio": msg["data"],
                        }))

                    elif msg.get("type") == "tool_result":
                        # Result from a frontend-handled tool call
                        await send_function_call_output(msg["call_id"], str(msg["result"]))

                    elif msg.get("type") == "approval_result":
                        request_id = msg.get("request_id")
                        decision = msg.get("decision")
                        if not isinstance(request_id, str) or decision not in {"approved", "edited", "cancelled"}:
                            continue

                        draft = pending_email_approvals.pop(request_id, None)
                        if draft is None:
                            continue

                        print(f"[email-approval] resolved call_id={request_id} decision={decision}")
                        if decision == "approved":
                            edited_draft = msg.get("draft")
                            try:
                                approved_draft = merge_edited_email_draft(draft, edited_draft)
                            except (TypeError, ValueError) as error:
                                output = (
                                    "Email draft rejected before sending. "
                                    "Ask the user to correct the edited details. "
                                    f"Reason: {error}"
                                )
                            else:
                                output = await asyncio.to_thread(execute_email_draft, approved_draft)
                        else:
                            output = build_revision_output(draft, decision)

                        await send_function_call_output(request_id, output)

            # ── OpenAI → Browser ───────────────────────────────────────────────
            async def forward_openai_to_browser() -> None:
                nonlocal _pending_user, _pending_desir

                async for raw in openai_ws:
                    event = json.loads(raw)
                    etype = event.get("type", "")

                    # Audio → stream to browser
                    if etype == "response.audio.delta":
                        await browser_ws.send(json.dumps({
                            "type": "audio",
                            "data": event["delta"],
                        }))
                        await browser_ws.send(json.dumps({"type": "state", "speaking": True}))

                    # Accumulate Desir's transcript
                    elif etype == "response.audio_transcript.delta":
                        _pending_desir += event.get("delta", "")

                    # User speech transcription
                    elif etype == "conversation.item.input_audio_transcription.completed":
                        transcript = event.get("transcript", "").strip()
                        _pending_user = transcript
                        await browser_ws.send(json.dumps({
                            "type": "transcript",
                            "role": "user",
                            "text": transcript,
                        }))
                        # STOP command
                        if transcript.lower().rstrip(".!") == "stop":
                            print("[server] STOP detected.")
                            await openai_ws.send(json.dumps({"type": "response.cancel"}))
                            await browser_ws.send(json.dumps({"type": "state", "speaking": False}))

                    # Response complete — commit history
                    elif etype == "response.done":
                        if _pending_user or _pending_desir:
                            entry = {"User": _pending_user, "desir": _pending_desir.strip()}
                            history.append(entry)
                            print(f"[history] User: {entry['User']!r}  |  desir: {entry['desir']!r}")
                            await browser_ws.send(json.dumps({
                                "type": "transcript",
                                "role": "assistant",
                                "text": entry["desir"],
                            }))
                            _pending_user = ""
                            _pending_desir = ""
                        await browser_ws.send(json.dumps({"type": "state", "speaking": False}))

                    # Function call args — accumulate
                    elif etype == "response.function_call_arguments.delta":
                        call_id = event["call_id"]
                        if call_id not in pending_fn_calls:
                            pending_fn_calls[call_id] = {"name": event.get("name", ""), "args": ""}
                        pending_fn_calls[call_id]["args"] += event["delta"]

                    # Function call complete
                    elif etype == "response.function_call_arguments.done":
                        call_id = event["call_id"]
                        fn_name = event.get("name") or pending_fn_calls.get(call_id, {}).get("name", "")
                        raw_args = event.get("arguments") or pending_fn_calls.get(call_id, {}).get("args", "{}")
                        try:
                            args = json.loads(raw_args)
                        except json.JSONDecodeError:
                            args = {}

                        if fn_name in FRONTEND_TOOLS:
                            # Forward to browser — it responds with tool_result
                            await browser_ws.send(json.dumps({
                                "type": "tool_call",
                                "call_id": call_id,
                                "name": fn_name,
                                "args": args,
                            }))
                        elif fn_name == "send_email":
                            await handle_send_email_tool_call(
                                call_id=call_id,
                                args=args,
                                pending_email_approvals=pending_email_approvals,
                                send_browser_event=lambda message: browser_ws.send(json.dumps(message)),
                                send_function_call_output=send_function_call_output,
                            )
                        else:
                            try:
                                result = await dispatch(fn_name, args)
                            except Exception as e:
                                result = f"Error executing {fn_name}: {e}"

                            await send_function_call_output(call_id, str(result))

                        pending_fn_calls.pop(call_id, None)

                    elif etype == "error":
                        msg = event.get("error", {}).get("message", "Unknown error")
                        print(f"[openai] Error: {msg}")
                        await browser_ws.send(json.dumps({"type": "error", "message": msg}))

            browser_task = asyncio.create_task(forward_browser_to_openai())
            try:
                await forward_openai_to_browser()
            except websockets.exceptions.ConnectionClosedOK:
                pass
            finally:
                browser_task.cancel()
                print("[server] Session closed.")


async def main() -> None:
    from config import settings
    logfire.configure(
        token=settings.logfire_token,
        environment=settings.env,
        service_name="desir",
    )
    logfire.instrument_pydantic_ai()
    host = os.getenv("DESIR_HOST", "0.0.0.0")
    port = int(os.getenv("DESIR_PORT", "8765"))
    def handle_http(connection, request):
        if request.headers.get("upgrade", "").lower() != "websocket":
            return connection.respond(http.HTTPStatus.OK, "Desir WebSocket server\n")

    print(f"Desir server running on ws://{host}:{port}")
    async with websockets.serve(session_handler, host, port, process_request=handle_http):
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
