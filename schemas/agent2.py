"""Schemas for the Calendar agent."""
from datetime import datetime
from pydantic import BaseModel


class CalendarRequest(BaseModel):
    title: str
    start: datetime
    end: datetime
    description: str = ""


class CalendarResult(BaseModel):
    success: bool
    event_id: str = ""
    message: str
