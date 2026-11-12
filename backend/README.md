# JARVISH demo backend

FastAPI backend for the Learnzo JARVISH recreation — an AI teacher for
Indian school students (Classes 1–12). The Vite + React frontend calls
this server.

## Two modes

- **Demo mode** (default): no API key needed. Answers and notes come
  from built-in templates, streamed token by token exactly like the
  live mode, so the frontend works identically either way.
- **Live mode**: set `GROQ_API_KEY` and answers stream from Groq
  (`openai/gpt-oss-20b`, free tier). Get a key at console.groq.com.

## Run locally

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --port 8000
```

Then open http://localhost:8000/health — it should say
`{"ok": true, "groq": false, "model": "openai/gpt-oss-20b", "mode": "demo"}`
(or `"mode": "live"` with a key set).

To try live mode: `export GROQ_API_KEY=gsk_...` before starting uvicorn
(never commit a real key — `.env` is not in git).

## Endpoints

| Method | Path | Body / response |
|---|---|---|
| GET | `/health` | `{"ok": true, "groq": bool, "model": ..., "mode": "live"\|"demo"}` |
| POST | `/api/chat` | `{"messages": [{"role": "user", "content": "..."}], "subject"?, "cls"?, "lang"?}` — streams SSE lines `data: {"token": "..."}`, ending with `data: {"done": true, "demo": bool}` |
| POST | `/api/notes` | `{"subject": "...", "chapter": "...", "cls": "...", "lang"?}` — returns `{"notes": "<markdown>"}` |

## Deploy on Render (free tier)

1. Push this folder to a GitHub repo.
2. In Render: **New → Web Service**, pick the repo.
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Environment → add `GROQ_API_KEY` with your Groq key (for live mode).
6. Use the Render URL (e.g. `https://jarvish-demo.onrender.com`) as the
   frontend's `VITE_API_URL`.
