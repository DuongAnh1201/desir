import re
from dataclasses import dataclass
from typing import Any, Callable, Literal, Mapping

from schemas.agent1 import NotificationEmailRequest

EmailType = Literal["notification", "user_request"]
ApprovalDecision = Literal["approved", "cancelled"]
PendingEmailTranscriptIntent = Literal["approved", "cancelled", "revised"]

APPROVE_COMMANDS = {
    "approve",
    "approve it",
    "send",
    "send it",
    "send the email",
    "yes send it",
    "looks good send it",
}

CANCEL_COMMANDS = {
    "cancel",
    "cancel it",
    "cancel the email",
    "discard it",
    "dont send it",
    "do not send it",
}


@dataclass(slots=True)
class EmailDraft:
    email_type: EmailType
    to: str
    subject: str
    body: str
    link: str = ""

    @classmethod
    def from_tool_args(cls, args: Mapping[str, Any]) -> "EmailDraft":
        email_type = str(args.get("email_type") or "").strip()
        if email_type not in {"notification", "user_request"}:
            raise ValueError("email_type must be 'notification' or 'user_request'.")

        to = str(args.get("to") or "").strip()
        subject = str(args.get("subject") or "").strip()
        body = str(args.get("body") or "").strip()
        link = str(args.get("link") or "").strip()

        if not to:
            raise ValueError("Recipient email address is required.")
        if not subject:
            raise ValueError("Email subject is required.")
        if not body:
            raise ValueError("Email body is required.")

        return cls(
            email_type=email_type,
            to=to,
            subject=subject,
            body=body,
            link=link,
        )

    def as_preview(self) -> dict[str, str | None]:
        return {
            "to": self.to,
            "subject": self.subject,
            "body": self.body,
            "emailType": self.email_type,
            "link": self.link or None,
        }

    def as_tool_args(self) -> dict[str, str]:
        return {
            "email_type": self.email_type,
            "to": self.to,
            "subject": self.subject,
            "body": self.body,
            "link": self.link,
        }


def build_email_approval_request(call_id: str, draft: EmailDraft) -> dict[str, Any]:
    email_label = "Notification email" if draft.email_type == "notification" else "Outgoing email"
    return {
        "id": call_id,
        "toolName": "send_email",
        "title": "Voice Email Review",
        "summary": f"{email_label} to {draft.to}",
        "detail": (
            "Review the exact subject and body below. "
            "Say 'send it', 'cancel it', or describe what should change."
        ),
        "preview": draft.as_preview(),
    }


def normalize_voice_command(transcript: str) -> str:
    normalized = re.sub(r"[^a-z0-9\s]", "", transcript.lower())
    return " ".join(normalized.split())


def classify_pending_email_transcript(transcript: str) -> PendingEmailTranscriptIntent:
    normalized = normalize_voice_command(transcript)
    if normalized in APPROVE_COMMANDS:
        return "approved"
    if normalized in CANCEL_COMMANDS:
        return "cancelled"
    return "revised"


def execute_email_draft(
    draft: EmailDraft,
    notification_sender: Callable[[NotificationEmailRequest], str] | None = None,
    user_sender: Callable[..., str] | None = None,
    resend_api_key: str | None = None,
    from_address: str | None = None,
) -> str:
    if (
        notification_sender is None
        or user_sender is None
        or resend_api_key is None
        or from_address is None
    ):
        from config import settings
        from tools.sending_email import (
            send_notification_email as default_notification_sender,
            send_user_email as default_user_sender,
        )

        notification_sender = notification_sender or default_notification_sender
        user_sender = user_sender or default_user_sender
        resend_api_key = resend_api_key or settings.resend_api_key
        from_address = from_address or settings.resend_from

    if draft.email_type == "notification":
        result = notification_sender(
            NotificationEmailRequest(
                recipient=draft.to,
                subject=draft.subject,
                details=draft.body,
                link=draft.link,
                api_key=resend_api_key,
                from_address=from_address,
            )
        )
    else:
        result = user_sender(
            recipient=draft.to,
            subject=draft.subject,
            body=draft.body,
            api_key=resend_api_key,
            from_address=from_address,
        )

    if result == "ok":
        return f"Email successfully sent to {draft.to}."

    return f"Failed to send email to {draft.to}. Do not say it was sent. Reason: {result}"


def build_cancellation_output(draft: EmailDraft) -> str:
    lines = [
        "Email not sent.",
        "The user cancelled this draft by voice.",
        "Acknowledge the cancellation briefly and wait for the next instruction.",
        "Cancelled draft:",
        f"To: {draft.to}",
        f"Subject: {draft.subject}",
    ]
    return "\n".join(lines)


def build_revision_output(draft: EmailDraft, revision_request: str) -> str:
    lines = [
        "Email not sent yet.",
        "The user wants to revise the pending draft by voice.",
        (
            "Update the current draft using the revision request below and call "
            "`send_email` again once recipient, subject, and body are ready."
        ),
        "Current draft:",
        f"To: {draft.to}",
        f"Subject: {draft.subject}",
        "Body:",
        draft.body,
        "Revision request:",
        revision_request.strip(),
    ]
    if draft.link:
        lines.append(f"Link: {draft.link}")
    return "\n".join(lines)
