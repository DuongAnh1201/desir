from typing import Literal
from pydantic import BaseModel


class OrchestratorResult(BaseModel):
    intent: Literal["email", "calendar", "search", "zalo", "unknown"]
    response: str
    """Human-readable reply shown to the user."""
