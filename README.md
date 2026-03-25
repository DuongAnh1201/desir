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
  └── Single dispatch(tool_name, args) → Orchestrator for all server-side tool calls
        │
        ▼
  OpenAI Realtime API  (gpt-4o-mini-realtime-preview)
  ├── Server VAD — detects speech start/end automatically
  ├── Whisper — transcribes user speech
  ├── Generates audio response + transcripts
  └── Calls tools: send_email | schedule_event | search_web |
                   search_contact | send_imessage | make_call |
                   changeThemeColor | update_daily_tasks
        │
        │  Tool call → server.py dispatch(tool_name, args)
        │  Prompt format: "<tool_name>: <args as JSON>"
        ▼
  Orchestrator Agent  (ai/agents/orchestrator.py, Pydantic AI)
  ├── System prompt: ai/prompts/orchestrator.md
  ├── Receives tool_name + full args JSON as a natural-language prompt
  ├── Routes to the correct sub-agent via delegation tools
  ├── Injects OrchestratorDeps (history, email address, API keys, event IDs)
  └── Returns response string → server.py → OpenAI Realtime → audio to user
        │
        ├──▶ delegate_email(to, subject, body)
        │         └── agent1.py — Email Agent
        │               ├── send_email(EmailRequest)
        │               │     email_type="notification" → styled HTML template
        │               │     email_type="user_request" → plain-text message
        │               │     └── tools/sending_email.py → Resend API
        │               └── register_domain(domain_name) → Resend Domains API
        │
        ├──▶ delegate_calendar(request)
        │         └── agent2.py — Calendar Agent
        │               ├── list_calendars()
        │               │     └── tools/calendar.py → accli calendars --json
        │               ├── create_calendar_event(CalendarRequest)
        │               │     └── tools/calendar.py → accli create ...
        │               ├── update_calendar_event(CalendarRequest)
        │               │     └── tools/calendar.py → accli update <id>
        │               ├── delete_calendar_event(CalendarRequest)
        │               │     └── tools/calendar.py → accli delete <id>
        │               └── check_freebusy(CalendarRequest)
        │                     └── tools/calendar.py → accli freebusy ...
        │               * Event IDs saved in OrchestratorDeps.calendar_event_ids
        │               * Falls back to tomnguyen6766@gmail.com calendar
        │
        ├──▶ delegate_search(query)
        │         └── agent3.py — Search Agent
        │               └── search_web(query)
        │                     └── Serper API (Google Search) → summary
        │
        └──▶ delegate_communication(recipient, action, message)
                  └── agent4.py — Communication Agent
                        ├── send_imessage → macOS Messages (AppleScript)
                        └── make_call → macOS FaceTime / Phone

Frontend-only tools (forwarded directly to browser, no server or agent logic):
  changeThemeColor   — updates holographic UI color in real time
  update_daily_tasks — updates task list displayed on the interface

Observability:
  Logfire — traces every session via logfire.span("session")

Session state injected per call (OrchestratorDeps):
  history_context      — rolling conversation turns {User, desir}
  email_address        — tomnguyen6766@gmail.com
  search_api_key       — Serper API key
  tom_history_context  — static biographical context (ai/prompts/tombio.md)
  calendar_event_ids   — dict mapping event title → accli event ID, persists
                         across tool calls within a session so the agent can
                         update or delete events it created earlier
