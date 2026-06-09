# Project Kaguya 🌙

**Newrosama** — a multilingual 3D AI virtual character who listens through
your microphone in **Korean, Japanese, and English**, thinks, and answers
out loud with text-to-speech (TTS).

## What's in this repo

| File | What it is |
|---|---|
| `index.html` | The Newrosama app — open this to meet her |
| `css/style.css` | UI styling (chat bubble, mic button, settings) |
| `js/avatar.js` | The 3D stage (Three.js) — placeholder character + VRM avatar loader |
| `js/speech.js` | Multilingual speech-to-text and text-to-speech (Web Speech API) |
| `js/brain.js` | Pluggable conversation engine (works offline, or via an LLM API) |
| `js/main.js` | Wires the UI, avatar, speech, and brain together |
| `ROADMAP.md` | Step-by-step development roadmap |
| `docs/free-resources.md` | Where to get a **free** Japanese girl voice and a **free** 3D avatar |
| `melon-clock.html` | The original melon ticket clock (kept as-is) |

## Quick start

1. Open `index.html` in **Chrome or Edge** (best Web Speech API support —
   Safari/Firefox have partial/no support for speech recognition).
2. Allow microphone access when prompted.
3. Pick a language (한국어 / 日本語 / English) and tap the mic button to talk.
4. Newrosama replies out loud using your browser's built-in TTS voices.
5. Open ⚙ Settings to load a real 3D avatar (`.vrm` file) or connect an AI
   backend — see `docs/free-resources.md` and `ROADMAP.md` for how.

No build step, no server, no API key required to try it — everything runs
client-side for free using the browser's native speech APIs and a small
placeholder 3D character.

## Roadmap

See [`ROADMAP.md`](./ROADMAP.md) for the phase-by-phase plan (what's done,
what's next).

## Free resources guide

See [`docs/free-resources.md`](./docs/free-resources.md) for how to get:
- A free Japanese "girl" TTS voice
- A free 3D avatar (VRM) for Newrosama
