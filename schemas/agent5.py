from pydantic import BaseModel
from typing import Literal
class KnowledgeBaseResult(BaseModel):
    success: bool
    context: str
    message: str

class KnowledgeBaseRequest(BaseModel):
    action: Literal["create", "read", "update", "delete"]
    file_name: str
    file_content: str
    context: str

