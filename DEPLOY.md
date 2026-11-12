# Deploying JARVISH

The code is complete. Two accounts are needed to put it live — both are
quick, but they need Shahjan's own logins, so they are not done yet.

## 1. GitHub repo (to host the code)

The Muse GitHub App cannot create repositories by itself.

1. On github.com, create a new **public** repository named
   `jarvish-rebuild` (empty — no README, no .gitignore).
2. Give the Muse GitHub App access to it:
   https://github.com/apps/meta-muse-ai/installations/new
   (or GitHub Settings → Applications → Meta Muse AI → Repository access →
   add `jarvish-rebuild`).
3. Then push the local repo (6 commits, already in
   `~/workspace/jarvis-rebuild`):
   `git remote add origin https://github.com/Shahjan00/jarvish-rebuild.git`
   `git push -u origin main`

## 2. Frontend — Vercel (free)

1. Connect Vercel to the GitHub repo (import project).
2. Settings: Framework **Vite**, Root Directory `frontend`.
3. Environment variable: `VITE_API_URL` = the backend URL from step 3.
4. Deploy. You get a `jarvish-rebuild.vercel.app` link.

## 3. Backend — Render (free)

1. On render.com, New → Web Service, from the same repo.
2. Root Directory `backend`, Build Command `pip install -r requirements.txt`,
   Start Command `uvicorn main:app --host 0.0.0.0 --port $PORT`.
3. Environment variable: `GROQ_API_KEY` = your Groq key
   (free at https://console.groq.com).
   Without it the backend still works in **demo mode** (built-in answers,
   streamed the same way), and the site shows a
   "Demo mode · no API key yet" pill.
4. Copy the Render URL into Vercel's `VITE_API_URL` and redeploy the
   frontend.

Note: Render free sleeps after inactivity, so the first chat reply after
a while can take ~30 seconds. That is fine for a demo.

## Run locally instead

```bash
cd backend && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add GROQ_API_KEY=... for live AI
uvicorn main:app --port 8000

cd frontend && npm install && npm run dev   # http://localhost:5173
```
