"""Schemas for the Search agent."""
from pydantic import BaseModel

class SearchRequest(BaseModel):
    query: str
    num_results: int = 10
    



class SearchResult(BaseModel):
    summary: str
