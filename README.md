# Project Kaguya

A browser-based 3D AI character ("Kaguya") that:
- listens to you through the microphone in **Korean, Japanese, or English**,
- thinks of a reply with an LLM,
- speaks the reply back with TTS,
- and animates a 3D avatar (mouth movement synced to speech).

Everything runs as a static page (works on GitHub Pages) using the browser's
built-in **Web Speech API** for mic input/output and **Three.js + VRM** for
the 3D character. The only piece you must add yourself is the "brain"
(an LLM), because that needs a secret API key — see Step 3 below.

## Quick start

1. Get a `.vrm` avatar file (free options below) and place it in the project
   root as `avatar.vrm`.
2. Serve the folder with any static server, e.g. `npx serve .` or
   `python3 -m http.server`, and open it in **Chrome or Edge** (best Web
   Speech API support).
3. Click **🎤 Talk**, pick your language, and speak.

---

## Roadmap (step by step)

### Step 0 — Get an avatar on screen ✅ (scaffolded)
- `index.html` / `style.css` / `main.js` set up a Three.js scene that loads
  a VRM model (`avatar.vrm`) and renders it full-screen.
- **Your job:** drop a VRM file in the project root (see "Free 3D avatars").
- Stretch: tune the camera/lighting, add idle motion (breathing, blinking).

### Step 1 — Hear the user (speech-to-text) ✅ (scaffolded)
- `main.js` uses `SpeechRecognition` with a language dropdown
  (`ko-KR` / `ja-JP` / `en-US`) so Kaguya can transcribe Korean, Japanese,
  or English.
- Web Speech API recognizes **one language per session** — it can't
  auto-detect three languages at once. The dropdown is the simple fix.
  Stretch goal: auto-detect by running a quick language-ID check on the
  transcript and re-listening in the right language if it's wrong.

### Step 2 — Speak back (text-to-speech) ✅ (scaffolded, basic)
- `speak()` in `main.js` uses the browser's built-in `speechSynthesis` —
  free, zero setup, but voice quality/availability depends on the user's OS.
- Upgrade path: swap in a dedicated Japanese TTS engine for a much better
  "girl" voice (see "Free Japanese TTS" below) — you'd replace the body of
  `speak()` with a `fetch()` call to that engine's API and play the
  returned audio with `new Audio(...)`.

### Step 3 — Give Kaguya a brain (LLM)
This is the one piece you must build, because it needs a secret API key
that **must never be embedded in a static page** (anyone could view-source
and steal it). The fix is a tiny serverless proxy:

1. Deploy a one-endpoint backend (free tiers: Cloudflare Workers, Vercel
   Edge Functions, Netlify Functions). It receives `{ text, lang }`,
   calls your LLM of choice (e.g. the Claude API) with your key stored as
   a server-side secret, and returns `{ reply }`.
2. In `main.js`, replace the body of `getAIResponse()`:
   ```js
   async function getAIResponse(userText) {
     const res = await fetch('https://your-proxy.example.workers.dev/chat', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ text: userText, lang: langSelect.value }),
     });
     const { reply } = await res.json();
     return reply;
   }
   ```
3. Give Kaguya a personality with a system prompt on the backend (e.g.
   "You are Kaguya, a cheerful trilingual virtual girl who replies in the
   same language the user spoke, in 1–3 short sentences suited for being
   read aloud").
4. Maintain short conversation history (last few turns) so she remembers
   context within a session.

### Step 4 — Lip-sync & expressions
- `main.js` already drives a simple mouth-open value (`mouthTarget`) tied
  to `utterance.onstart` / `onend`. For a more convincing lip-sync, analyze
  the TTS audio's volume in real time with the Web Audio API
  (`AnalyserNode`) and map amplitude → mouth-open amount each frame.
- VRM models expose blend-shape "expressions" (`happy`, `angry`, `sad`,
  `surprised`, `relaxed`). Have your LLM proxy also return a mood label,
  then call `currentVRM.expressionManager.setValue('happy', 1)` etc.

### Step 5 — Polish
- Idle animations (breathing/blink loop) so she doesn't look frozen between
  turns.
- Chat log / subtitle history UI.
- A settings panel (choose voice, language, persona).

### Step 6 — Deploy
- Static site → GitHub Pages (Settings → Pages → deploy from this branch).
- LLM proxy → deploy separately on a serverless free tier; put its URL in
  `main.js`.

---

## Free 3D avatars (VRM format)

VRM is the standard format for anime-style 3D avatars and is what
`@pixiv/three-vrm` (already wired up in `main.js`) loads natively.

- **VRoid Studio** (https://vroid.com/en/studio) — free desktop app to
  *design your own* anime girl character (face, hair, outfit, etc.) and
  export it directly as a `.vrm` file. Best option if you want a unique
  look for Kaguya.
- **VRoid Hub** (https://hub.vroid.com/en) — browse thousands of
  community-made avatars; filter for ones marked downloadable/free, then
  download as `.vrm`.
- **VRM Consortium official samples** — simple, free, redistributable
  sample avatars (`AvatarSample_A`, `AvatarSample_B`, …) published on
  GitHub by the VRM spec maintainers; great for testing your pipeline
  before committing to a final design.
- **BOOTH** (https://booth.pm) — search "VRM 無料" (free VRM); many
  Japanese creators publish free female avatars, each with its own license
  (check whether commercial/streaming use is allowed).

## Free Japanese "girl" TTS

- **VOICEVOX** (https://voicevox.hiroshiba.jp/) — completely free Japanese
  TTS engine with multiple cute character voices (e.g. Shikoku Metan,
  Zundamon, Tsumugi). Runs as a local app exposing an HTTP API at
  `http://localhost:50021`; your page can `fetch()` it while the engine runs
  on the user's machine. Each character has its own credit/usage terms —
  check before publishing recordings.
- **COEIROINK** (https://coeiroink.com/) — similar free local engine with
  female Japanese voices and an HTTP API; same local-server model as
  VOICEVOX.
- **Web Speech API `speechSynthesis`** (already wired up, zero setup) —
  completely free and built into the browser. Quality and which voices are
  available depends on the user's OS: Windows ships Japanese female voices
  like "Microsoft Nanami" / "Haruka", macOS ships "Kyoko". This is the
  easiest option to ship today; VOICEVOX/COEIROINK are the upgrade path
  once you want a more distinctive "anime girl" timbre.

> Note: VOICEVOX/COEIROINK run as local servers, so they can't be hosted
> *for* your visitors on GitHub Pages — they're best for your own
> development/streaming setup, or for visitors willing to run the engine
> locally and point the page at `localhost`. For a TTS that works for every
> visitor with no local install, stick with `speechSynthesis` (Step 2) or
> route TTS through your Step-3 backend proxy to a hosted API.
