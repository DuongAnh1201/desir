"""
desir — entry point.

Adds the project root to sys.path so flat imports (config, ai, schemas, tools)
work whether you run `desir` CLI or `uv run python`.
"""

import sys
import os

# ── Path bootstrap ────────────────────────────────────────────────────────────
# src/desir/__init__.py  →  ../../  == project root
_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)


def main() -> None:
    import asyncio
    asyncio.run(_run())


async def _run() -> None:
    import logfire
    from config import settings
    from ai.agents.orchestrator import get_orchestrator
    from ai.agents.deps import OrchestratorDeps
    from tools.voicerecognition import listen

    logfire.configure(
        token=settings.logfire_token,
        environment=settings.env,
        service_name="desir",
    )

    orchestrator = get_orchestrator()
    deps = OrchestratorDeps(search_api_key=settings.serper_api_key)

    print("Desir is ready. Speak now. (Ctrl+C to exit)\n")
    with logfire.span("session"):
        while True:
            try:
                transcript = await listen()
                if not transcript.strip():
                    continue

                with logfire.span("orchestrator.run", input=transcript):
                    result = await orchestrator.run(transcript, deps=deps)

                print(f"[Desir] {result.output.response}\n")

            except KeyboardInterrupt:
                print("\nGoodbye.")
                break
