import asyncio
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from ai.agents.email_draft_extractor import SpokenEmailDraftExtraction
from server import (
    handle_pending_email_approval,
    handle_send_email_tool_call,
    handle_transcribed_user_utterance,
    maybe_intercept_complete_email_draft,
)
from tools.email_approval import EmailDraft


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


def test_handle_pending_email_approval_sends_email_on_voice_approval():
    browser_events: list[dict[str, object]] = []
    function_outputs: list[tuple[str, str]] = []
    pending_email_approvals = {
        "call-123": EmailDraft(
            email_type="user_request",
            to="friend@example.com",
            subject="Dinner plans",
            body="Are you free tomorrow at 7?",
        )
    }

    async def fake_send_browser_event(message: dict[str, object]) -> None:
        browser_events.append(message)

    async def fake_send_function_call_output(call_id: str, output: str) -> None:
        function_outputs.append((call_id, output))

    async def fake_execute_email(draft: EmailDraft) -> str:
        return f"Email successfully sent to {draft.to}."

    handled = asyncio.run(
        handle_pending_email_approval(
            transcript="Send it",
            pending_email_approvals=pending_email_approvals,
            send_browser_event=fake_send_browser_event,
            send_function_call_output=fake_send_function_call_output,
            execute_email=fake_execute_email,
        )
    )

    assert handled is True
    assert pending_email_approvals == {}
    assert browser_events == [
        {
            "type": "approval_resolved",
            "request_id": "call-123",
            "decision": "approved",
        }
    ]
    assert function_outputs == [("call-123", "Email successfully sent to friend@example.com.")]


def test_handle_pending_email_approval_cancels_by_voice():
    browser_events: list[dict[str, object]] = []
    function_outputs: list[tuple[str, str]] = []
    pending_email_approvals = {
        "call-123": EmailDraft(
            email_type="user_request",
            to="friend@example.com",
            subject="Dinner plans",
            body="Are you free tomorrow at 7?",
        )
    }

    async def fake_send_browser_event(message: dict[str, object]) -> None:
        browser_events.append(message)

    async def fake_send_function_call_output(call_id: str, output: str) -> None:
        function_outputs.append((call_id, output))

    handled = asyncio.run(
        handle_pending_email_approval(
            transcript="Don't send it",
            pending_email_approvals=pending_email_approvals,
            send_browser_event=fake_send_browser_event,
            send_function_call_output=fake_send_function_call_output,
        )
    )

    assert handled is True
    assert pending_email_approvals == {}
    assert browser_events == [
        {
            "type": "approval_resolved",
            "request_id": "call-123",
            "decision": "cancelled",
        }
    ]
    assert function_outputs[0][0] == "call-123"
    assert "The user cancelled this draft by voice." in function_outputs[0][1]


def test_handle_pending_email_approval_routes_other_speech_to_revision():
    browser_events: list[dict[str, object]] = []
    function_outputs: list[tuple[str, str]] = []
    pending_email_approvals = {
        "call-123": EmailDraft(
            email_type="user_request",
            to="friend@example.com",
            subject="Dinner plans",
            body="Are you free tomorrow at 7?",
        )
    }

    async def fake_send_browser_event(message: dict[str, object]) -> None:
        browser_events.append(message)

    async def fake_send_function_call_output(call_id: str, output: str) -> None:
        function_outputs.append((call_id, output))

    handled = asyncio.run(
        handle_pending_email_approval(
            transcript="Change the subject to Updated dinner plans",
            pending_email_approvals=pending_email_approvals,
            send_browser_event=fake_send_browser_event,
            send_function_call_output=fake_send_function_call_output,
        )
    )

    assert handled is True
    assert pending_email_approvals == {}
    assert browser_events == []
    assert function_outputs[0][0] == "call-123"
    assert "The user wants to revise the pending draft by voice." in function_outputs[0][1]
    assert "Change the subject to Updated dinner plans" in function_outputs[0][1]


def test_maybe_intercept_complete_email_draft_emits_approval_request():
    browser_events: list[dict[str, object]] = []
    function_outputs: list[tuple[str, str]] = []
    pending_email_approvals: dict[str, object] = {}

    async def fake_send_browser_event(message: dict[str, object]) -> None:
        browser_events.append(message)

    async def fake_send_function_call_output(call_id: str, output: str) -> None:
        function_outputs.append((call_id, output))

    async def fake_extractor(transcript: str, default_email_address: str) -> SpokenEmailDraftExtraction:
        assert transcript == "Send an email to friend@example.com. Subject: Status update. Body: I'm not feeling good."
        assert default_email_address == "tomnguyen6766@gmail.com"
        return SpokenEmailDraftExtraction(
            is_email_intent=True,
            is_complete=True,
            email_type="user_request",
            to="friend@example.com",
            subject="Status update",
            body="I'm not feeling good.",
            reason="complete_user_email",
        )

    handled = asyncio.run(
        maybe_intercept_complete_email_draft(
            transcript="Send an email to friend@example.com. Subject: Status update. Body: I'm not feeling good.",
            default_email_address="tomnguyen6766@gmail.com",
            pending_email_approvals=pending_email_approvals,
            send_browser_event=fake_send_browser_event,
            send_function_call_output=fake_send_function_call_output,
            extractor=fake_extractor,
            call_id_factory=lambda: "voice-email-123",
        )
    )

    assert handled is True
    assert function_outputs == []
    assert len(browser_events) == 1
    assert browser_events[0]["type"] == "approval_request"
    assert browser_events[0]["request"]["id"] == "voice-email-123"
    assert browser_events[0]["request"]["preview"]["to"] == "friend@example.com"
    assert browser_events[0]["request"]["preview"]["subject"] == "Status update"
    assert browser_events[0]["request"]["preview"]["body"] == "I'm not feeling good."
    assert "voice-email-123" in pending_email_approvals


