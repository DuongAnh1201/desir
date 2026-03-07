"""
Utility for loading agent system prompts from .md files in this directory.

Usage:
    from prompts import load_prompt
    system_prompt = load_prompt("agent1_position_analyst")
"""

from pathlib import Path

_PROMPTS_DIR = Path(__file__).parent


def load_prompt(name: str) -> str:
    """
    Load and return the content of prompts/<name>.md.

    Args:
        name: filename without the .md extension,
              e.g. "agent1_position_analyst"

    Raises:
        FileNotFoundError: if the prompt file does not exist.
    """
    path = _PROMPTS_DIR / f"{name}.md"
    if not path.exists():
        raise FileNotFoundError(
            f"Prompt file not found: {path}\n"
            f"Available prompts: {[p.stem for p in _PROMPTS_DIR.glob('*.md')]}"
        )
    return path.read_text(encoding="utf-8").strip()
