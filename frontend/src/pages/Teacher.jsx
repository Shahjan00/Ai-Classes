// AI Teacher — the core page. The teacher stands in the CENTER of the
// room with START / STOP for continuous talking. Ask a question: if the
// answer is text-only she stays in the center and talks; if it needs an
// equation or a diagram she steps to the side and explains it on the
// green board, line by line, with her pointer stick.
// Streaming chat (Groq via the backend), voice in (mic) and out
// (spoken answers), and the talking avatar that reacts to every step.
import { useEffect, useMemo, useRef, useState } from 'react';
import Avatar from '../components/Avatar';
import GreenBoard from '../components/GreenBoard';
import { matchBoardTopic } from '../lib/boardTopics';
import { renderMarkdown, stripMarkdown } from '../lib/md';
import { streamChat, getHealth } from '../lib/api';
import {
  speak, stopSpeaking, listenOnce, startContinuousListening,
  speechSupported, recognitionSupported,
} from '../lib/speech';
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

const STATUS = {
  idle: 'Ready to teach — ask anything, Class 1 to 12',
  listening: 'Listening — speak now',
  thinking: 'Thinking — working out the clearest way to explain it',
  speaking: 'Speaking — tap STOP anytime',
  happy: 'Did that help? Ask a follow-up',
};

const WELCOME = {
  role: 'ai',
  text: 'Hi! I am JARVISH, your AI teacher. Ask me anything, a school question, general knowledge, coding or writing, and I will give you a clear answer. Try a chip below, or just speak.',
};

