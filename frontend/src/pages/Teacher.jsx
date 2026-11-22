import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ConvoWidget from '../components/ConvoWidget';
import PhotoTeacher from '../components/PhotoTeacher';
import FaceIdPanel from '../components/FaceIdPanel';
import { stripMarkdown } from '../lib/md';
import { streamChat } from '../lib/api';
import {
  speak, stopSpeaking, listenOnce, startContinuousListening,
  speechSupported, recognitionSupported,
} from '../lib/speech';
import { store } from '../lib/store';
import { useToast } from '../App';

const STATUS = {
  idle: 'Ready to teach — ask anything, Class 1 to 12',
  listening: 'Listening — speak now',
  thinking: 'Thinking — working out the clearest way to explain it',
  speaking: 'Speaking — tap STOP anytime',
  happy: 'Did that help? Ask a follow-up',
};

const WELCOME = {
  role: 'ai',
  text: 'Hi! I am JARVISH, your AI teacher. Ask me anything, a school question, general knowledge, coding or writing, and I will give you a clear answer. Just speak, or type below.',
};

export default function Teacher() {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const askedRef = useRef(false);

  // A question passed in from the home page (?q=...) gets asked on arrival.
  useEffect(() => {
    const q = searchParams.get('q');
    if (q && !askedRef.current) {
      askedRef.current = true;
      setTimeout(() => send(q), 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [msgs, setMsgs] = useState(() => (store.chat.length ? store.chat : [WELCOME]));
  const [input, setInput] = useState('');
  const [lang, setLang] = useState('en');
  const [subject, setSubject] = useState('Science');
  const [cls, setCls] = useState('Class 8');
  const [busy, setBusy] = useState(false);
  const [speakOn, setSpeakOn] = useState(true);
  const [avatar, setAvatar] = useState('idle');
  const [caption, setCaption] = useState('');
  const [listening, setListening] = useState(false);
  const [continuous, setContinuous] = useState(false);
  const [spokenWordIndex, setSpokenWordIndex] = useState(-1);
  const abortRef = useRef(null);

  // Refs so timers and speech callbacks always see fresh values.
  const avatarRef = useRef('idle');
  const busyRef = useRef(false);
  const langRef = useRef(lang);
  const continuousRef = useRef(false);
  const captionRef = useRef('');
  const listenStopRef = useRef(null);

  useEffect(() => { avatarRef.current = avatar; }, [avatar]);
  useEffect(() => { busyRef.current = busy; }, [busy]);
  useEffect(() => { langRef.current = lang; }, [lang]);
  useEffect(() => { continuousRef.current = continuous; }, [continuous]);
  useEffect(() => { captionRef.current = caption; }, [caption]);

  const setAvatarState = (v) => {
    const next = typeof v === 'function' ? v(avatarRef.current) : v;
    avatarRef.current = next;
    setAvatar(next);
  };

  useEffect(() => { store.chat = msgs; }, [msgs]);
  useEffect(() => () => {
    stopSpeaking();
    if (listenStopRef.current) listenStopRef.current();
    if (abortRef.current) abortRef.current();
  }, []);

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
    setSpokenWordIndex(-1);
  };

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
    let ended = false;
    const finish = () => {
      if (ended) return;
      ended = true;
      setSpokenWordIndex(-1);
      setAvatarState('happy');
      setTimeout(() => setAvatarState((a) => (a === 'happy' ? 'idle' : a)), 4000);
      if (continuousRef.current) setTimeout(() => { if (continuousRef.current) startListeningLoop(); }, 500);
    };
    speak(
      plain,
      lang,
      (charIndex) => {
        const idx = plain.slice(0, charIndex).split(/\s+/).filter(Boolean).length;
        setSpokenWordIndex(idx);
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
      () => {
        setBusy(false);
        if (full.trim()) {
          speakAnswer(full);
        } else {
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

  const clearChat = () => {
    stopSpeaking();
    setMsgs([WELCOME]);
    setCaption('');
  };

  // Face ID recognised the student: greet them by name, out loud and
  // in the chat, then carry on with the normal talk loop.
  const greetStudent = (studentName) => {
    const greeting = `Hi ${studentName}! Great to see you. What should we learn today?`;
    setMsgs((prev) => [...prev, { role: 'ai', text: greeting }]);
    speakAnswer(greeting);
  };

  return (
    <section className="teacher-stage">
      <div className="wrap">
        <p className="kicker"><span className="dot">●</span> AI Teacher</p>
        <h1 className="display display-md teacher-title">Ask. Listen. Learn.</h1>
        <p className="teacher-tagline">Ask anything, learn anything.</p>

        <div className="teacher-area">
          <div className="photo-teacher-wrap">
            <PhotoTeacher speaking={avatar === 'speaking'} listening={listening} wordIndex={spokenWordIndex} />
            <p className="stage-status">{STATUS[avatar] || STATUS.idle}</p>
          </div>
        </div>

        {/* Short spoken answer, plain text only — no card, no overlay. */}
        {caption && <p className="teacher-caption">{caption}</p>}

        {/* START / STOP — continuous talking, no typing needed. */}
        <div className="talk-bar">
          {continuous ? (
            <button className="btn btn-black talk-btn" onClick={stopTalking}>■ STOP</button>
          ) : (
            <button className="btn btn-yellow talk-btn" onClick={startTalking}>▶ START talking</button>
          )}
          <p className="talk-hint">
            {continuous
              ? 'Listening — just speak. I will answer, then listen again. Tap STOP when you are done.'
              : 'Tap START, then just talk to your teacher. No typing needed.'}
          </p>
        </div>

        {/* Face ID: register once, get greeted by name. On-device only. */}
        <div style={{ marginTop: 20 }}>
          <FaceIdPanel onRecognized={greetStudent} />
        </div>

        {/* Ask box */}
        <div className="teacher-ask">
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
        <p className="voice-note">Voice assistant works in Chrome and Edge.</p>
      </div>

      <ConvoWidget
        msgs={msgs}
        busy={busy}
        continuous={continuous}
        listening={listening}
        subject={subject}
        onSubjectChange={setSubject}
        cls={cls}
        onClsChange={setCls}
        lang={lang}
        onLangChange={setLang}
        speakOn={speakOn}
        onSpeakToggle={() => setSpeakOn((v) => !v)}
        onMic={mic}
        onSend={send}
        onSave={() => { store.saveChat(msgs); toast('Chat saved to your dashboard.'); }}
        onClear={clearChat}
      />
    </section>
  );
}
