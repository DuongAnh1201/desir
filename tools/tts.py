"""
Text-to-speech output using OpenAI's TTS API.

Streams audio directly to the system's default output via sounddevice,
with no temp files needed.
"""

import asyncio
import io
import subprocess

from openai import AsyncOpenAI


async def speak(text: str) -> None:
    """Convert `text` to speech and play it through the system audio output."""
    from config import settings

    client = AsyncOpenAI(api_key=settings.openai_api_key)

    response = await client.audio.speech.create(
        model=settings.tts_model,
        voice=settings.tts_voice,
        input=text,
        response_format="mp3",
    )

    audio_bytes = response.content
    await asyncio.to_thread(_play_audio, audio_bytes)


def _play_audio(audio_bytes: bytes) -> None:
    """Play raw MP3 bytes using macOS afplay via stdin pipe."""
    subprocess.run(
        ["afplay", "-"],
        input=audio_bytes,
        check=True,
    )
