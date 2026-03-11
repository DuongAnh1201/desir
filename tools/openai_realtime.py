"""
OpenAI Realtime API audio session.

Pipeline:
  Microphone → PCM 16-bit 16kHz chunks → WebSocket (gpt-4o-mini-realtime-preview)
                                                        ↓
  Speaker    ← PCM 24kHz chunks        ← Audio response streamed back

Function calls from the model are routed to the registered tool handlers.
"""

import asyncio
import base64
import json
import numpy as np
import sounddevice as sd
import websockets

# ── Constants ──────────────────────────────────────────────────────────────────
INPUT_SAMPLE_RATE = 16_000   # Hz — required by Realtime API
OUTPUT_SAMPLE_RATE = 24_000  # Hz — Realtime API always returns 24kHz PCM
CHUNK_SAMPLES = 1_024        # ~64 ms per chunk at 16kHz
REALTIME_URL = "wss://api.openai.com/v1/realtime"


# ── Public entry point ─────────────────────────────────────────────────────────

async def run_session(
    api_key: str,
    model: str,
    voice: str,
    system_prompt: str,
    tool_definitions: list[dict],
    tool_handlers: dict,
) -> None:
    """
    Open an OpenAI Realtime WebSocket session and run the audio loop.

    Args:
        api_key:          OpenAI API key.
        model:            Realtime model ID, e.g. 'gpt-4o-mini-realtime-preview'.
        voice:            TTS voice name, e.g. 'nova'.
        system_prompt:    System instruction sent on session init.
        tool_definitions: List of OpenAI function-call schema dicts.
        tool_handlers:    Mapping of function name → async callable.
    """
    headers = {
        "Authorization": f"Bearer {api_key}",
        "OpenAI-Beta": "realtime=v1",
    }
    url = f"{REALTIME_URL}?model={model}"

    async with websockets.connect(url, additional_headers=headers) as ws:
        # ── 1. Configure session ───────────────────────────────────────────────
        await ws.send(json.dumps({
            "type": "session.update",
            "session": {
                "modalities": ["audio", "text"],
                "voice": voice,
                "instructions": system_prompt,
                "input_audio_format": "pcm16",
                "output_audio_format": "pcm16",
                "input_audio_transcription": {"model": "whisper-1"},  # needed for STOP detection
                "turn_detection": {
                    "type": "server_vad",            # model detects end-of-speech
                    "silence_duration_ms": 600,
                    "threshold": 0.5,
                },
                "tools": tool_definitions,
                "tool_choice": "auto",
            },
        }))

        # ── 2. Audio output stream + queue ────────────────────────────────────
        out_stream = sd.OutputStream(
            samplerate=OUTPUT_SAMPLE_RATE,
            channels=1,
            dtype="int16",
        )
        out_stream.start()

        out_queue: asyncio.Queue[np.ndarray | None] = asyncio.Queue()
        stop_requested = asyncio.Event()

        async def _play_audio() -> None:
            while True:
                chunk = await out_queue.get()
                if chunk is None:
                    continue
                if not stop_requested.is_set():
                    out_stream.write(chunk)

        # ── 3. Audio input — runs in a separate task ───────────────────────────
        audio_queue: asyncio.Queue[bytes] = asyncio.Queue()

        def _mic_callback(indata, frames, time_info, status):
            audio_queue.put_nowait(bytes(indata))

        async def _send_audio() -> None:
            with sd.InputStream(
                samplerate=INPUT_SAMPLE_RATE,
                channels=1,
                dtype="int16",
                blocksize=CHUNK_SAMPLES,
                callback=_mic_callback,
            ):
                while True:
                    chunk = await audio_queue.get()
                    encoded = base64.b64encode(chunk).decode()
                    await ws.send(json.dumps({
                        "type": "input_audio_buffer.append",
                        "audio": encoded,
                    }))

        # ── 4. Receive events loop ─────────────────────────────────────────────
        async def _receive() -> None:
            pending_fn_calls: dict[str, dict] = {}  # call_id → {name, args}
            history: list[dict[str, str]] = []
            _pending_user: str = ""
            _pending_desir: str = ""

            async for raw in ws:
                event = json.loads(raw)
                etype = event.get("type", "")

                # Audio chunk → queue for playback
                if etype == "response.audio.delta":
                    pcm = base64.b64decode(event["delta"])
                    samples = np.frombuffer(pcm, dtype=np.int16)
                    await out_queue.put(samples)

                # Transcription complete — capture user text + check for STOP
                elif etype == "conversation.item.input_audio_transcription.completed":
                    transcript = event.get("transcript", "").strip()
                    _pending_user = transcript
                    if transcript.lower().rstrip(".!") == "stop":
                        print("[desir] STOP detected — cancelling response.")
                        stop_requested.set()
                        # Drain queued audio
                        while not out_queue.empty():
                            try:
                                out_queue.get_nowait()
                            except asyncio.QueueEmpty:
                                break
                        await ws.send(json.dumps({"type": "response.cancel"}))
                        stop_requested.clear()

                # Capture Desir's audio transcript
                elif etype == "response.audio_transcript.delta":
                    _pending_desir += event.get("delta", "")

                # Response done — commit history entry
                elif etype == "response.done":
                    if _pending_user or _pending_desir:
                        entry = {"User": _pending_user, "desir": _pending_desir.strip()}
                        history.append(entry)
                        print(f"[history] User: {entry['User']!r}  |  desir: {entry['desir']!r}")
                        _pending_user = ""
                        _pending_desir = ""

                # Function call — accumulate args across deltas
                elif etype == "response.function_call_arguments.delta":
                    call_id = event["call_id"]
                    if call_id not in pending_fn_calls:
                        pending_fn_calls[call_id] = {
                            "name": event.get("name", ""),
                            "args": "",
                        }
                    pending_fn_calls[call_id]["args"] += event["delta"]

                # Function call complete — execute handler
                elif etype == "response.function_call_arguments.done":
                    call_id = event["call_id"]
                    fn_name = event.get("name") or pending_fn_calls.get(call_id, {}).get("name", "")
                    raw_args = event.get("arguments") or pending_fn_calls.get(call_id, {}).get("args", "{}")

                    try:
                        args = json.loads(raw_args)
                    except json.JSONDecodeError:
                        args = {}

                    handler = tool_handlers.get(fn_name)
                    if handler:
                        try:
                            result = await handler(**args)
                        except Exception as e:
                            result = f"Error executing {fn_name}: {e}"
                    else:
                        result = f"Unknown tool: {fn_name}"

                    await ws.send(json.dumps({
                        "type": "conversation.item.create",
                        "item": {
                            "type": "function_call_output",
                            "call_id": call_id,
                            "output": str(result),
                        },
                    }))
                    await ws.send(json.dumps({"type": "response.create"}))
                    pending_fn_calls.pop(call_id, None)

                elif etype == "error":
                    print(f"[realtime] Error: {event.get('error', {}).get('message')}")

        send_task = asyncio.create_task(_send_audio())
        play_task = asyncio.create_task(_play_audio())
        try:
            await _receive()
        finally:
            send_task.cancel()
            play_task.cancel()
            out_stream.stop()
            out_stream.close()
