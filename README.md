# Grok Mode for VS Code

> **Conversational, Voice-Driven Development Powered by Copilot Agents**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![VS Code Extension](https://img.shields.io/badge/VS%20Code-Extension-blue?logo=visual-studio-code)](https://marketplace.visualstudio.com)

Grok Mode for VS Code transforms your editor into a real-time, two-way conversational partner. You speak naturally. Copilot listens, understands, asks clarifying questions, proposes designs, executes tasks, and narrates what it's doing — all hands-free.

This project brings a new interaction model to software development: **voice-first, conversational, collaborative coding.**

---

## Table of Contents

- [Vision](#-vision)
- [Talk to VS Code Like You Talk to Grok](#-talk-to-vs-code-like-you-talk-to-grok)
- [Conversational Design & Planning Mode](#-conversational-design--planning-mode)
- [Real-Time Narration of Actions](#-real-time-narration-of-actions)
- [Features](#-features)
- [Architecture](#-architecture)
- [Roadmap](#-roadmap)
- [Example Conversations](#-example-conversations)
- [Contributing](#-contributing)
- [License](#-license)
- [Acknowledgements](#-acknowledgements)

---

## 🌟 Vision

Modern AI coding tools are powerful, but they still rely on traditional input methods. Grok Mode for VS Code reimagines the developer experience by enabling:

- Natural language design discussions
- Voice-driven coding
- Agent-guided planning
- Narrated execution
- Hands-free workflows
- Accessible development for more people

Instead of typing commands or clicking menus, you simply speak. Copilot becomes a collaborative design partner, not just a code generator.

---

## 🎤 Talk to VS Code Like You Talk to Grok

You can speak naturally:

```
"Create a new FastAPI endpoint for inventory sync."
"Refactor this file to use dependency injection."
"Generate unit tests for the new module."
"Deploy to the dev environment."
```

Copilot responds aloud, executes the actions, and keeps the conversation going.

---

## 🧠 Conversational Design & Planning Mode

Grok Mode enables Copilot Agents to:

| Capability | Example |
|---|---|
| Ask clarifying questions | *"Should this endpoint return JSON or HTML?"* |
| Propose multi-step plans | *"I suggest creating a scheduler, a sync service, and a conflict resolver."* |
| Pause for confirmation | *"Would you like me to scaffold the module now?"* |
| Refine based on spoken feedback | *"Use RSA keys instead of HMAC? Understood."* |
| Discuss design parameters | *"Do you want optimistic or pessimistic locking for inventory updates?"* |

You answer verbally, and Copilot continues the plan. This creates a true **design-dialogue** between developer and agent.

---

## 🔊 Real-Time Narration of Actions

As Copilot works, it narrates what it's doing:

- *"Creating file `inventory_sync.py`..."*
- *"Adding FastAPI route..."*
- *"Updating settings..."*
- *"Running tests..."*
- *"Deployment complete."*

You always know what's happening — no silent edits.

---

## 🧩 Features

| Feature | Description |
|---|---|
| ✔️ Always-listening voice input | Microphone → Whisper → text → Copilot Chat |
| ✔️ Two-way voice conversation | Copilot speaks responses aloud using pluggable TTS engines |
| ✔️ Conversational Planning Mode | Copilot asks questions, proposes designs, and waits for verbal confirmation |
| ✔️ Action Narration | Narrates file edits, file creation, refactors, tool calls, and more |
| ✔️ Hands-free workflow | Continuous loop of speaking, planning, executing, and narrating |
| ✔️ UI Panel | Shows mic status, last command, last response, and action logs |

---

## 🧱 Architecture

### Project Structure

```
/src
  /voice       # Whisper-based speech recognition
  /tts         # Text-to-speech engines
  /copilot     # Copilot Chat + Agent bridge
  /dialogue    # Agent Dialogue Manager
  /narrator    # Action narration system
  /ui          # WebView panel
```

### Components

**Voice Input Module**
- Whisper.cpp or cloud Whisper
- Hotword activation (optional)
- Streams recognized text to the Command Router

**Command Router**
Routes spoken input to:
- Copilot Chat
- VS Code commands
- Plugin-specific commands

**Copilot Chat Bridge**
- Sends text to Copilot
- Receives streaming responses
- Emits events for TTS + Narrator

**Agent Dialogue Manager**
- Detects questions, plans, confirmations
- Keeps mic open for responses
- Maintains conversational context

**Action Narrator**
Listens to:
- File edits, creation, and deletion
- Terminal commands
- Copilot agent actions

**TTS Output Module**
Supports:
- Windows TTS
- macOS `say`
- Azure Neural TTS
- ElevenLabs
- Local offline engines

**UI Panel**
Displays:
- Mic status
- Last command
- Last response
- Logs

---

## 🚀 Roadmap

| Milestone | Goals | Status |
|---|---|---|
| **1 — Voice Input + Copilot Chat** | Whisper integration, send spoken text to Copilot, display responses | 🔲 Planned |
| **2 — TTS Output** | Speak Copilot responses, configurable voice engine | 🔲 Planned |
| **3 — Action Narration** | Detect file edits, speak them aloud | 🔲 Planned |
| **4 — Conversational Planning Mode** | Detect questions, keep mic open, multi-turn design dialogue | 🔲 Planned |
| **5 — Hands-Free Loop** | Continuous listening, interruptible speech, full conversational workflow | 🔲 Planned |
| **6 — Public Release** | MIT license, documentation, demo video, Marketplace listing | 🔲 Planned |

---

## 🧪 Example Conversations

### Designing a Feature

```
You:     "Copilot, help me design the new inventory sync module."

Copilot: "I need to know:
           - Which database are we syncing from?
           - How often should the sync run?
           - Should conflicts be resolved automatically?"

You:     "Postgres, every 10 minutes, and yes — auto resolve."

Copilot: "Great. Here's the plan..."
```

### Executing a Plan

```
You:     "Proceed."

Copilot: "Creating sync_service.py...
          Adding scheduler...
          Writing conflict resolver...
          Done."
```

### Refactoring

```
You:     "Refactor this file to use dependency injection."

Copilot: "Refactoring...
          Extracting interfaces...
          Updating imports...
          Done."
```

---

## 🤝 Contributing

Contributions are welcome! We're building a new interaction model for development — and we want your help.

**Ways to contribute:**
- Code
- Documentation
- Bug reports
- Feature ideas
- UI/UX improvements
- Voice model integrations
- TTS engine support

Please [open an issue](../../issues) or [submit a pull request](../../pulls).

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — free to use, modify, and distribute.

---

## 🙌 Acknowledgements

This project builds on the incredible work of:

- [Whisper.cpp](https://github.com/ggerganov/whisper.cpp)
- [GitHub Copilot & Copilot Agents](https://github.com/features/copilot)
- [VS Code Extension API](https://code.visualstudio.com/api)
- Open-source TTS engines