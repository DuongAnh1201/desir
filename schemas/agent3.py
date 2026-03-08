"""Schemas for the Search agent."""
from pydantic import BaseModel
from pydantic import field

class SearchRequest(BaseModel):
    query: str
    num_results: int = 10
    



class SearchResult(BaseModel):
    results: list[dict]
    summary: str
