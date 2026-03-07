"""Schemas for the Email agent."""
from pydantic import BaseModel


class EmailRequest(BaseModel):
    to: str
    subject: str
    body: str


class EmailResult(BaseModel):
    success: bool
    message: str
