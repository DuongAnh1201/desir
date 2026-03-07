"""
Voice recognition module.

Captures audio from the microphone and transcribes it using OpenAI's
Whisper-compatible STT API (gpt-4o-mini-transcribe).
"""

import asyncio
import io
import wave

import sounddevice as sd
from openai import AsyncOpenAI


async def listen() -> str:
    """Record a voice utterance and return the transcribed text."""
    from config import settings

    sample_rate = 16_000
    duration = 5  # seconds

    print("[voice] Listening...", end=" ", flush=True)
    audio = await asyncio.to_thread(
        sd.rec,
        int(duration * sample_rate),
        samplerate=sample_rate,
        channels=1,
        dtype="int16",
    )
    await asyncio.to_thread(sd.wait)
    print("done.")

    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(audio.tobytes())
    buf.seek(0)
    buf.name = "audio.wav"

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    transcription = await client.audio.transcriptions.create(
        model=settings.stt_model,
        file=buf,
    )
    text = transcription.text.strip()
    print(f"[voice] Transcribed: {text}")
    return text
