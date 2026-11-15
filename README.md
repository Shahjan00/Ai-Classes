# JARVISH — AI Teacher for Every Classroom

A recreation of the Learnzo **JARVISH** demo (AI teaching platform for Indian
schools, Classes 1–12), rebuilt from scratch with the original's bugs fixed
and the headline features made real.

**Live demo:** _(link added after deploy)_
**Original site analysed:** https://jarvis-rust-phi.vercel.app/

## What it does

- **AI Teacher** — ask anything, Class 1–12, in English or Hindi. Answers
  stream in from Groq (`openai/gpt-oss-20b`), rendered as clean Markdown
  (never raw `**bold**`).
- **Talking 3D teacher** — Marina, a real 3D scanned teacher, stands in
  the classroom. She listens, thinks and speaks her answers out loud,
  sways gently while she talks, and steps to the side to explain on a
  green board when a question needs a diagram or an equation. Her mouth
  does not move (she is a static 3D scan, not a video), so she talks
  with her voice, not lip sync. A robot teacher stays as a backup.
- **Hindi voice** — ask in Hindi, get a Hindi answer spoken aloud (hi-IN
  voice). Voice input via the browser's Web Speech API. Free.
- **Notes Maker** — chapter notes in minutes, by class, subject and language.
- **Coding Lab** — real Python in the browser (Pyodide / WebAssembly), with
  lessons mapped to classes and a test to pass.
- **Quiz Centre, Exam Hall, Progress / Teacher / Student dashboards** —
  all working with local progress.
- **Programme, Schools, About, Contact, Login** — the full original site.

## What was fixed vs the original

- Student Dashboard no longer shows "Sign in" + a stuck "Loading…" card +
  a Logout button at the same time. It shows real state immediately.
- Toasts auto-dismiss after 3 seconds (the original's stuck around forever).
- Notes Maker no longer demands sign-in while chat stays open.
- AI answers no longer leak raw Markdown.
- Slow fade-ins that left text near-invisible are gone.

## Run it

One command starts the backend and the frontend together:

```bash
./start.sh   # then open http://localhost:5173/#/teacher-ai
```

First run only, it creates the backend venv, installs backend and
frontend deps. After that it just starts both. Ctrl-C stops both.

Or run them by hand in two terminals:

```bash
# backend (needs a Groq key for live AI; works without one in demo mode)
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then put GROQ_API_KEY=... in .env
uvicorn main:app --port 8000

# frontend
cd frontend
npm install
npm run dev            # http://localhost:5173
```

Without a Groq key the backend serves built-in template answers, streamed
the same way, and the site shows a "Demo mode · no API key yet" pill.
Get a free key at https://console.groq.com.

Check it works: open http://localhost:5173/#/teacher-ai, ask
"What is photosynthesis?" — Marina answers out loud, sways while she
talks, and draws the diagram on the green board. If she stays silent,
the backend is not running: start it with `./start.sh` and try again.

## Deploy

- Frontend: Vercel (free). Set `VITE_API_URL` to the backend URL.
- Backend: Render free tier. Set `GROQ_API_KEY` in the environment.
  (Render free sleeps after inactivity, so the first reply can take ~30s.)

## Stack

Vite + React frontend, FastAPI + Groq backend, Web Speech API for voice,
Pyodide for Python in the browser. Fonts are self-hosted (Archivo + Inter).

## Structure

```
frontend/   React app (all 14 pages, Marina 3D teacher, speech helpers)
backend/    FastAPI server — /api/chat (SSE), /api/board, /api/notes
```

Built as a demo for Learnzo.
Demo data is labelled as such; this is not the official Learnzo site.
