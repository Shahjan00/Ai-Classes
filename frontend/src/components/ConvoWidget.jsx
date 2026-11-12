// Open convo — a small pill button fixed at the bottom-right of the
// Teacher page. Tap it and a small floating chat window pops up with the
// FULL chat experience: START talking, subject/class/language/voice
// controls, chat bubbles, quick chips and the ask input. "Save chat"
// stores it on the user dashboard (localStorage, via store.js) so it
// shows up under Saved chats. The controls live here, not on the main
// teacher view, so the teacher page stays clean.
import { useEffect, useRef, useState } from 'react';
import { stripMarkdown } from '../lib/md';

export const SUBJECTS = ['Science', 'Maths', 'English', 'Social Science', 'Hindi', 'Computer Science'];
export const CLASSES = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
export const CHIPS = [
  'Explain photosynthesis simply',
  'Why do we see lightning before we hear thunder?',
  'Give me a fractions example',
  "What is Newton's first law?",
];

export default function ConvoWidget(props) {
  const {
    msgs, busy, continuous, listening,
    subject, onSubjectChange, cls, onClsChange,
    lang, onLangChange, speakOn, onSpeakToggle,
    onMic, onSend, onSave, onClear, onStartTalking, onStopTalking,
  } = props;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);
  const logRef = useRef(null);

  useEffect(() => {
    if (open && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [msgs, open]);

  const submit = () => {
    const t = draft.trim();
    if (!t || busy) return;
    setDraft('');
    onSend(t);
  };

  const save = () => {
    onSave();
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  return (
    <>
      <button
        type="button"
        className="convo-fab"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? '✕ Close convo' : '💬 Open convo'}
      </button>

      {open && (
        <div className="convo-window" role="dialog" aria-label="Conversation with your AI teacher">
          <div className="convo-head">
            <strong>Conversation</strong>
            <span className="convo-head-actions">
              <button type="button" className="btn btn-ghost btn-sm" onClick={save}>
                {savedFlash ? '✓ Saved' : 'Save chat'}
              </button>
              <button type="button" className="convo-close" onClick={() => setOpen(false)} aria-label="Close">✕</button>
            </span>
          </div>

          <div className="convo-talk">
            {continuous ? (
              <button type="button" className="btn btn-black" onClick={onStopTalking}>■ STOP</button>
            ) : (
              <button type="button" className="btn btn-yellow" onClick={onStartTalking}>▶ START talking</button>
            )}
            <span className="convo-talk-hint">
              {continuous ? (listening ? 'Listening — just speak.' : 'Thinking…') : 'Tap START, then just talk to your teacher. No typing needed.'}
            </span>
          </div>

          <div className="convo-controls">
            <label className="convo-field">
              <span>Subject</span>
              <select value={subject} onChange={(e) => onSubjectChange(e.target.value)}>
                {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label className="convo-field">
              <span>Class</span>
              <select value={cls} onChange={(e) => onClsChange(e.target.value)}>
                {CLASSES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <div className="convo-field">
              <span>Language</span>
              <span className="seg">
                <button type="button" className={lang === 'en' ? 'on' : ''} onClick={() => onLangChange('en')}>English</button>
                <button type="button" className={lang === 'hi' ? 'on' : ''} onClick={() => onLangChange('hi')}>हिन्दी</button>
              </span>
            </div>
            <div className="convo-field">
              <span>Voice</span>
              <span className="convo-voice-row">
                <button type="button" className={`btn btn-sm ${speakOn ? 'btn-black' : 'btn-ghost'}`} onClick={onSpeakToggle}>
                  🔊 Voice {speakOn ? 'on' : 'off'}
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={onClear}>Clear chat</button>
              </span>
            </div>
          </div>

          <div className="convo-log" ref={logRef}>
            {msgs.length === 0 && (
              <p className="convo-empty">No messages yet. Ask your teacher anything, or tap START and just talk.</p>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={`convo-bubble ${m.role === 'user' ? 'user' : 'ai'}`}>
                {m.role === 'ai' && <span className="convo-ai-label">✦ LIVE AI RESPONSE</span>}
                <p>{stripMarkdown(m.text)}</p>
              </div>
            ))}
            {busy && <p className="convo-typing">Your teacher is thinking…</p>}
          </div>

          <div className="convo-chips">
            {CHIPS.map((c) => (
              <button key={c} type="button" className="chip" onClick={() => onSend(c)} disabled={busy}>
                {c}
              </button>
            ))}
          </div>

          <div className="convo-input">
            <button type="button" className="mic-btn" onClick={onMic} aria-label="Speak">🎙️</button>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
              placeholder="Ask me anything…"
              aria-label="Ask your teacher"
            />
            <button type="button" className="send-btn" onClick={submit} disabled={busy} aria-label="Send">↑</button>
          </div>
        </div>
      )}
    </>
  );
}
