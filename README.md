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
User (Voice / Text Input)
        │
        ▼
  Orchestrator Agent (Pydantic AI)
        │
        ├──▶ Sub-Agent 1 (Email Sending)
        ├──▶ Sub-Agent 2 (Calendar Setting (Scheduling))
        ├──▶ Sub-Agent 3 (Doing Google Search)
        └──▶ Sub-Agent N (Zalo)
                │
                ▼
        Executable Actions (Pre-defined & Controlled)
```

---

## Getting Started

> ⚠️ This project is currently in the **prototype stage**. Setup instructions will be updated as development progresses.

### Prerequisites

- Python 3.13+
- [uv](https://docs.astral.sh/uv/) — fast Python package and project manager
- LLM API access (e.g., Claude, GPT, or local model)
- [Logfire](https://logfire.pydantic.dev) account for observability

### Install uv

**macOS / Linux:**
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows:**
```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

After installation, restart your terminal so the `uv` command is available.

### Installation

```bash
git clone https://github.com/DuongAnh1201/desir.git
cd desir
uv sync
```

`uv sync` reads `pyproject.toml`, creates a `.venv`, and installs all dependencies automatically.

### Logfire Setup

Authenticate with your Logfire account before running:

```bash
logfire --region us auth
```

### Running the Prototype

```bash
desir
```

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
