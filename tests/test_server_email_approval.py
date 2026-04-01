import asyncio
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from server import handle_send_email_tool_call


def test_handle_send_email_tool_call_emits_approval_request():
    browser_events: list[dict[str, object]] = []
    function_outputs: list[tuple[str, str]] = []
    pending_email_approvals: dict[str, object] = {}

    async def fake_send_browser_event(message: dict[str, object]) -> None:
        browser_events.append(message)

    async def fake_send_function_call_output(call_id: str, output: str) -> None:
        function_outputs.append((call_id, output))

    asyncio.run(
        handle_send_email_tool_call(
            call_id="call-123",
            args={
                "email_type": "user_request",
                "to": "tomnguyen6766@gmail.com",
                "subject": "Not Feeling Well",
                "body": "Hi Tom,\n\nI'm not feeling well today.\n\nTom",
            },
            pending_email_approvals=pending_email_approvals,
            send_browser_event=fake_send_browser_event,
            send_function_call_output=fake_send_function_call_output,
        )
    )

    assert function_outputs == []
    assert len(browser_events) == 1
    assert browser_events[0]["type"] == "approval_request"

    request = browser_events[0]["request"]
    assert isinstance(request, dict)
    assert request["toolName"] == "send_email"
    assert request["preview"]["to"] == "tomnguyen6766@gmail.com"
    assert request["preview"]["subject"] == "Not Feeling Well"
    assert request["preview"]["body"] == "Hi Tom,\n\nI'm not feeling well today.\n\nTom"
    assert "call-123" in pending_email_approvals
