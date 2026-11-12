# JARVISH frontend

Vite + React. The whole site is one app with hash routing (like the
original): Home, AI Teacher, Notes Maker, Coding Lab, Quiz Centre,
Progress, Teacher and Student dashboards, Programme, Schools, Exam Hall,
About, Contact, Login.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build into dist/
```

The chat and notes pages talk to the FastAPI backend in `../backend`
(default `http://localhost:8000`). Point at a deployed backend with
`VITE_API_URL`, e.g. `VITE_API_URL=https://your-backend.onrender.com`.

## How the pieces fit

- `src/pages/` — one file per page, plain React, no extra libraries.
- `src/components/Avatar.jsx` — the talking avatar. Its state machine
  (idle / listening / thinking / speaking / happy) is driven by the chat
  page and by speech-synthesis word-boundary events.
- `src/lib/speech.js` — browser speech in/out (Web Speech API, free).
- `src/lib/api.js` — backend calls, including the SSE chat stream.
- `src/lib/md.js` — a tiny safe Markdown renderer (no raw `**bold**` leaks).
- `src/lib/store.js` — localStorage for the demo user, chat and progress.
- `src/lib/avatarData.js` — the teacher photo inlined as a data URI so
  the hero visual works even where image CDNs are blocked.

## Smoke test

```bash
npm run build
# with the backend running on :8000 and `vite preview` on :4173:
node smoke-test.cjs
```

It drives the real site in headless Chromium: asks the AI Teacher a
question, waits for the streamed answer, generates notes and answers
a quiz question.
