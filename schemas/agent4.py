"""Schemas for the Communication agent (iMessage + phone calls)."""
from typing import Literal
from pydantic import BaseModel


class iMessageRequest(BaseModel):
    recipient: str
    """Phone number or Apple ID email of the recipient."""
    body: str
    """AI-generated message content."""


class CallRequest(BaseModel):
    recipient: str
    """Phone number to call."""


class CommunicationRequest(BaseModel):
    action: Literal["imessage", "call"]
    imessage: iMessageRequest | None = None
    call: CallRequest | None = None


class CommunicationResult(BaseModel):
    success: bool
    message: str
