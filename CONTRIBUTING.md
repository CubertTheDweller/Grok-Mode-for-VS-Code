# Contributing to Grok Mode for VS Code

Thank you for your interest in contributing! This project aims to build a voice-driven,
conversational development experience powered by GitHub Copilot Agents.

See [AGENTS.md](AGENTS.md) for the full architecture, module boundaries, and key conventions.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [SoX](https://sox.sourceforge.net/) on your PATH (required for microphone capture)
  - Windows: `choco install sox.portable`
  - macOS: `brew install sox`
- [GitHub Copilot](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot) installed in VS Code

### Setup

```bash
git clone https://github.com/your-username/grok-mode-vscode.git
cd grok-mode-vscode
npm install
```

### Running the Extension

Press **F5** in VS Code to launch the Extension Development Host.

Then open the Command Palette and run:
- `Grok Mode: Start` — begin voice listening
- `Grok Mode: Stop` — stop listening
- `Grok Mode: Toggle Planning Mode` — enable/disable conversational planning

### Build

```bash
npm run compile       # one-time build
npm run watch         # watch mode for development
npm test              # run extension tests
```

---

## Branch Naming

| Type | Pattern | Example |
|---|---|---|
| Feature | `feat/<short-description>` | `feat/elevenlabs-tts` |
| Bug fix | `fix/<short-description>` | `fix/mic-not-stopping` |
| Milestone | `milestone/<n>-<name>` | `milestone/3-tts-output` |

---

## Pull Request Checklist

Before opening a PR, ensure:

- [ ] `npm run compile` passes with zero errors
- [ ] Tested manually in the Extension Development Host (F5)
- [ ] New TTS engines implement `ITTSEngine`; new STT engines implement `ISTTEngine`
- [ ] Every file write/delete triggered by the agent is narrated via `ActionNarrator`
- [ ] No API keys, passwords, or `.env` contents are committed
- [ ] `CHANGELOG.md` updated under `[Unreleased]`

---

## Architecture

See [AGENTS.md](AGENTS.md) for the full module map and data flow.

Key rule: **no silent edits** — every file operation executed by the agent must be narrated before and after.
