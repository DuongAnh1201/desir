from dataclasses import dataclass, field


@dataclass
class OrchestratorDeps:
    search_api_key: str = field(default="")
    """Serper API key for the Google Search sub-agent."""
    history_context: list[str] = field(default_factory=list)
    """History context for the orchestrator."""
    