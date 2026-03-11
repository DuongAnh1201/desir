"""Schemas for the Email agent."""
from typing import Literal
from pydantic import BaseModel



class NotificationEmailRequest(BaseModel):
    recipient: str
    subject: str
    details: str
    link: str = ""
    sender_name: str = "Desir"
    api_key: str = ""
    from_address: str = "Desir <onboarding@resend.dev>"
    scheduleAt: str | None = None


class UserEmailRequest(BaseModel):
    to: str
    cc: list[str] = []
    bcc: list[str] = []
    subject: str
    body: str
    """AI-generated plain-text email body."""


class EmailRequest(BaseModel):
    email_type: Literal["notification", "user_request"]
    notification: NotificationEmailRequest | None = None
    user_request: UserEmailRequest | None = None


class EmailResult(BaseModel):
    success: bool
    message: str
