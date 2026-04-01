from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from ai.prompts import load_prompt


def test_realtime_prompt_requires_send_email_for_complete_drafts():
    prompt = load_prompt("realtime_session")

    assert "call `send_email` immediately" in prompt
    assert "Never read the full email draft aloud instead of calling `send_email`." in prompt
    assert "I've prepared the draft for your approval on screen." in prompt
    assert "do not invent the missing detail" in prompt
