# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

(Global operating instructions live in ~/.claude/CLAUDE.md and are loaded automatically — not duplicated here.)

## Project: JAID

A Chamorro language learning app. Users browse vocabulary cards (words and sayings), filter by type, and mark items complete to track progress.

**Stack:** React 19, Vite 8, plain CSS — no router, no state management library.

## Commands

```bash
npm run dev       # start dev server (localhost:5173)
npm run build     # production build
npm run lint      # ESLint
npm run preview   # preview production build
```

No test runner is configured.

## Architecture

`App.jsx` fetches vocabulary from `http://localhost:3001/api/vocabulary` on mount. **That backend is not in this repo** — it must be running separately or the app renders the "Could not connect to JAID server" error state. If you need to work offline, the legacy static dataset is still at `src/data/jaidContent.js` (currently unimported) and can be wired back into `App.jsx`.

Vocabulary item shape:
```js
{ id, chamorro, english, type, difficulty, isCompleted, culturalNote }
```
`type` is `"word"` or `"saying"`. `difficulty` is an integer (1 = basic, 2+ = advanced).

`App.jsx` owns all state (`words`, `filter`, `completedCount`, `loading`, `error`) and passes props down. No context, no global store.

Component tree:
- `App` → `Header` (progress display), `FilterBar` (type filter), `WordCard[]` (one per item)
- `WordCard` owns its own `isCompleted` toggle state and reports changes up via `onComplete(bool)`. The completed count in `App` is therefore independent of any per-card state — re-mounting cards (e.g. on filter change) resets their toggle but not the count.
