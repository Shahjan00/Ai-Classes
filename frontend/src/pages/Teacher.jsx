// AI Teacher — the core page. Streaming chat (Groq via the backend),
// rendered Markdown answers, voice in (mic) and out (spoken answers),
// and the talking avatar that reacts to every step.
import { useEffect, useRef, useState } from 'react';
import Avatar from '../components/Avatar';
import { renderMarkdown } from '../lib/md';
import { streamChat, getHealth } from '../lib/api';
import { speak, stopSpeaking, listenOnce, speechSupported, recognitionSupported } from '../lib/speech';
import { store } from '../lib/store';
import { useToast } from '../App';

const SUBJECTS = ['Science', 'Maths', 'English', 'Hindi', 'Social Science', 'Coding'];
const CLASSES = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
const CHIPS = [
  'Explain photosynthesis simply',
  'Why do we see lightning before we hear thunder?',
  'Give me a fractions example',
  'What is Newton’s first law?',
];

const WELCOME = {
  role: 'ai',
  text: 'Hi! I am JARVISH, your AI teacher. Ask me anything, a school question, general knowledge, coding or writing, and I will give you a clear answer. Try a chip below, or just speak.',
};

export default function Teacher() {
  const toast = useToast();
  const [msgs, setMsgs] = useState(() => (store.chat.length ? store.chat : [WELCOME]));
  const [input, setInput] = useState('');
  const [subject, setSubject] = useState('Science');
  const [cls, setCls] = useState('Class 8');
  const [lang, setLang] = useState('en');
  const [busy, setBusy] = useState(false);
  const [speakOn, setSpeakOn] = useState(true);
  const [avatar, setAvatar] = useState('idle');
  const [caption, setCaption] = useState('');
  const [activeWord, setActiveWord] = useState(null);
  const [health, setHealth] = useState(null);
  const [listening, setListening] = useState(false);
  const logRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => { getHealth().then(setHealth); }, []);
  useEffect(() => { store.chat = msgs; }, [msgs]);
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [msgs, busy]);
  useEffect(() => () => { stopSpeaking(); abortRef.current && abortRef.current(); }, []);

  // Speak an answer aloud; the avatar follows the word boundaries.
  const speakAnswer = (text) => {
    if (!speakOn || !speechSupported()) return;
    setAvatar('speaking');
    setCaption(text);
    setActiveWord(0);
    let ended = false;
    const finish = () => {
      if (ended) return;
      ended = true;
      setAvatar('happy');
      setCaption('');
      setActiveWord(null);
      setTimeout(() => setAvatar((a) => (a === 'happy' ? 'idle' : a)), 4000);
    };
    speak(text, lang, (i) => setActiveWord(i), finish);
    // Safety net: headless browsers or missing voices may never fire onend.
    const words = text.split(/\s+/).length;
    setTimeout(finish, Math.max(8000, words * 500 + 4000));
  };

  const send = (text) => {
    const q = (text || input).trim();
    if (!q || busy) return;
    stopSpeaking();
    setCaption('');
    const history = [...msgs.filter((m) => m.role !== 'ai' || m.text !== WELCOME.text), { role: 'user', text: q }];
    setMsgs([...history, { role: 'ai', text: '' }]);
    setInput('');
    setBusy(true);
    setAvatar('thinking');
    let full = '';
    abortRef.current = streamChat(
      { messages: history.map((m) => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text })), subject, cls, lang },
      (tok) => {
        full += tok;
        setMsgs((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: 'ai', text: full };
          return next;
        });
      },
      (info) => {
        setBusy(false);
        if (info && info.demo) toast('Demo mode: set GROQ_API_KEY on the backend for live AI answers.');
        if (full.trim()) speakAnswer(full);
        else setAvatar('idle');
      },
      () => { setBusy(false); setAvatar('idle'); toast('Could not reach the teacher backend. Is it running?'); },
    );
  };

  const mic = () => {
    if (!recognitionSupported()) { toast('Voice input needs Chrome or Edge.'); return; }
    if (listening) return;
    setListening(true);
    setAvatar('listening');
    listenOnce(lang,
      (text, isFinal) => {
        setInput(text);
        if (isFinal) { setListening(false); setAvatar('idle'); if (text.trim()) send(text); }
      },
      () => { setListening(false); setAvatar('idle'); toast('Could not hear you, try again.'); },
    );
  };

  const clear = () => { stopSpeaking(); setMsgs([WELCOME]); setCaption(''); setAvatar('idle'); };

  return (
    <section className="section" style={{ paddingTop: 48 }}>
      <div className="wrap">
        <p className="kicker"><span className="dot">●</span> AI Teacher</p>
        <h1 className="display display-md" style={{ margin: '10px 0 8px' }}>Ask. Listen. Learn.</h1>
        <p className="lede">Your AI teacher answers in simple words, out loud, in English or Hindi.</p>
        <div style={{ marginTop: 12 }}>
          <span className={`pill ${health && health.ok ? 'live' : ''}`}>
            <span className="dot" style={health && health.ok ? undefined : { background: 'var(--red)' }} />
            {health ? (health.ok ? (health.mode === 'live' ? 'Live AI · Groq' : 'Demo mode · no API key yet') : 'Backend offline') : 'Checking backend…'}
          </span>
        </div>

        <div className="chat-shell" style={{ marginTop: 28 }}>
          <div>
            <Avatar state={avatar} caption={caption} activeIndex={activeWord} />
            <div className="card" style={{ marginTop: 20 }}>
              <div className="field" style={{ marginBottom: 14 }}>
                <label>Subject</label>
                <select value={subject} onChange={(e) => setSubject(e.target.value)}>
                  {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="field" style={{ marginBottom: 14 }}>
                <label>Class</label>
                <select value={cls} onChange={(e) => setCls(e.target.value)}>
                  {CLASSES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Language</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className={`chip ${lang === 'en' ? 'on' : ''}`} onClick={() => setLang('en')}>English</button>
                  <button className={`chip ${lang === 'hi' ? 'on' : ''}`} onClick={() => setLang('hi')}>हिन्दी</button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
                <button className={`chip ${speakOn ? 'on' : ''}`} onClick={() => { setSpeakOn(!speakOn); if (speakOn) stopSpeaking(); }}>
                  🔊 {speakOn ? 'Voice on' : 'Voice off'}
                </button>
                <button className="chip" onClick={clear}>Clear chat</button>
              </div>
            </div>
          </div>

          <div className="chat-box">
            <div className="chat-log" ref={logRef}>
              {msgs.map((m, i) => (
                <div key={i} className={`msg ${m.role === 'user' ? 'user' : 'ai'}`}>
                  {m.role === 'ai' && <span className="tag">✦ Live AI response</span>}
                  {m.role === 'ai'
                    ? (m.text ? <div dangerouslySetInnerHTML={{ __html: renderMarkdown(m.text) }} /> : <span className="typing"><i /><i /><i /></span>)
                    : m.text}
                </div>
              ))}
              {busy && null}
            </div>
            <div style={{ padding: '0 16px 12px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CHIPS.map((c) => (
                <button key={c} className="chip" onClick={() => send(c)} disabled={busy}>{c}</button>
              ))}
            </div>
            <div className="chat-input">
              <button className={`icon-btn ${listening ? 'on' : ''}`} onClick={mic} title="Speak" aria-label="Speak">🎙️</button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
                placeholder={lang === 'hi' ? 'अपना सवाल पूछें…' : 'Ask me anything…'}
                disabled={busy}
              />
              <button className="send-btn" onClick={() => send()} disabled={busy || !input.trim()} aria-label="Send">↑</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
