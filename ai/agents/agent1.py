"""Email sub-agent."""
from pydantic_ai import Agent
from ai.agents.deps import OrchestratorDeps
from pydantic_ai import RunContext
from schemas.agent1 import EmailResult, EmailRequest
from ai.prompts import load_prompt

_email_agent: Agent | None = None

_SYSTEM_PROMPT = load_prompt("email_agent")
def get_email_agent() -> Agent:
    global _email_agent
    if _email_agent is None:
        from config import settings

        _email_agent = Agent(
            model=settings.ai_model,
            name="email_agent",
            system_prompt= _SYSTEM_PROMPT,
            result_type=EmailResult,
        )
        @_email_agent.tool
        async def send_email(ctx: RunContext[OrchestratorDeps], request: EmailRequest) -> str:
            """Send an email."""
            from tools.sending_email import send_email
            send_email(
                recipient=request.to,
                subject=request.subject,
                body=request.body,
            )
            return f"Email sent to {request.to} with subject '{request.subject}': {request.body}"

    return _email_agent
