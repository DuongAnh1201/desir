from pydantic import BaseModel


class TranscriptData(BaseModel):
    text: str
    confidence: float = 1.0
