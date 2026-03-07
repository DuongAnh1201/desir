"""Calendar sub-agent."""
from pydantic_ai import Agent

from schemas.agent2 import CalendarResult

_calendar_agent: Agent | None = None


def get_calendar_agent() -> Agent:
    global _calendar_agent
    if _calendar_agent is None:
        from config import settings

        _calendar_agent = Agent(
            model=settings.ai_model,
            name="calendar_agent",
            system_prompt=(
                "You are a calendar assistant. "
                "When given an event title and time, schedule it and confirm."
            ),
            result_type=CalendarResult,
        )

    return _calendar_agent
