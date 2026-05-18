## Summary

Closes #<!-- issue number -->

Brief description of what this PR changes and why.

---

## Type of Change

- [ ] Bug fix
- [ ] New feature / milestone implementation
- [ ] Refactor (no behaviour change)
- [ ] Documentation

---

## Checklist

- [ ] `npm run compile` passes with zero TypeScript errors
- [ ] Tested manually in the Extension Development Host (`F5`)
- [ ] New TTS engines implement `ITTSEngine`; new STT engines implement `ISTTEngine`
- [ ] All file writes/deletes triggered by the agent are narrated via `ActionNarrator`
- [ ] No API keys, credentials, or `.env` contents committed
- [ ] `CHANGELOG.md` updated under `[Unreleased]`
- [ ] `AGENTS.md` updated if architecture changed

---

## Testing Notes

Describe how you tested this change and any edge cases verified.
