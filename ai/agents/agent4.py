"""Communication sub-agent — iMessage and phone calls."""
from pydantic_ai import Agent, RunContext

from ai.prompts import load_prompt
from ai.agents.deps import OrchestratorDeps
from schemas.agent4 import CommunicationRequest, CommunicationResult

_communication_agent: Agent | None = None


def get_communication_agent() -> Agent:
    global _communication_agent
    if _communication_agent is None:
        from config import settings

        _communication_agent = Agent(
            model=settings.ai_model,
            name="communication_agent",
            system_prompt=load_prompt("communication_agent"),
            output_type=CommunicationResult,
            deps_type=OrchestratorDeps,
        )

        @_communication_agent.tool
        async def send_imessage(
            ctx: RunContext[OrchestratorDeps], request: CommunicationRequest
        ) -> str:
            """Send an iMessage to a contact."""
            from tools.communication import send_imessage as _send
            msg = request.imessage
            success = _send(recipient=msg.recipient, body=msg.body)
            if success:
                return f"iMessage sent to {msg.recipient}."
            else:
                return f"Failed to send iMessage to {msg.recipient}."

        @_communication_agent.tool
        async def make_call(
            ctx: RunContext[OrchestratorDeps], request: CommunicationRequest
        ) -> str:
            """Initiate a phone call to a contact."""
            from tools.communication import make_call as _call
            call = request.call
            success = _call(recipient=call.recipient)
            if success:
                return f"Calling {call.recipient}..."
            else:
                return f"Failed to initiate call to {call.recipient}."

        @_communication_agent.tool
        async def search_contact(ctx: RunContext[OrchestratorDeps], name: str) -> list[dict]:
            """Search macOS Contacts by name and return matching entries with phone numbers."""
            from tools.communication import search_contact as _search
            results = _search(name)
            if not results:
                return [{"name": name, "phone": "No contacts found."}]
            return results

    return _communication_agent
