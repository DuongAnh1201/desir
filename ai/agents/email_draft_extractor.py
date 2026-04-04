from typing import Literal

from pydantic import BaseModel
from pydantic_ai import Agent

from ai.prompts import load_prompt

_email_draft_extractor: Agent | None = None


class SpokenEmailDraftExtraction(BaseModel):
    is_email_intent: bool = False
    is_complete: bool = False
    email_type: Literal["notification", "user_request", "unknown"] = "unknown"
    to: str = ""
    subject: str = ""
    body: str = ""
    link: str = ""
    reason: str = ""


def normalize_email_recipient(recipient: str, default_email_address: str) -> str:
    normalized = recipient.strip()
    if not normalized:
        return normalized

    alias = normalized.casefold()
    if alias in {
        "me",
        "myself",
        "my email",
        "my email address",
        "my inbox",
        "me please",
    }:
        return default_email_address

    return normalized


def get_email_draft_extractor() -> Agent:
    global _email_draft_extractor
    if _email_draft_extractor is None:
        from config import settings

        _email_draft_extractor = Agent(
            model=settings.ai_model,
            name="email_draft_extractor",
            system_prompt=load_prompt("email_draft_extractor"),
            output_type=SpokenEmailDraftExtraction,
        )

    return _email_draft_extractor


async def extract_spoken_email_draft(
    transcript: str,
    default_email_address: str,
) -> SpokenEmailDraftExtraction:
    prompt = (
        f"Default personal email address: {default_email_address}\n"
        f"Transcript: {transcript.strip()}"
    )
    result = await get_email_draft_extractor().run(prompt)
    extraction = result.output
    extraction.to = normalize_email_recipient(extraction.to, default_email_address)
    return extraction
