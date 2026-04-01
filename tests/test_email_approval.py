from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from schemas.agent1 import NotificationEmailRequest
from tools.email_approval import (
    EmailDraft,
    build_email_approval_request,
    build_revision_output,
    execute_email_draft,
    merge_edited_email_draft,
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
    assert request["approveLabel"] == "Approve"
    assert request["editLabel"] == "Edit"
    assert request["cancelLabel"] == "Reject"
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


def test_merge_edited_email_draft_uses_manual_overrides():
    draft = EmailDraft(
        email_type="user_request",
        to="friend@example.com",
        subject="Dinner plans",
        body="Are you free tomorrow at 7?",
    )

    edited = merge_edited_email_draft(
        draft,
        {
            "subject": "Updated dinner plans",
            "body": "Can we move this to 8 instead?",
        },
    )

    assert edited.email_type == "user_request"
    assert edited.to == "friend@example.com"
    assert edited.subject == "Updated dinner plans"
    assert edited.body == "Can we move this to 8 instead?"


def test_build_revision_output_preserves_draft_context():
    draft = EmailDraft(
        email_type="user_request",
        to="friend@example.com",
        subject="Dinner plans",
        body="Are you free tomorrow at 7?",
    )

    output = build_revision_output(draft, "cancelled")

    assert "Email not sent." in output
    assert "The user rejected this draft." in output
    assert "To: friend@example.com" in output
    assert "Subject: Dinner plans" in output
    assert "Are you free tomorrow at 7?" in output