// Highlight the word that contains charIndex inside the caption.
function Caption({ text, activeIndex }) {
  const parts = useMemo(() => {
    if (activeIndex == null || !text) return [{ t: text, on: false }];
    const words = text.split(/(\s+)/);
    let pos = 0;
    return words.map((w) => {
      const start = pos;
      pos += w.length;
      const on = w.trim() !== '' && activeIndex >= start && activeIndex < pos;
      return { t: w, on };
    });
  }, [text, activeIndex]);
  if (!text) return null;
  return (
    <p style={{ margin: '10px 0 0', fontSize: 15, lineHeight: 1.6, color: '#33332e' }}>
      {parts.map((p, i) => (
        <span key={i} style={p.on ? { background: '#ffc700', borderRadius: 4, padding: '0 2px' } : undefined}>
          {p.t}
        </span>
      ))}
    </p>
  );
}

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
  const [continuous, setContinuous] = useState(false);
  const [layout, setLayout] = useState('center');
  const [boardTopic, setBoardTopic] = useState(null);
  const [boardLine, setBoardLine] = useState(0);
  const [mouth, setMouth] = useState(0);
  const logRef = useRef(null);
  const abortRef = useRef(null);

  // Refs so timers and speech callbacks always see fresh values.
  const avatarRef = useRef('idle');
  const busyRef = useRef(false);
  const langRef = useRef(lang);
  const continuousRef = useRef(false);
  const boardTopicRef = useRef(null);
  const captionRef = useRef('');
  const listenStopRef = useRef(null);
  const lastBoundaryRef = useRef(0);

  useEffect(() => { avatarRef.current = avatar; }, [avatar]);
  useEffect(() => { busyRef.current = busy; }, [busy]);
  useEffect(() => { langRef.current = lang; }, [lang]);
  useEffect(() => { continuousRef.current = continuous; }, [continuous]);
  useEffect(() => { boardTopicRef.current = boardTopic; }, [boardTopic]);
  useEffect(() => { captionRef.current = caption; }, [caption]);

  const setAvatarState = (v) => {
    const next = typeof v === 'function' ? v(avatarRef.current) : v;
    avatarRef.current = next;
    setAvatar(next);
  };

  useEffect(() => { getHealth().then(setHealth); }, []);
  useEffect(() => { store.chat = msgs; }, [msgs]);
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [msgs, busy]);
  useEffect(() => () => {
    stopSpeaking();
    if (listenStopRef.current) listenStopRef.current();
    if (abortRef.current) abortRef.current();
  }, []);

  // Mouth drive: spike on every spoken word boundary, gentle movement
  // in between while she talks, closed when she is not talking.
  useEffect(() => {
    const id = setInterval(() => {
      if (avatarRef.current === 'speaking') {
        const since = Date.now() - lastBoundaryRef.current;
        const base = since < 260 ? 0.85 : 0.3 + 0.18 * Math.sin(Date.now() / 170);
        setMouth(Math.min(1, base + Math.random() * 0.12));
      } else {
        setMouth(0);
      }
    }, 100);
    return () => clearInterval(id);
  }, []);

  // Move the pointer to the board line she is explaining right now.
  const advanceBoardLine = (charIndex, plainText) => {
    const topic = boardTopicRef.current;
    if (!topic || !plainText) return;
    const frac = Math.max(0, Math.min(1, charIndex / plainText.length));
    setBoardLine(Math.min(topic.lines.length - 1, Math.floor(frac * topic.lines.length)));
  };

  const stopListeningLoop = () => {
    if (listenStopRef.current) {
      listenStopRef.current();
      listenStopRef.current = null;
    }
    setListening(false);
  };

  const startListeningLoop = () => {
    if (!recognitionSupported()) {
      toast('Voice input needs Chrome or Edge.');
      return;
    }
    stopListeningLoop();
    setListening(true);
    setAvatarState('listening');
    listenStopRef.current = startContinuousListening(
      langRef.current,
      (text) => {
        if (text.trim() && !busyRef.current) send(text);
      },
      (interim) => setInput(interim),
      () => { /* quiet errors auto-restart inside the loop */ },
    );
  };

  const startTalking = () => {
    continuousRef.current = true;
    setContinuous(true);
    toast('Talking mode on — just speak, I am listening.');
    startListeningLoop();
  };

  const stopTalking = () => {
    continuousRef.current = false;
    setContinuous(false);
    stopListeningLoop();
    stopSpeaking();
    setAvatarState('idle');
    setCaption('');
    setActiveWord(null);
    setMouth(0);
  };

  // Speak an answer aloud; the avatar follows the word boundaries.
  const speakAnswer = (text) => {
    const plain = stripMarkdown(text);
    if (!speakOn || !speechSupported() || !plain) {
      setAvatarState('idle');
      if (continuousRef.current) setTimeout(startListeningLoop, 500);
      return;
    }
    stopListeningLoop();
    setAvatarState('speaking');
    setCaption(plain);
    setActiveWord(0);
    let ended = false;
    const finish = () => {
      if (ended) return;
      ended = true;
      setAvatarState('happy');
      setCaption('');
      setActiveWord(null);
      setTimeout(() => setAvatarState((a) => (a === 'happy' ? 'idle' : a)), 4000);
      if (continuousRef.current) setTimeout(() => { if (continuousRef.current) startListeningLoop(); }, 500);
    };
    speak(
      plain,
      lang,
      (i) => {
        lastBoundaryRef.current = Date.now();
        setActiveWord(i);
        advanceBoardLine(i, plain);
      },
      finish,
    );
    // Safety net: headless browsers or missing voices may never fire onend.
    const words = plain.split(/\s+/).length;
    setTimeout(finish, Math.max(8000, words * 500 + 4000));
  };

  const send = (text) => {
    const q = (text || input).trim();
    if (!q || busy) return;
    stopSpeaking();
    stopListeningLoop();
    setCaption('');
    setActiveWord(null);
    // Board or center? A question that needs an equation or a diagram
    // goes to the green board; everything else stays in the center.
    const topic = matchBoardTopic(q);
    if (topic) {
      setBoardTopic(topic);
      setBoardLine(0);
      setLayout('board');
    } else {
      setBoardTopic(null);
      setLayout('center');
    }
    const history = [...msgs.filter((m) => m.role !== 'ai' || m.text !== WELCOME.text), { role: 'user', text: q }];
    setMsgs([...history, { role: 'ai', text: '' }]);
    setInput('');
    setBusy(true);
    setAvatarState('thinking');
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
        else {
          setAvatarState('idle');
          if (continuousRef.current) setTimeout(startListeningLoop, 500);
        }
      },
      () => {
        setBusy(false);
        setAvatarState('idle');
        toast('Could not reach the teacher backend. Is it running?');
        if (continuousRef.current) setTimeout(startListeningLoop, 500);
      },
    );
  };

  const mic = () => {
    if (continuous) { toast('Tap STOP first — talking mode is already listening.'); return; }
    if (!recognitionSupported()) { toast('Voice input needs Chrome or Edge.'); return; }
    if (listening) return;
    setListening(true);
    setAvatarState('listening');
    listenOnce(lang,
      (text, isFinal) => {
        setInput(text);
        if (isFinal) { setListening(false); setAvatarState('idle'); if (text.trim()) send(text); }
      },
      () => { setListening(false); setAvatarState('idle'); toast('Could not hear you, try again.'); },
    );
  };

  const clear = () => {
    stopSpeaking();
    setMsgs([WELCOME]);
    setCaption('');
    setAvatarState('idle');
    setBoardTopic(null);
    setLayout('center');
  };

  const pointLevel = boardTopic && boardTopic.lines.length > 1
    ? boardLine / (boardTopic.lines.length - 1)
    : 0;

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

        {/* The classroom stage: teacher in the center, or teacher at the
            side with the green board in the center. */}
        <div className={`stage ${layout === 'board' ? 'stage-board' : 'stage-center'}`} style={{ marginTop: 28 }}>
          {layout === 'board' && boardTopic ? (
            <>
              <div className="teacher-side">
                <Avatar state={avatar} mouth={mouth} pointing pointLevel={pointLevel} />
                <p className="stage-status">{STATUS[avatar] || STATUS.idle}</p>
              </div>
              <GreenBoard topic={boardTopic} activeLine={boardLine} />
            </>
          ) : (
            <div className="teacher-center">
              <Avatar state={avatar} mouth={mouth} />
              <p className="stage-status">{STATUS[avatar] || STATUS.idle}</p>
            </div>
          )}
        </div>

        {/* START / STOP — continuous talking, no typing needed. */}
        <div className="talk-bar">
          {continuous ? (
            <button className="btn btn-dark talk-btn" onClick={stopTalking}>■ STOP</button>
          ) : (
            <button className="btn btn-yellow talk-btn" onClick={startTalking}>▶ START talking</button>
          )}
          <p className="talk-hint">
            {continuous
              ? 'Listening — just speak. I will answer, then listen again. Tap STOP when you are done.'
              : 'Tap START, then just talk to your teacher. No typing needed.'}
          </p>
        </div>

        {caption && (
          <div className="caption-box">
            <span className="pill live"><span className="dot" /> JARVISH is speaking</span>
            <Caption text={caption} activeIndex={activeWord} />
          </div>
        )}

        {/* Controls */}
        <div className="card controls-row" style={{ marginTop: 20 }}>
          <div className="field">
            <label>Subject</label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)}>
              {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="field">
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
          <div className="field">
            <label>Voice</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className={`chip ${speakOn ? 'on' : ''}`} onClick={() => { setSpeakOn(!speakOn); if (speakOn) stopSpeaking(); }}>
                🔊 {speakOn ? 'Voice on' : 'Voice off'}
              </button>
              <button className="chip" onClick={clear}>Clear chat</button>
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className="chat-box" style={{ marginTop: 20 }}>
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
    </section>
  );
}
