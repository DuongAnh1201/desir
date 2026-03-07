"""Email sub-agent."""
from pydantic_ai import Agent, RunContext
from ai.agents.deps import OrchestratorDeps
from schemas.agent1 import EmailRequest, EmailResult
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
            system_prompt=_SYSTEM_PROMPT,
            result_type=EmailResult,
            deps_type=OrchestratorDeps,
        )

        @_email_agent.tool
        async def send_email(ctx: RunContext[OrchestratorDeps], request: EmailRequest) -> str:
            """Send an email — either a styled HTML notification or a plain user-composed email."""
            from config import settings
            from tools.sending_email import send_notification_email, send_user_email

            password = settings.email_password

            if request.email_type == "notification":
                n = request.notification
                success = send_notification_email(
                    recipient=n.to,
                    subject=n.subject,
                    details=n.details,
                    link=n.link,
                    sender_name=n.sender_name,
                    password=password,
                )
                target = n.to
            else:
                u = request.user_request
                success = send_user_email(
                    recipient=u.to,
                    subject=u.subject,
                    body=u.body,
                    password=password,
                )
                target = u.to

            if success:
                return f"Email successfully sent to {target}."
            else:
                return f"Failed to send email to {target}."

    return _email_agent
