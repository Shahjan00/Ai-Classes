#!/usr/bin/env bash
# Start JARVISH backend + frontend together, with one command.
#   ./start.sh
# Then open http://localhost:5173/#/teacher-ai and ask something.
# Demo mode works with no Groq key: the backend answers from built-in
# templates. Add GROQ_API_KEY to backend/.env for live AI answers.
# Ctrl-C stops both.
set -e
cd "$(dirname "$0")"

if [ ! -d backend/.venv ]; then
  echo "Creating backend venv (first run only)..."
  python3 -m venv backend/.venv
  backend/.venv/bin/pip install -r backend/requirements.txt
fi
if [ ! -d frontend/node_modules ]; then
  echo "Installing frontend deps (first run only)..."
  (cd frontend && npm install)
fi

echo "Starting backend on http://127.0.0.1:8000 ..."
(cd backend && .venv/bin/uvicorn main:app --port 8000 --host 127.0.0.1 > /tmp/jarvish-backend.log 2>&1 &)
BACK_PID=$!
trap 'kill $BACK_PID 2>/dev/null; exit 0' INT TERM EXIT

for _ in $(seq 1 30); do
  if curl -s -o /dev/null -m 2 -X POST http://127.0.0.1:8000/api/chat -H 'Content-Type: application/json' -d '{"messages":[{"role":"user","content":"hi"}],"subject":"Science","cls":"Class 8","lang":"en"}'; then
    echo "Backend is up."
    break
  fi
  sleep 1
done

echo "Starting frontend on http://localhost:5173 ..."
echo "Open http://localhost:5173/#/teacher-ai and ask a question."
(cd frontend && npm run dev -- --host 127.0.0.1 --port 5173)
