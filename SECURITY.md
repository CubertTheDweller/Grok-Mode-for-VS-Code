# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| Latest (`main`) | ✅ |

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not open a public GitHub issue**.
Instead, email the maintainers directly or use GitHub's private vulnerability reporting feature.

We will acknowledge your report within 48 hours and provide a fix timeline.

---

## API Key Safety

This extension supports optional third-party services (e.g. ElevenLabs TTS).

**Never commit API keys to source control.**

Store all keys in VS Code settings:

1. Open VS Code Settings (`Ctrl+,` / `Cmd+,`)
2. Search for `Grok Mode`
3. Set `grokMode.elevenLabsApiKey` to your key

Settings are stored in your user profile and are **never included in the extension package** (`.vsix`).

The `.gitignore` excludes `.env` and `.env.*` files. Do not work around this.
