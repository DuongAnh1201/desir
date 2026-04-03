import asyncio
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from server import (
    handle_pending_email_approval,
    handle_send_email_tool_call,
    handle_transcribed_user_utterance,
)
from tools.email_approval import (
    EmailDraft,
    PendingEmailApproval,
    PendingEmailApprovalState,
)


def test_handle_send_email_tool_call_emits_approval_request():
    browser_events: list[dict[str, object]] = []
    function_outputs: list[tuple[str, str]] = []
    pending_email_approval = PendingEmailApprovalState()

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
            pending_email_approval=pending_email_approval,
            send_browser_event=fake_send_browser_event,
            send_function_call_output=fake_send_function_call_output,
        )
    )

    assert function_outputs == []
    assert len(browser_events) == 1
    assert browser_events[0]["type"] == "approval_request"

    request = browser_events[0]["request"]
    assert isinstance(request, dict)
    assert request["id"] == "call-123"
    assert request["toolName"] == "send_email"
    assert request["preview"]["to"] == "tomnguyen6766@gmail.com"
    assert request["preview"]["subject"] == "Not Feeling Well"
    assert request["preview"]["body"] == "Hi Tom,\n\nI'm not feeling well today.\n\nTom"
    assert pending_email_approval.current is not None
    assert pending_email_approval.current.approval_id == "call-123"
    assert pending_email_approval.current.openai_call_id == "call-123"


def test_handle_send_email_tool_call_reuses_stable_approval_id_for_revisions():
    browser_events: list[dict[str, object]] = []
    function_outputs: list[tuple[str, str]] = []
    pending_email_approval = PendingEmailApprovalState(
        current=PendingEmailApproval(
            approval_id="approval-123",
            openai_call_id="call-123",
            draft=EmailDraft(
                email_type="user_request",
                to="old@example.com",
                subject="Old subject",
                body="Old body",
            ),
        )
    )

    async def fake_send_browser_event(message: dict[str, object]) -> None:
        browser_events.append(message)

    async def fake_send_function_call_output(call_id: str, output: str) -> None:
        function_outputs.append((call_id, output))

    asyncio.run(
        handle_send_email_tool_call(
            call_id="call-456",
            args={
                "email_type": "user_request",
                "to": "new@example.com",
                "subject": "Updated subject",
                "body": "Updated body",
            },
            pending_email_approval=pending_email_approval,
            send_browser_event=fake_send_browser_event,
            send_function_call_output=fake_send_function_call_output,
        )
    )

    assert function_outputs == []
    assert len(browser_events) == 1
    request = browser_events[0]["request"]
    assert request["id"] == "approval-123"
    assert request["preview"]["to"] == "new@example.com"
    assert request["preview"]["subject"] == "Updated subject"
    assert request["preview"]["body"] == "Updated body"
    assert pending_email_approval.current is not None
    assert pending_email_approval.current.approval_id == "approval-123"
    assert pending_email_approval.current.openai_call_id == "call-456"
    assert pending_email_approval.current.draft.to == "new@example.com"


def test_handle_pending_email_approval_sends_email_on_voice_approval():
    browser_events: list[dict[str, object]] = []
    function_outputs: list[tuple[str, str]] = []
    pending_email_approval = PendingEmailApprovalState(
        current=PendingEmailApproval(
            approval_id="approval-123",
            openai_call_id="call-456",
            draft=EmailDraft(
                email_type="user_request",
                to="friend@example.com",
                subject="Dinner plans",
                body="Are you free tomorrow at 7?",
            ),
        )
    )

    async def fake_send_browser_event(message: dict[str, object]) -> None:
        browser_events.append(message)

    async def fake_send_function_call_output(call_id: str, output: str) -> None:
        function_outputs.append((call_id, output))

    async def fake_execute_email(draft: EmailDraft) -> str:
        return f"Email successfully sent to {draft.to}."

    handled = asyncio.run(
        handle_pending_email_approval(
            transcript="Send it",
            pending_email_approval=pending_email_approval,
            send_browser_event=fake_send_browser_event,
            send_function_call_output=fake_send_function_call_output,
            execute_email=fake_execute_email,
        )
    )

    assert handled is True
    assert pending_email_approval.current is None
    assert browser_events == [
        {
            "type": "approval_resolved",
            "request_id": "approval-123",
            "decision": "approved",
        }
    ]
    assert function_outputs == [("call-456", "Email successfully sent to friend@example.com.")]


