from dataclasses import dataclass, field
from ai.prompts import load_prompt

_TOM_HISTORY = load_prompt("tombio")
@dataclass
class OrchestratorDeps:
    history_context: list[str] = field(default_factory=list)
    preferred_pronouns: str = field(default="Sir")
    name: str = field(default="Tom")
    email_address: str = field(default="tomnguyen6766@gmail.com")
    tom_history_context: str = field(default=_TOM_HISTORY)
    """History context for the orchestrator."""
