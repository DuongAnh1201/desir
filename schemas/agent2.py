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
    message: str
    title: str = ""      
    start: datetime = None 
    event_id: str = ""