def test_handle_pending_email_approval_cancels_by_voice():
    browser_events: list[dict[str, object]] = []
    function_outputs: list[tuple[str, str]] = []
    pending_email_approval = PendingEmailApprovalState(
        current=PendingEmailApproval(
            approval_id="approval-123",
            openai_call_id="call-456",
            draft=EmailDraft(
                email_type="user_request",
                to="friend@example.com",
                subject="Dinner plans",
                body="Are you free tomorrow at 7?",
            ),
        )
    )

    async def fake_send_browser_event(message: dict[str, object]) -> None:
        browser_events.append(message)

    async def fake_send_function_call_output(call_id: str, output: str) -> None:
        function_outputs.append((call_id, output))

    handled = asyncio.run(
        handle_pending_email_approval(
            transcript="Don't send it",
            pending_email_approval=pending_email_approval,
            send_browser_event=fake_send_browser_event,
            send_function_call_output=fake_send_function_call_output,
        )
    )

    assert handled is True
    assert pending_email_approval.current is None
    assert browser_events == [
        {
            "type": "approval_resolved",
            "request_id": "approval-123",
            "decision": "cancelled",
        }
    ]
    assert function_outputs[0][0] == "call-456"
    assert "The user cancelled this draft by voice." in function_outputs[0][1]


def test_handle_pending_email_approval_routes_other_speech_to_revision_without_clearing_pending():
    browser_events: list[dict[str, object]] = []
    function_outputs: list[tuple[str, str]] = []
    pending_email_approval = PendingEmailApprovalState(
        current=PendingEmailApproval(
            approval_id="approval-123",
            openai_call_id="call-456",
            draft=EmailDraft(
                email_type="user_request",
                to="friend@example.com",
                subject="Dinner plans",
                body="Are you free tomorrow at 7?",
            ),
        )
    )

    async def fake_send_browser_event(message: dict[str, object]) -> None:
        browser_events.append(message)

    async def fake_send_function_call_output(call_id: str, output: str) -> None:
        function_outputs.append((call_id, output))

    handled = asyncio.run(
        handle_pending_email_approval(
            transcript="Change the subject to Updated dinner plans",
            pending_email_approval=pending_email_approval,
            send_browser_event=fake_send_browser_event,
            send_function_call_output=fake_send_function_call_output,
        )
    )

    assert handled is True
    assert pending_email_approval.current is not None
    assert pending_email_approval.current.approval_id == "approval-123"
    assert pending_email_approval.current.openai_call_id == "call-456"
    assert browser_events == []
    assert function_outputs[0][0] == "call-456"
    assert "The user wants to revise the pending draft by voice." in function_outputs[0][1]
    assert "Change the subject to Updated dinner plans" in function_outputs[0][1]


def test_handle_transcribed_user_utterance_requests_realtime_response_when_not_pending():
    browser_events: list[dict[str, object]] = []
    function_outputs: list[tuple[str, str]] = []
    openai_events: list[dict[str, object]] = []
    pending_email_approval = PendingEmailApprovalState()

    async def fake_send_browser_event(message: dict[str, object]) -> None:
        browser_events.append(message)

    async def fake_send_function_call_output(call_id: str, output: str) -> None:
        function_outputs.append((call_id, output))

    async def fake_send_openai_event(message: dict[str, object]) -> None:
        openai_events.append(message)

    asyncio.run(
        handle_transcribed_user_utterance(
            transcript="Send an email to me about tomorrow's meeting.",
            pending_email_approval=pending_email_approval,
            send_browser_event=fake_send_browser_event,
            send_function_call_output=fake_send_function_call_output,
            send_openai_event=fake_send_openai_event,
        )
    )

    assert browser_events == []
    assert function_outputs == []
    assert openai_events == [{"type": "response.create"}]


def test_handle_transcribed_user_utterance_keeps_pending_revision_flow_local():
    browser_events: list[dict[str, object]] = []
    function_outputs: list[tuple[str, str]] = []
    openai_events: list[dict[str, object]] = []
    pending_email_approval = PendingEmailApprovalState(
        current=PendingEmailApproval(
            approval_id="approval-123",
            openai_call_id="call-456",
            draft=EmailDraft(
                email_type="user_request",
                to="friend@example.com",
                subject="Dinner plans",
                body="Are you free tomorrow at 7?",
            ),
        )
    )

    async def fake_send_browser_event(message: dict[str, object]) -> None:
        browser_events.append(message)

    async def fake_send_function_call_output(call_id: str, output: str) -> None:
        function_outputs.append((call_id, output))

    async def fake_send_openai_event(message: dict[str, object]) -> None:
        openai_events.append(message)

    asyncio.run(
        handle_transcribed_user_utterance(
            transcript="Change the subject to Updated dinner plans",
            pending_email_approval=pending_email_approval,
            send_browser_event=fake_send_browser_event,
            send_function_call_output=fake_send_function_call_output,
            send_openai_event=fake_send_openai_event,
        )
    )

    assert browser_events == []
    assert openai_events == []
    assert function_outputs[0][0] == "call-456"
    assert pending_email_approval.current is not None
    assert pending_email_approval.current.approval_id == "approval-123"