```

### How a tool call flows end-to-end

1. User speaks → OpenAI Realtime transcribes and detects intent.
2. Realtime calls a tool (e.g. `schedule_event`) with structured arguments.
3. `server.py` receives `response.function_call_arguments.done` and calls `dispatch(tool_name, args)`.
4. `dispatch` builds the prompt `"schedule_event: {"title": "...", "when": "..."}"` and runs the Orchestrator.
5. The Orchestrator reads its system prompt, identifies the intent as "calendar", and calls `delegate_calendar(request=...)`.
6. `delegate_calendar` appends any known event IDs from `deps.calendar_event_ids`, then runs the Calendar Agent.
7. The Calendar Agent picks the right tool (`create_calendar_event`, etc.) and calls `tools/calendar.py` via `asyncio.to_thread`.
8. `tools/calendar.py` shells out to `accli`, which writes to macOS Calendar.
9. The result bubbles back up: Calendar Agent → Orchestrator → `dispatch` → `server.py` → OpenAI Realtime → spoken response to user.

---

## Getting Started

> ⚠️ This project is currently in the **prototype stage** and runs on macOS only (calendar and communication tools use macOS-native APIs).

### Prerequisites

- Python 3.13+
- Node.js 18+
- [uv](https://docs.astral.sh/uv/) — Python package manager
- [accli](https://www.npmjs.com/package/@joargp/accli) — macOS Calendar CLI (`sudo npm i -g @joargp/accli`, then `accli setup`)
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

### Calendar setup (macOS)

```bash
sudo npm i -g @joargp/accli
accli setup   # grant Calendar access when prompted in System Settings
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

### Docker (Local Dev)

```bash
docker compose up --build
```

Open `http://localhost:5173`.

Notes:
- macOS-only tools (Calendar, iMessage, calls) do not work inside Docker containers.
- Backend auto-restarts on code changes via `watchfiles`; frontend uses Vite HMR.

---

## Project Structure

```
desir/
├── server.py                  # WebSocket bridge — browser ↔ OpenAI Realtime
├── config.py                  # Settings loaded from .env
│
├── ai/
│   ├── agents/
│   │   ├── deps.py            # OrchestratorDeps dataclass (session state)
│   │   ├── orchestrator.py    # Orchestrator agent + delegation tools
│   │   ├── agent1.py          # Email agent
│   │   ├── agent2.py          # Calendar agent
│   │   ├── agent3.py          # Search agent
│   │   └── agent4.py          # Communication agent
│   └── prompts/
│       ├── orchestrator.md    # Orchestrator routing rules
│       ├── realtime_session.md # OpenAI Realtime system prompt
│       ├── email_agent.md     # Email agent instructions
│       ├── calendar_agent.md  # Calendar agent instructions
│       ├── search_agent.md    # Search agent instructions
│       └── tombio.md          # User biographical context
│
├── tools/
│   ├── sending_email.py       # Resend API wrappers
│   └── calendar.py            # accli CLI wrappers for macOS Calendar
│
├── schemas/
│   ├── orchestrator.py        # OrchestratorResult
│   ├── agent1.py              # EmailRequest, EmailResult
│   ├── agent2.py              # CalendarRequest, CalendarResult
│   ├── agent3.py              # SearchResult
│   └── agent4.py              # CommunicationResult
│
└── frontend/                  # React + Vite holographic UI
```

---

## Roadmap

- [x] Orchestrator + sub-agent delegation model (Pydantic AI)
- [x] OpenAI Realtime API voice interface (native audio streaming)
- [x] Python WebSocket bridge (browser ↔ OpenAI ↔ agents)
- [x] Single `dispatch()` — all tool calls routed through the orchestrator
- [x] STOP voice command — interrupt response mid-stream
- [x] Conversation history tracking per session
- [x] Email agent — Resend API (notification HTML + plain user request)
- [x] Email domain registration — Resend Domains API
- [x] Search agent — Serper API (Google Search)
- [x] Communication agent — iMessage + phone call (macOS)
- [x] Observability — Logfire session tracing
- [x] React + Vite frontend with holographic UI
- [x] Calendar agent — create, update, delete, free/busy via accli + macOS Calendar
- [x] Calendar event ID persistence within session (update/delete by name)
- [ ] Custom domain email sending (Resend domain verification flow)
- [ ] Expand sub-agent action library
- [ ] User testing and feedback

---

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or suggestions.

---

## License

This project is licensed under the [MIT License](LICENSE).
