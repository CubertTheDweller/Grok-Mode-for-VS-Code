# Grok Mode for VS Code — Agent Instructions

## Project Overview

A VS Code extension (TypeScript) that adds voice-driven, conversational development powered by GitHub Copilot Agents. See [README.md](README.md) for full vision and feature details. See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## Build & Test

```bash
npm install           # install dependencies (also downloads native Whisper.cpp bindings)
npm run compile       # type-check + esbuild bundle → dist/extension.js
npm run watch         # parallel: esbuild watch + tsc --noEmit watch (use during dev)
npm test              # compile tests to out/ then run via @vscode/test-electron
```

Press `F5` in VS Code to launch the Extension Development Host for manual testing.

**Output locations:**
- `dist/extension.js` — esbuild bundle (this is the `"main"` entry point)
- `out/` — tsc output used only for tests (`npm run compile-tests`)

```bash
npx vsce package      # creates a .vsix for distribution
```

## Runtime Prerequisites

These must be present on the user's machine at runtime (not bundled):

| Requirement | Platform | Purpose |
|---|---|---|
| **SoX** on `PATH` | All | `node-record-lpcm16` uses SoX to capture mic audio |
| **Whisper model file** | All | `nodejs-whisper` downloads on first use; large — can be slow |
| **Build tools** (MSVC/Xcode) | Windows/macOS | `nodejs-whisper` has native bindings compiled at install time |

Missing runtime deps fail at runtime, not install time. Provide clear user-facing error messages — don't swallow them silently.

## Architecture

Source lives in `src/` with strict module boundaries. **Do not add cross-module direct imports** — use events.

| Module | Path | Responsibility |
|---|---|---|
| Extension entry | `src/extension.ts` | Activates, wires all modules together via events, registers commands, manages disposables |
| Types | `src/types.ts` | Shared enums (`DialogueState`) and interfaces (`NarratorEvent`, `ConversationTurn`) |
| Voice Input | `src/voice/` | `Microphone` records audio; `WhisperSTT` transcribes; `HotwordFilter` strips prefix |
| TTS Output | `src/tts/` | Factory `TTSEngine.create()` returns platform-appropriate `ITTSEngine` implementation |
| Copilot Bridge | `src/copilot/` | `CopilotBridge` wraps `vscode.lm`; `MessageRouter` routes speech to commands or Copilot; `PlanningMode` prepends system instruction |
| Dialogue Manager | `src/dialogue/` | `DialogueManager` orchestrates state; `QuestionDetector` classifies responses; `ContextTracker` maintains rolling 10-turn history |
| Action Narrator | `src/narrator/` | `ActionNarrator` wires `FileEventSource` + `AgentEventSource` → TTS narration |
| UI Panel | `src/ui/` | WebView panel in `media/panel.html`; shows mic status, streaming response, logs |

**Data flow:**
```
Microphone → WhisperSTT → HotwordFilter → MessageRouter
  → (VS Code command shortcut) OR (CopilotBridge via vscode.lm)
    → CopilotBridge emits 'response' (streaming) + 'responseDone'
      → TTS speaks response
      → QuestionDetector classifies → DialogueState transition
      → [If question/plan] keep mic open → loop
      → ActionNarrator speaks file/agent actions
      → UI Panel updates
```

## Key Interfaces

**`ITTSEngine`** ([src/tts/ITTSEngine.ts](src/tts/ITTSEngine.ts)) — all TTS engines must implement:
```typescript
speak(text: string): Promise<void>  // resolve when audio finishes
stop(): void
dispose(): void
```

**`ISTTEngine`** ([src/voice/ISTTEngine.ts](src/voice/ISTTEngine.ts)) — STT engines must implement:
```typescript
transcribe(audioPath: string): Promise<string>  // 16kHz mono WAV → text
dispose(): void
```

Add new TTS engines by implementing `ITTSEngine` and registering in `TTSEngine.create()`. Do not modify callers.

## Conventions

- **Event-driven coupling**: Modules communicate via Node.js `EventEmitter` events (`'response'`, `'responseDone'`, `'audioReady'`, `'error'`). Direct method calls across module boundaries are a code smell.
- **Pluggable engines**: TTS and STT engines implement interfaces and are selected via factory. Never hardcode engine logic in callers.
- **Disposable pattern**: All long-lived objects implement `dispose()`. Register with `context.subscriptions` in `extension.ts` for automatic cleanup.
- **No silent edits**: Every file write/create/delete must be narrated via `ActionNarrator` — before and after.
- **VS Code API only**: Use the [VS Code Extension API](https://code.visualstudio.com/api) for all editor interactions. Only shell out for OS TTS integration (Windows SAPI, macOS `say`).
- **Shell injection prevention**: WindowsTTS writes text to a temp file instead of interpolating into shell commands. MacTTS uses `spawn` with an arg array (no shell invocation). Maintain this pattern for any new shell invocations.
- **No system role in `vscode.lm`**: Planning Mode prepends the system instruction as a user message prefix — `vscode.lm` has no system role support.

## Configuration Keys

All settings under `grokMode.*` in VS Code settings:

| Key | Type | Default | Notes |
|---|---|---|---|
| `ttsEngine` | `"auto"\|"windows"\|"macos"\|"elevenlabs"` | `"auto"` | Factory reads this |
| `elevenLabsApiKey` | `string` | `""` | **Never commit** — user settings only |
| `elevenLabsVoiceId` | `string` | Rachel ID | |
| `whisperModel` | `"tiny.en"` … `"medium.en"` | `"base.en"` | Larger = slower + accurate |
| `hotword` | `string` | `""` | Empty disables hotword filtering |
| `planningModeEnabled` | `boolean` | `false` | Prepends planning system prompt |
| `silenceThreshold` | `number` | `1.5` | Seconds of silence = end of utterance |

## Common Pitfalls

- **ElevenLabs misconfiguration**: Silently falls back to platform TTS. Show a clear warning to the user instead.
- **TTS errors swallowed**: `.catch(console.error)` gives no UI feedback. Surface errors via `vscode.window.showErrorMessage`.
- **Hotword filter is naive**: Simple case-insensitive string prefix — no fuzzy matching. Don't add NLP here without interface design.
- **ContextTracker fixed window**: 10-turn rolling history. Long conversations lose early context — this is by design.
- **Temp file leaks**: Windows TTS cleanup uses try-catch; locked files may accumulate silently.
- **`nodejs-whisper` first-run**: Model download can take minutes. Show progress or a notification.

## Project Status

Core implementation is complete (all 6 milestones are coded). The project is **pre-release** (v0.0.1, not yet on Marketplace). See [README.md](README.md#-roadmap) for milestone details. The next priority is milestone 6 (public release): docs, demo, and Marketplace packaging.
