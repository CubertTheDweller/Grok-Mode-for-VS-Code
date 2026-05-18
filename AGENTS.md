# Grok Mode for VS Code — Agent Instructions

## Project Overview

A VS Code extension (TypeScript) that adds voice-driven, conversational development powered by GitHub Copilot Agents. See [README.md](README.md) for full vision and feature details.

## Build & Test

```bash
npm install           # install dependencies
npm run compile       # compile TypeScript
npm run watch         # compile in watch mode (for development)
npm test              # run extension tests
```

Press `F5` in VS Code to launch the Extension Development Host for manual testing.

Package for distribution:
```bash
npx vsce package      # creates a .vsix file
```

## Architecture

Source lives in `/src` with these module boundaries — keep concerns separated:

| Module | Path | Responsibility |
|---|---|---|
| Voice Input | `src/voice/` | Whisper-based STT; streams recognized text to Command Router |
| TTS Output | `src/tts/` | Pluggable TTS engines (Windows, macOS, Azure, ElevenLabs, local) |
| Copilot Bridge | `src/copilot/` | Sends text to Copilot Chat; receives streaming responses; emits events |
| Dialogue Manager | `src/dialogue/` | Detects questions/plans/confirmations; manages multi-turn context; keeps mic open during dialogue |
| Action Narrator | `src/narrator/` | Listens to VS Code workspace events (file edits, terminal, agent actions) and triggers TTS narration |
| UI Panel | `src/ui/` | WebView panel showing mic status, last command, last response, and logs |

**Data flow:** Voice Input → Command Router → Copilot Bridge → (TTS Output + Action Narrator) → UI Panel

## Key Conventions

- **Pluggable TTS**: TTS engines must implement a shared `ITTSEngine` interface so engines are swappable via settings.
- **Event-driven narration**: The Narrator subscribes to VS Code `workspace` and Copilot agent events — it does not poll.
- **Dialogue loop**: The Dialogue Manager holds mic open after a Copilot question until the user responds; never cut off mid-sentence.
- **No silent edits**: Every file write, create, or delete executed by the agent must be narrated via the Narrator before and after.
- **Extension API**: Use the [VS Code Extension API](https://code.visualstudio.com/api) for all editor interactions. Do not shell out for tasks achievable via the API.

## Technology Choices

- **Speech-to-text**: [Whisper.cpp](https://github.com/ggerganov/whisper.cpp) (local) or cloud Whisper — abstracted behind a `ISTTEngine` interface.
- **TTS engines**: Windows TTS (`say` SSML), macOS `say`, Azure Neural TTS, ElevenLabs, local offline engines.
- **Copilot integration**: GitHub Copilot Chat Extension API / Copilot Agents.

## Project Status

All milestones are **Planned** — no source code exists yet. See the [Roadmap](README.md#-roadmap) for milestone order. Implement milestones sequentially; do not skip ahead.
