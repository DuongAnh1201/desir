from typing import Literal

from pydantic import BaseModel
from pydantic_ai import Agent

from ai.prompts import load_prompt
from ai.agents.deps import OrchestratorDeps


class OrchestratorResult(BaseModel):
    intent: Literal["email", "calendar", "search", "communication", "knowledge", "unknown"]
    response: str
    """Human-readable reply shown to the user."""

_orchestrator: Agent | None = None


def get_orchestrator() -> Agent:
    global _orchestrator
    if _orchestrator is None:
        from config import settings

        _orchestrator = Agent(
            model=settings.ai_model,
            name="orchestrator",
            system_prompt=load_prompt("orchestrator"),
            output_type=OrchestratorResult,
            deps_type=OrchestratorDeps,
        )

        @_orchestrator.tool
        async def delegate_email(ctx, to: str, subject: str, body: str, email_type: str = "user_request", link: str = "") -> str:
            """Delegate an email-sending request to the email sub-agent.
            email_type must be 'notification' (styled HTML) or 'user_request' (plain text).
            """
            from ai.agents.agent1 import get_email_agent
            prompt = f"Send a {email_type} email to {to} with subject '{subject}': {body}"
            if link:
                prompt += f"\nLink: {link}"
            result = await get_email_agent().run(prompt, deps=ctx.deps)
            return result.output.message

        @_orchestrator.tool
        async def delegate_calendar(ctx, request: str) -> str:
            """Delegate any calendar request to the calendar sub-agent.
            Pass the full user request as-is, including event IDs from ctx.deps.calendar_event_ids when available.
            Known event IDs are injected automatically.
            """
            from datetime import datetime
            from ai.agents.agent2 import get_calendar_agent
            known_ids = ctx.deps.calendar_event_ids
            now = datetime.now().strftime("%Y-%m-%d %H:%M (%A)")
            prompt = f"[Current date and time: {now}]\n\n{request}"
            if known_ids:
                prompt += f"\n\nKnown event IDs: {known_ids}"
            result = await get_calendar_agent().run(prompt, deps=ctx.deps)
            # Save any returned event_id under the event title for future use
            if result.output.event_id and result.output.title:
                ctx.deps.calendar_event_ids[result.output.title] = result.output.event_id
            return result.output.message

        @_orchestrator.tool
        async def delegate_search(ctx, query: str) -> str:
            """Delegate a web search to the search sub-agent."""
            from ai.agents.agent3 import get_search_agent
            result = await get_search_agent().run(query, deps=ctx.deps)
            return result.output.summary

        @_orchestrator.tool
        async def delegate_communication(ctx, recipient: str, action: str, message: str = "") -> str:
            """Delegate an iMessage or phone call to the communication sub-agent."""
            from ai.agents.agent4 import get_communication_agent
            prompt = (
                f"Call {recipient}"
                if action == "call"
                else f"Send iMessage to {recipient}: {message}"
            )
            result = await get_communication_agent().run(prompt, deps=ctx.deps)
            return result.output.message

        @_orchestrator.tool
        async def delegate_knowledge_base(ctx, request: str) -> str:
            """Delegate a knowledge base operation to the knowledge base sub-agent.
            Use for saving, retrieving, updating, or linking information.
            Pass the full user request as-is.
            """
            from ai.agents.agent5 import get_knowledge_base_agent
            result = await get_knowledge_base_agent().run(request, deps=ctx.deps)
            return result.output.message

    return _orchestrator
