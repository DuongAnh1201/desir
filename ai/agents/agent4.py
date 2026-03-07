"""Zalo sub-agent."""
from pydantic_ai import Agent

from schemas.agent4 import ZaloResult

_zalo_agent: Agent | None = None


def get_zalo_agent() -> Agent:
    global _zalo_agent
    if _zalo_agent is None:
        from config import settings

        _zalo_agent = Agent(
            model=settings.ai_model,
            name="zalo_agent",
            system_prompt=(
                "You are a Zalo messaging assistant. "
                "When given a recipient and message, send it via Zalo and confirm."
            ),
            result_type=ZaloResult,
        )

    return _zalo_agent
