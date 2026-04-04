from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from schemas.agent1 import NotificationEmailRequest
from tools.email_approval import (
    EmailDraft,
    build_cancellation_output,
    build_email_approval_request,
    build_revision_output,
    classify_pending_email_transcript,
    execute_email_draft,
)


def test_email_draft_from_tool_args_validates_required_fields():
    try:
        EmailDraft.from_tool_args(
            {
                "email_type": "user_request",
                "to": "friend@example.com",
                "subject": "",
                "body": "Hello there",
            }
        )
    except ValueError as error:
        assert str(error) == "Email subject is required."
    else:
        raise AssertionError("Expected EmailDraft.from_tool_args to reject an empty subject.")


def test_build_email_approval_request_includes_preview_payload():
    draft = EmailDraft(
        email_type="user_request",
        to="friend@example.com",
        subject="Dinner plans",
        body="Are you free tomorrow at 7?",
    )

    request = build_email_approval_request("call-123", draft)

    assert request["id"] == "call-123"
    assert request["toolName"] == "send_email"
    assert request["title"] == "Voice Email Review"
    assert "Say 'send it', 'cancel it'" in request["detail"]
    assert request["preview"] == {
        "to": "friend@example.com",
        "subject": "Dinner plans",
        "body": "Are you free tomorrow at 7?",
        "emailType": "user_request",
        "link": None,
    }


def test_execute_email_draft_uses_user_sender():
    calls: list[dict[str, str]] = []

    def fake_user_sender(**kwargs: str) -> str:
        calls.append(kwargs)
        return "ok"

    result = execute_email_draft(
        EmailDraft(
            email_type="user_request",
            to="friend@example.com",
            subject="Dinner plans",
            body="Are you free tomorrow at 7?",
        ),
        user_sender=fake_user_sender,
        notification_sender=lambda _: "unused",
        resend_api_key="test-key",
        from_address="Desir <hello@example.com>",
    )

    assert result == "Email successfully sent to friend@example.com."
    assert calls == [
        {
            "recipient": "friend@example.com",
            "subject": "Dinner plans",
            "body": "Are you free tomorrow at 7?",
            "api_key": "test-key",
            "from_address": "Desir <hello@example.com>",
        }
    ]


def test_execute_email_draft_uses_notification_sender():
    calls: list[NotificationEmailRequest] = []

    def fake_notification_sender(payload: NotificationEmailRequest) -> str:
        calls.append(payload)
        return "provider timeout"

    result = execute_email_draft(
        EmailDraft(
            email_type="notification",
            to="tom@example.com",
            subject="Build finished",
            body="Your nightly build is complete.",
            link="https://example.com/build/123",
        ),
        notification_sender=fake_notification_sender,
        user_sender=lambda **_: "unused",
        resend_api_key="test-key",
        from_address="Desir <hello@example.com>",
    )

    assert result == (
        "Failed to send email to tom@example.com. "
        "Do not say it was sent. Reason: provider timeout"
    )
    assert len(calls) == 1
    assert calls[0].recipient == "tom@example.com"
    assert calls[0].subject == "Build finished"
    assert calls[0].details == "Your nightly build is complete."
    assert calls[0].link == "https://example.com/build/123"


def test_classify_pending_email_transcript_uses_explicit_commands():
    assert classify_pending_email_transcript("Send it") == "approved"
    assert classify_pending_email_transcript("Don't send it.") == "cancelled"
    assert classify_pending_email_transcript("Change the subject to PTO request") == "revised"


def test_build_revision_output_preserves_draft_context_and_revision_request():
    draft = EmailDraft(
        email_type="user_request",
        to="friend@example.com",
        subject="Dinner plans",
        body="Are you free tomorrow at 7?",
    )

    output = build_revision_output(draft, "Change the subject to Updated dinner plans")

    assert "Email not sent yet." in output
    assert "The user wants to revise the pending draft by voice." in output
    assert "To: friend@example.com" in output
    assert "Subject: Dinner plans" in output
    assert "Are you free tomorrow at 7?" in output
    assert "Change the subject to Updated dinner plans" in output


def test_build_cancellation_output_stops_the_revision_loop():
    draft = EmailDraft(
        email_type="user_request",
        to="friend@example.com",
        subject="Dinner plans",
        body="Are you free tomorrow at 7?",
    )

    output = build_cancellation_output(draft)

    assert "Email not sent." in output
    assert "The user cancelled this draft by voice." in output
    assert "wait for the next instruction" in output
