"""Schemas for the Calendar agent."""
from datetime import datetime
from pydantic import BaseModel

class CalendarEvents(BaseModel):
    calendarname: str = "tomnguyen6766@gmail.com"
    fromdate: str 
    todate: str
    query: str

 

class CalendarRequest(BaseModel):
    calendarName: str = "tomnguyen6766@gmail.com"
    title: str = ""
    id: str = ""
    start: datetime | None = None
    end: datetime | None = None
    description: str = ""


class CalendarResult(BaseModel):
    success: bool
    message: str
    title: str = ""      
    start: datetime = None 
    event_id: str = ""