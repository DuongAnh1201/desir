"""
config.py — Application settings loaded from environment variables.

Usage anywhere in the project:
    from config import settings

    model = settings.ai_model
    key   = settings.serper_api_key
"""

from pydantic_settings import SettingsConfigDict
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider
from dotenv import load_dotenv
import os
load_dotenv()

class Settings():
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",  # silently ignore unrecognised env vars
    )

    env: str = os.getenv("LOGFIRE_ENVIRONMENT")

    # ── LLM ────────────────────────────────────────────────────────────────────
    ai_model: str = os.getenv("AI_MODEL")
    """PydanticAI model string. Examples:
       'google-gla:gemini-1.5-pro'   (Google Gemini via Generative Language API)
       'openai:gpt-4o'               (OpenAI)
    """
    # -- Realtime Audio ────────────────────────────────────────────────────────
    realtime_model: str = os.getenv("REALTIME_MODEL", "gpt-4o-mini-realtime-preview")
    """OpenAI Realtime model for native audio I/O."""

    realtime_voice: str = os.getenv("REALTIME_VOICE", "nova")
    """Realtime voice. Options: alloy, ash, ballad, coral, echo, sage, shimmer, verse."""
    base_url: str = os.getenv("BASE_URL")
    """Base URL for the API."""

    api_key: str = os.getenv("API_KEY")
    """API key for the API."""

    # ── API Keys ────────────────────────────────────────────────────────────────
    openai_api_key: str = os.getenv("OPENAI_API_KEY")
    """Required when ai_model starts with 'openai:'."""

    serper_api_key: str = os.getenv("SERPER_API_KEY")
    """Required for live event search in Agent 2 (Phase 4+)."""

    resend_api_key: str = os.getenv("RESEND_API_KEY", "")
    """Resend API key for sending emails."""

    resend_from: str = os.getenv("RESEND_FROM", "Desir <onboarding@resend.dev>")
    """Sender address. Use a verified domain in production."""

    logfire_token: str
    """Required for Logfire integration."""
    model = OpenAIChatModel(
        'gemma4:e4b',
        provider=OpenAIProvider(
            base_url=base_url,
            api_key=api_key,
        )
    )


# Singleton — import this everywhere instead of instantiating Settings() yourself.
settings = Settings()
