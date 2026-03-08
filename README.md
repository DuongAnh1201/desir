# Desir — LLM-Powered Virtual Assistant

## Abstract

Apple has lagged behind in the AI race compared to its competitors, while other major technology companies such as Google and Microsoft are spending a large amount of money to improve their own large language models (LLMs). Unlike current LLMs, Siri has permission-based action execution deeply integrated within Apple's ecosystem. In this project, LLMs serve as the core reasoning engine with Siri-like permission controls, built on top of **Pydantic AI** with an **AI delegation model** — an orchestrator agent that routes tasks to specialized sub-agents, ensuring controlled and ethical execution. To start with, the project aims to deploy a base set of permission executions as a simple prototype. While people are currently using LLMs as chatbots, this project strives to create a virtual assistant that can act as an actual assistant.

---

## Motivation

The initial challenge in this project was the difficulty of visualizing and drafting a system around such an abstract concept. At the time, there was only one existing model — **Clawdbot** (now known as **Open Claw**) — an open-source model with executable permissions. However, it granted the AI the ability to execute `sudo` commands without asking the user, which raised serious concerns about security and ethical usage, as granting unrestricted system-level access to an AI without user consent poses significant risks.

Despite this, it has opened an entirely new paradigm for agentic AI — rather than merely making recommendations, AI is now capable of directly executing actions in the digital world, functioning as a genuine assistant for users.

---

## Potential Users

Our potential users are those who seek to move beyond traditional chatbots and desire a more ethical, personalized, and voice-driven experience with a friendly user interface. Much like the fictional AI assistant J.A.R.V.I.S. from the *Iron Man* franchise, this project aims to bring a truly intelligent, action-capable virtual assistant into the real world.

---

## Key Features

- **LLM as Core Reasoning Engine** — Uses a large language model as the intelligence layer for decision-making and natural language understanding.
- **AI Delegation Model** — An orchestrator agent delegates tasks to specialized sub-agents, enabling modular and scalable action execution.
- **Permission-Based Action Execution** — Actions are pre-defined and controlled, preventing unauthorized or unethical operations.
- **Voice-Driven Interface** — Supports human-like voice interaction for a natural user experience.
- **Observability with Logfire** — Real-time tracing and monitoring of agent behavior via Pydantic Logfire.
- **Security & Ethics by Design** — All executable actions are sandboxed to ensure user safety and responsible AI usage.

---

## Architecture Overview

```
User (Voice)
        │
        ▼
  Browser — React + Vite (frontend/)
  AudioRecorder → PCM16 base64 → WebSocket (ws://localhost:8765)
        │
        ▼
  Python WebSocket Bridge (server.py)
  ├── Proxies audio ↔ OpenAI Realtime API (wss://api.openai.com)
  ├── Streams audio back to browser
  ├── Handles STOP voice command (cancels response mid-stream)
  ├── Tracks conversation history {User, desir} per session
  └── Single dispatch() → Orchestrator for all tool calls
        │
        ▼
  OpenAI Realtime API  (gpt-4o-mini-realtime-preview)
  ├── Server VAD — detects speech start/end automatically
  ├── Whisper — transcribes user speech
  ├── Generates audio response + transcripts
  └── Calls tools: send_email | search_web | search_contact |
                   send_imessage | make_call |
                   changeThemeColor | update_daily_tasks
        │
        │  Tool call → server.py dispatch()
        ▼
  Orchestrator Agent  (ai/agents/orchestrator.py, Pydantic AI)
  ├── Reads orchestrator.md system prompt
  ├── Receives full tool args as JSON from server.py
  ├── Routes to the correct sub-agent via delegation tools
  └── Returns response string back to OpenAI Realtime
        │
        ├──▶ agent1.py — Email Agent
        │    ├── send_email (notification HTML or plain user_request)
        │    │   └── tools/sending_email.py → Resend API
        │    └── register_domain → Resend Domains API
        │
        ├──▶ agent2.py — Calendar Agent
        │    └── schedule_event → macOS Calendar (AppleScript)
        │
        ├──▶ agent3.py — Search Agent
        │    └── search_web → Serper API (Google Search)
        │
        └──▶ agent4.py — Communication Agent
             ├── send_imessage → macOS Messages (AppleScript)
             └── make_call → macOS FaceTime / Phone

Frontend-only tools (forwarded directly to browser, no server logic):
  changeThemeColor   — updates holographic UI color
  update_daily_tasks — updates task list on the interface

Observability:
  Logfire — traces every session via logfire.span("session")

Deps injected per session (OrchestratorDeps):
  history_context   — rolling conversation turns {User, desir}
  email_address     — tomnguyen6766@gmail.com
  search_api_key    — Serper API key
  tom_history_context — static biographical context (tombio.md)
```

---

## Getting Started

> ⚠️ This project is currently in the **prototype stage**. Setup instructions will be updated as development progresses.

### Prerequisites

- Python 3.13+
- Node.js 18+
- [uv](https://docs.astral.sh/uv/) — Python package manager
- OpenAI API key (with Realtime API access)
- [Resend](https://resend.com) API key (email)
- [Serper](https://serper.dev) API key (web search)
- [Logfire](https://logfire.pydantic.dev) token (observability)

### Install uv

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Installation

```bash
git clone https://github.com/DuongAnh1201/desir.git
cd desir
uv sync
cd frontend && npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
OPENAI_API_KEY=sk-...
AI_MODEL=openai:gpt-4o-mini
REALTIME_MODEL=gpt-4o-mini-realtime-preview
REALTIME_VOICE=coral

RESEND_API_KEY=re_...
RESEND_FROM=Desir <you@yourdomain.com>

SERPER_API_KEY=...

LOGFIRE_TOKEN=...
LOGFIRE_ENVIRONMENT=local
```

### Running

**Terminal 1 — Python backend:**
```bash
uv run python server.py
```

**Terminal 2 — Frontend:**
```bash
cd frontend && npm run dev
```

Open `http://localhost:5173`, click the power button, and speak.

---

## Roadmap

- [x] Define base permission execution structure
- [x] Set up orchestrator and sub-agent schemas (Pydantic AI)
- [x] Implement voice recognition interface
- [ ] Integrate LLM reasoning engine with delegation model
- [ ] Expand sub-agent action library
- [ ] User testing and feedback

---

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or suggestions.

---

## License

This project is licensed under the [MIT License](LICENSE).
