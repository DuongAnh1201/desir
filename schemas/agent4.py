"""Schemas for the Zalo agent."""
from enum import Enum
from pydantic import BaseModel


class ZaloRequest(BaseModel):
    recipient: str
    action: str
    content: str

class ZaloAction(Enum):
    Call = "call"
    Message = "message"
    Unknown = "unknown"



class ZaloResult(BaseModel):
    success: bool
    message: str
