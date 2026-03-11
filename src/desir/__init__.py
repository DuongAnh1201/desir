"""
desir — entry point.

Adds the project root to sys.path so flat imports (config, ai, schemas, tools)
work whether you run `desir` CLI or `uv run python`.
"""

import sys
import os

# ── Path bootstrap ────────────────────────────────────────────────────────────
# src/desir/__init__.py  →  ../../  == project root
_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)


def main() -> None:
    import asyncio
    asyncio.run(_run())


async def _run() -> None:
    import logfire
    from config import settings
    from ai.prompts import load_prompt
    from tools.openai_realtime import run_session
    from tools.sending_email import send_notification_email, send_user_email
    from tools.communication import send_imessage, make_call, search_contact

    logfire.configure(
        token=settings.logfire_token,
        environment=settings.env,
        service_name="desir",
    )

    # ── Tool definitions (sent to Realtime API) ────────────────────────────────
    tool_definitions = [
        {
            "type": "function",
            "name": "send_email",
            "description": "Send an email. Use email_type='notification' for automated alerts (HTML template), or 'user_request' for a plain message the user wants to send.",
            "parameters": {
                "type": "object",
                "properties": {
                    "email_type": {"type": "string", "enum": ["notification", "user_request"]},
                    "to": {"type": "string", "description": "Recipient email address."},
                    "subject": {"type": "string"},
                    "body": {"type": "string", "description": "Email body (plain text for user_request; notification details for notification)."},
                    "link": {"type": "string", "description": "Optional URL for notification emails."},
                },
                "required": ["email_type", "to", "subject", "body"],
            },
        },
        {
            "type": "function",
            "name": "search_web",
            "description": "Search the internet and return a summary of the results.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string"},
                },
                "required": ["query"],
            },
        },
        {
            "type": "function",
            "name": "search_contact",
            "description": "Look up a contact's phone number by name from macOS Contacts.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                },
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
                    "recipient": {"type": "string", "description": "Phone number or Apple ID."},
                    "body": {"type": "string", "description": "Message content."},
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
                "properties": {
                    "recipient": {"type": "string", "description": "Phone number to call."},
                },
                "required": ["recipient"],
            },
        },
    ]

    # ── Tool handlers (called when the model invokes a function) ───────────────
    async def handle_send_email(email_type: str, to: str, subject: str, body: str, link: str = "") -> str:
        password = settings.email_password
        if email_type == "notification":
            success = send_notification_email(recipient=to, subject=subject, details=body, link=link, password=password)
        else:
            success = send_user_email(recipient=to, subject=subject, body=body, password=password)
        return f"Email {'sent' if success else 'failed'} to {to}."

    async def handle_search_web(query: str) -> str:
        import httpx
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    "https://google.serper.dev/search",
                    headers={"X-API-KEY": settings.serper_api_key},
                    json={"q": query, "num": 5},
                )
                resp.raise_for_status()
                results = resp.json().get("organic", [])
                return "\n".join(f"- {r['title']}: {r.get('snippet', '')}" for r in results[:5])
        except Exception as e:
            return f"Search failed: {e}"

    async def handle_search_contact(name: str) -> str:
        results = search_contact(name)
        if not results:
            return f"No contacts found for '{name}'."
        return "\n".join(f"{r['name']}: {r['phone']}" for r in results)

    async def handle_send_imessage(recipient: str, body: str) -> str:
        success = send_imessage(recipient=recipient, body=body)
        return f"iMessage {'sent' if success else 'failed'} to {recipient}."

    async def handle_make_call(recipient: str) -> str:
        success = make_call(recipient=recipient)
        return f"Calling {recipient}..." if success else f"Failed to call {recipient}."

    tool_handlers = {
        "send_email": handle_send_email,
        "search_web": handle_search_web,
        "search_contact": handle_search_contact,
        "send_imessage": handle_send_imessage,
        "make_call": handle_make_call,
    }

    print("Desir is ready. Speak now. (Ctrl+C to exit)\n")
    with logfire.span("session"):
        try:
            await run_session(
                api_key=settings.openai_api_key,
                model=settings.realtime_model,
                voice=settings.realtime_voice,
                system_prompt=load_prompt("realtime_session"),
                tool_definitions=tool_definitions,
                tool_handlers=tool_handlers,
            )
        except KeyboardInterrupt:
            print("\nGoodbye.")
