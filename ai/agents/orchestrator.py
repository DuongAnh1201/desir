from pydantic_ai import Agent

from ai.prompts import load_prompt
from ai.agents.deps import OrchestratorDeps
from schemas.orchestrator import OrchestratorResult

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
        async def delegate_email(ctx, to: str, subject: str, body: str) -> str:
            """Delegate an email-sending request to the email sub-agent."""
            from ai.agents.agent1 import get_email_agent
            result = await get_email_agent().run(
                f"Send email to {to} with subject '{subject}': {body}",
                deps=ctx.deps,
            )
            return result.output.message

        @_orchestrator.tool
        async def delegate_calendar(ctx, title: str, when: str, details: str = "") -> str:
            """Delegate a calendar scheduling request to the calendar sub-agent."""
            from ai.agents.agent2 import get_calendar_agent
            result = await get_calendar_agent().run(
                f"Create event '{title}' at {when}. Details: {details}"
            )
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

    return _orchestrator
