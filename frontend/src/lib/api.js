// Backend client. The backend URL comes from VITE_API_URL at build time;
// locally it defaults to the dev server on port 8000.
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function getHealth() {
  try {
    const r = await fetch(BASE + '/health');
    return await r.json();
  } catch {
    return { ok: false, mode: 'offline' };
  }
}

// Stream a chat answer. onToken(text) gets each chunk, onDone(info) at end.
// Returns an abort() function.
export function streamChat({ messages, subject, cls, lang }, onToken, onDone, onError) {
  const ctrl = new AbortController();
  let finished = false;
  const doneOnce = (d) => { if (finished) return; finished = true; onDone(d); };
  fetch(BASE + '/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, subject, cls, lang }),
    signal: ctrl.signal,
  })
    .then(async (res) => {
      if (!res.ok || !res.body) throw new Error('chat failed: ' + res.status);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          try {
            const d = JSON.parse(line.slice(5).trim());
            if (d.token) onToken(d.token);
            if (d.done) doneOnce(d);
          } catch { /* ignore partial lines */ }
        }
      }
      doneOnce({ done: true });
    })
    .catch((e) => { if (e.name !== 'AbortError') onError(e); });
  return () => ctrl.abort();
}

// Ask the backend for a realtime board spec for any question.
// Returns { spec } when a visual helps, { spec: null } when it does not,
// and { error: true } when the backend cannot be reached (the caller then
// falls back to the fixed topics).
export async function fetchBoardSpec(question, subject, cls, lang) {
  try {
    const r = await fetch(BASE + '/api/board', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, subject, cls, lang }),
    });
    if (!r.ok) return { error: true };
    const d = await r.json();
    return { spec: d.board || null };
  } catch {
    return { error: true };
  }
}

export async function getNotes({ subject, chapter, cls, lang }) {
  const r = await fetch(BASE + '/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject, chapter, cls, lang }),
  });
  if (!r.ok) throw new Error('notes failed');
  return await r.json();
}
