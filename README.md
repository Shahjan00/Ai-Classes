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
- **Talking 3D teacher** — a Ready Player Me 3D teacher stands in
  one classroom scene with the green board, facing the class. She
  listens, thinks and speaks her answers out loud, her mouth moves with
  every word she says (real lip sync from her viseme blendshapes), she
  blinks, breathes and nods while she talks, her arms hang relaxed at
  her sides, and when a question needs a diagram she steps to the side
  and points at the board while she explains it. The camera never spins
  on its own. A robot teacher stays as a backup. The model is a Ready
  Player Me sample avatar for now; when Shahjan sends his own avatar
  link, it swaps in (see `frontend/src/lib/teacherModel.js`).
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
"What is photosynthesis?" — the teacher answers out loud, her mouth
moves with the words, and she draws the diagram on the green board. If she stays silent,
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
frontend/   React app (all 14 pages, Ready Player Me 3D teacher, speech helpers)
backend/    FastAPI server — /api/chat (SSE), /api/board, /api/notes
```

Built as a demo for Learnzo.
Demo data is labelled as such; this is not the official Learnzo site.
