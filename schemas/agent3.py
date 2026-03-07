"""Schemas for the Search agent."""
from pydantic import BaseModel
from pydantic import field

class SearchRequest(BaseModel):
    query: str
    num_results: int = 10
    previous_context: list[str] = field(default_factory=list)
    previous_results: list[dict] = field(default_factory=list)



class SearchResult(BaseModel):
    results: list[dict]
    summary: str