def test_maybe_intercept_complete_email_draft_resolves_send_it_to_me_alias():
    browser_events: list[dict[str, object]] = []
    function_outputs: list[tuple[str, str]] = []
    pending_email_approvals: dict[str, object] = {}

    async def fake_send_browser_event(message: dict[str, object]) -> None:
        browser_events.append(message)

    async def fake_send_function_call_output(call_id: str, output: str) -> None:
        function_outputs.append((call_id, output))

    async def fake_extractor(transcript: str, default_email_address: str) -> SpokenEmailDraftExtraction:
        return SpokenEmailDraftExtraction(
            is_email_intent=True,
            is_complete=True,
            email_type="user_request",
            to="me",
            subject="I'm not feeling good",
            body="I'm not feeling good.",
            reason="recipient_alias_default_email",
        )

    handled = asyncio.run(
        maybe_intercept_complete_email_draft(
            transcript="Send it to me. Subject: I'm not feeling good. Body: I'm not feeling good.",
            default_email_address="tomnguyen6766@gmail.com",
            pending_email_approvals=pending_email_approvals,
            send_browser_event=fake_send_browser_event,
            send_function_call_output=fake_send_function_call_output,
            extractor=fake_extractor,
            call_id_factory=lambda: "voice-email-456",
        )
    )

    assert handled is True
    assert function_outputs == []
    assert browser_events[0]["request"]["preview"]["to"] == "tomnguyen6766@gmail.com"
    assert pending_email_approvals["voice-email-456"].to == "tomnguyen6766@gmail.com"


def test_maybe_intercept_complete_email_draft_skips_incomplete_email_intent():
    browser_events: list[dict[str, object]] = []
    function_outputs: list[tuple[str, str]] = []
    pending_email_approvals: dict[str, object] = {}

    async def fake_send_browser_event(message: dict[str, object]) -> None:
        browser_events.append(message)

    async def fake_send_function_call_output(call_id: str, output: str) -> None:
        function_outputs.append((call_id, output))

    async def fake_extractor(transcript: str, default_email_address: str) -> SpokenEmailDraftExtraction:
        return SpokenEmailDraftExtraction(
            is_email_intent=True,
            is_complete=False,
            email_type="user_request",
            to="friend@example.com",
            reason="missing_subject_and_body",
        )

    handled = asyncio.run(
        maybe_intercept_complete_email_draft(
            transcript="Send an email to friend@example.com",
            default_email_address="tomnguyen6766@gmail.com",
            pending_email_approvals=pending_email_approvals,
            send_browser_event=fake_send_browser_event,
            send_function_call_output=fake_send_function_call_output,
            extractor=fake_extractor,
        )
    )

    assert handled is False
    assert browser_events == []
    assert function_outputs == []
    assert pending_email_approvals == {}


def test_maybe_intercept_complete_email_draft_skips_non_email_utterance():
    browser_events: list[dict[str, object]] = []
    function_outputs: list[tuple[str, str]] = []
    pending_email_approvals: dict[str, object] = {}

    async def fake_send_browser_event(message: dict[str, object]) -> None:
        browser_events.append(message)

    async def fake_send_function_call_output(call_id: str, output: str) -> None:
        function_outputs.append((call_id, output))

    async def fake_extractor(transcript: str, default_email_address: str) -> SpokenEmailDraftExtraction:
        return SpokenEmailDraftExtraction(
            is_email_intent=False,
            is_complete=False,
            email_type="unknown",
            reason="not_an_email_request",
        )

    handled = asyncio.run(
        maybe_intercept_complete_email_draft(
            transcript="What's on my calendar tomorrow?",
            default_email_address="tomnguyen6766@gmail.com",
            pending_email_approvals=pending_email_approvals,
            send_browser_event=fake_send_browser_event,
            send_function_call_output=fake_send_function_call_output,
            extractor=fake_extractor,
        )
    )

    assert handled is False
    assert browser_events == []
    assert function_outputs == []
    assert pending_email_approvals == {}


def test_handle_transcribed_user_utterance_does_not_request_realtime_response_when_intercepted():
    browser_events: list[dict[str, object]] = []
    function_outputs: list[tuple[str, str]] = []
    openai_events: list[dict[str, object]] = []
    pending_email_approvals: dict[str, object] = {}

    async def fake_send_browser_event(message: dict[str, object]) -> None:
        browser_events.append(message)

    async def fake_send_function_call_output(call_id: str, output: str) -> None:
        function_outputs.append((call_id, output))

    async def fake_send_openai_event(message: dict[str, object]) -> None:
        openai_events.append(message)

    async def fake_interceptor(**_: object) -> bool:
        return True

    asyncio.run(
        handle_transcribed_user_utterance(
            transcript="Send it to me. Subject: I'm not feeling good. Body: I'm not feeling good.",
            default_email_address="tomnguyen6766@gmail.com",
            pending_email_approvals=pending_email_approvals,
            send_browser_event=fake_send_browser_event,
            send_function_call_output=fake_send_function_call_output,
            send_openai_event=fake_send_openai_event,
            email_draft_interceptor=fake_interceptor,
        )
    )

    assert browser_events == []
    assert function_outputs == []
    assert openai_events == []
