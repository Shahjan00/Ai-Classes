import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ConvoWidget from '../components/ConvoWidget';
import PhotoTeacher from '../components/PhotoTeacher';
import FaceIdPanel from '../components/FaceIdPanel';
import { stripMarkdown } from '../lib/md';
import { streamChat, askVision } from '../lib/api';
import { captureFrame, getActiveVideo, startCamera } from '../lib/faceId';
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

const GREETING = 'Hi! I am an AI teacher. I can answer your questions and clear your doubts. I can give answers from class 1 to 12. How can I help you?';

function isVisualQuestion(q) {
  const text = (q || '').toLowerCase();
  if (/(shirt|tshirt|t-shirt|colour|color|wearing|outfit|glasses|webcam|camera|background|scene)/.test(text)) return true;
  if (/(what am i|am i wearing|do i look|can you see|what do you see|what you see|you are seeing|seeing right now|look at me|see me|behind me|my face|my hair|what colour|what color|describe what you see|describe the scene|describe me|describe my|in front of|around me|what are you seeing|can you look)/.test(text)) return true;
  return false;
}

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
  const [spokenWord, setSpokenWord] = useState('');
  const [isQuestion, setIsQuestion] = useState(false);
  const abortRef = useRef(null);

  // Refs so timers and speech callbacks always see fresh values.
  const avatarRef = useRef('idle');
  const busyRef = useRef(false);
  const langRef = useRef(lang);
  const continuousRef = useRef(false);
  const captionRef = useRef('');
  const msgsRef = useRef(msgs);
  const listenStopRef = useRef(null);
  const teacherVideoRef = useRef(null);
  const lastGreetRef = useRef({ name: null, at: 0 });
  const knownNameRef = useRef(null);

  useEffect(() => { avatarRef.current = avatar; }, [avatar]);
  useEffect(() => { busyRef.current = busy; }, [busy]);
  useEffect(() => { langRef.current = lang; }, [lang]);
  useEffect(() => { continuousRef.current = continuous; }, [continuous]);
  useEffect(() => { captionRef.current = caption; }, [caption]);
  useEffect(() => { msgsRef.current = msgs; }, [msgs]);

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

  const openTeacherCamera = async () => {
    const videoEl = teacherVideoRef.current;
    if (!videoEl) return false;
    try {
      await startCamera(videoEl);
      await new Promise((r) => setTimeout(r, 900));
      const active = getActiveVideo();
      return !!(active && active.videoWidth);
    } catch {
      return false;
    }
  };

  const startTalking = () => {
    continuousRef.current = true;
    setContinuous(true);
    setMsgs((prev) => [...prev, { role: 'ai', text: GREETING }]);
    speakAnswer(GREETING);
  };

  const stopTalking = () => {
    continuousRef.current = false;
    setContinuous(false);
    stopListeningLoop();
    stopSpeaking();
    setAvatarState('idle');
    setCaption('');
    setSpokenWordIndex(-1);
    setSpokenWord('');
    setIsQuestion(false);
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
      setSpokenWord('');
      setIsQuestion(false);
      setAvatarState('happy');
      setTimeout(() => setAvatarState((a) => (a === 'happy' ? 'idle' : a)), 4000);
      if (continuousRef.current) setTimeout(() => { if (continuousRef.current) startListeningLoop(); }, 500);
    };
    speak(
      plain,
      lang,
      (charIndex) => {
        const words = plain.split(/\s+/);
        const idx = plain.slice(0, charIndex).split(/\s+/).filter(Boolean).length;
        setSpokenWordIndex(idx);
        setSpokenWord(words[idx] || '');
        const rest = plain.slice(charIndex);
        const m = rest.match(/[.!?]/);
        setIsQuestion(!!m && m[0] === '?');
      },
      finish,
    );
    // Safety net: headless browsers or missing voices may never fire onend.
    const words = plain.split(/\s+/).length;
    setTimeout(finish, Math.max(8000, words * 500 + 4000));
  };

  const send = async (text) => {
    const q = (text || input).trim();
    if (!q || busy) return;
    stopSpeaking();
    stopListeningLoop();
    setCaption('');
    if (isVisualQuestion(q)) {
      let videoEl = getActiveVideo();
      if (!videoEl || !videoEl.videoWidth) {
        setBusy(true);
        setAvatarState('thinking');
        const opened = await openTeacherCamera();
        videoEl = getActiveVideo();
        if (!opened || !videoEl || !videoEl.videoWidth) {
          setBusy(false);
          const note = 'Turn on the class camera first, then ask me. I need to see you to answer that.';
          setMsgs((prev) => [...prev, { role: 'user', text: q }, { role: 'ai', text: note }]);
          setInput('');
          speakAnswer(note);
          return;
        }
      }
      const frame = captureFrame();
      if (!frame) {
        const note = 'I could not see the camera frame. Try again.';
        setMsgs((prev) => [...prev, { role: 'user', text: q }, { role: 'ai', text: note }]);
        setInput('');
        speakAnswer(note);
        return;
      }
      const vhistory = [...msgsRef.current.filter((m) => m.role !== 'ai' || m.text !== WELCOME.text), { role: 'user', text: q }];
      setMsgs([...vhistory, { role: 'ai', text: '' }]);
      setInput('');
      setBusy(true);
      setAvatarState('thinking');
      askVision({ image: frame, question: q, lang })
        .then((d) => {
          const answer = (d && d.answer ? String(d.answer) : '').trim() || 'I could not see that clearly.';
          setMsgs((prev) => {
            const next = [...prev];
            next[next.length - 1] = { role: 'ai', text: answer };
            return next;
          });
          setBusy(false);
          speakAnswer(answer);
        })
        .catch(() => {
          setBusy(false);
          setAvatarState('idle');
          toast('Could not reach the teacher backend. Is it running?');
          if (continuousRef.current) setTimeout(startListeningLoop, 500);
        });
      return;
    }
    const history = [...msgsRef.current.filter((m) => m.role !== 'ai' || m.text !== WELCOME.text), { role: 'user', text: q }];
    setMsgs([...history, { role: 'ai', text: '' }]);
    setInput('');
    setBusy(true);
    setAvatarState('thinking');
    let full = '';
    const chatMessages = history.map((m) => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text }));
    if (knownNameRef.current) {
      chatMessages.unshift({ role: 'system', content: `The student you are talking to is named ${knownNameRef.current}. If they ask their name, tell them. Use their name naturally.` });
    }
    abortRef.current = streamChat(
      { messages: chatMessages, subject, cls, lang },
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
    const now = Date.now();
    const last = lastGreetRef.current;
    if (last.name === studentName && now - last.at < 60000) return;
    lastGreetRef.current = { name: studentName, at: now };
    knownNameRef.current = studentName;
    const greeting = `Hi ${studentName}, what can I help you with?`;
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
            <PhotoTeacher speaking={avatar === 'speaking'} listening={listening} wordIndex={spokenWordIndex} word={spokenWord} isQuestion={isQuestion} />
            <p className="stage-status">{STATUS[avatar] || STATUS.idle}</p>
          </div>
          <video ref={teacherVideoRef} muted playsInline aria-hidden="true" style={{ width: 1, height: 1, opacity: 0, position: 'absolute', pointerEvents: 'none' }} />
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
