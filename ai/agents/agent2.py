"""Calendar sub-agent."""
from pydantic_ai import Agent, RunContext
from ai.agents.deps import OrchestratorDeps
from schemas.agent2 import CalendarResult, CalendarRequest
from ai.prompts import load_prompt
from pydantic_ai import RunContext
_calendar_agent: Agent | None = None


def get_calendar_agent() -> Agent:
    global _calendar_agent
    if _calendar_agent is None:
        from config import settings

        _calendar_agent = Agent(
            model=settings.ai_model,
            name="calendar_agent",
            system_prompt=load_prompt("calendar_agent"),
            output_type=CalendarResult, 
        )

        @_calendar_agent.tool
        async def create_calendar_event(
            ctx: RunContext[OrchestratorDeps],
            req: CalendarRequest
        ) -> str:
            print(f"Make appointment: {req.title} from {req.start} ---")
            return f"Successfully scheduled '{req.title}' at {req.start}"

    return _calendar_agent