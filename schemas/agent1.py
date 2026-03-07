"""Schemas for the Email agent."""
from typing import Literal
from pydantic import BaseModel


class NotificationEmailRequest(BaseModel):
    to: str
    subject: str
    details: str
    """AI-generated content describing the notification."""
    link: str = ""
    """Optional call-to-action link."""
    sender_name: str = "Desir"


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
