"""Email sub-agent."""
import asyncio
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
            model=settings.model,
            name="email_agent",
            system_prompt=_SYSTEM_PROMPT,
            output_type=EmailResult,
            deps_type=OrchestratorDeps,
        )

        @_email_agent.tool
        async def send_email(ctx: RunContext[OrchestratorDeps], request: EmailRequest) -> str:
            """Send an email — either a styled HTML notification or a plain user-composed email."""
            from config import settings
            from tools.sending_email import send_notification_email, send_user_email

            api_key = settings.resend_api_key
            from_address = settings.resend_from

            if request.email_type == "notification":
                n = request.notification
                n.api_key = api_key
                n.from_address = from_address
                result = await asyncio.to_thread(send_notification_email, n)
                target = n.recipient
            else:
                u = request.user_request
                result = await asyncio.to_thread(
                    send_user_email,
                    recipient=u.to,
                    subject=u.subject,
                    body=u.body,
                    api_key=api_key,
                    from_address=from_address,
                )
                target = u.to

            if result == "ok":
                return f"Email successfully sent to {target}."
            else:
                return f"Failed to send email to {target}. Do not retry. Reason: {result}"

        @_email_agent.tool
        async def register_domain(ctx: RunContext[OrchestratorDeps], domain_name: str) -> str:
            """Register a sending domain with Resend and return the DNS records to configure."""
            from tools.sending_email import add_domain
            try:
                domain = await asyncio.to_thread(add_domain, domain_name)
                records = domain.records if hasattr(domain, "records") else domain.get("records", [])
                lines = [f"Domain '{domain_name}' added (ID: {domain.id if hasattr(domain, 'id') else domain.get('id')})."]
                lines.append("Add these DNS records at your registrar:")
                for r in records:
                    rec = r if isinstance(r, dict) else vars(r)
                    lines.append(f"  {rec.get('type')} {rec.get('name')} → {rec.get('value')}")
                return "\n".join(lines)
            except Exception as e:
                return f"Failed to register domain: {e}"

    return _email_agent

if __name__ == "__main__":
    async def main():
        agent = get_email_agent()
        result = await agent.run("send an notification email to tomnguyen6766@gmail.com with subject 'Hello' and body 'Hello, how are you?'")
        print(result.output.message)

    asyncio.run(main())