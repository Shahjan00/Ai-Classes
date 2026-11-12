// AI Teacher — the core page. The teacher owns the whole page: no card,
// no frame, just her in the middle of a light stage (she wears a black
// suit, so the stage stays light and she reads clearly). Ask a question:
// text-only answers keep her in the center; equations or diagrams send
// her to the side and the green board slides into the center. START / STOP
// for continuous talking, an ask box below, and the full chat experience
// (controls, bubbles, chips, Save chat) lives in the Open convo floating
// window, so the teacher page stays clean.
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import GreenBoard from '../components/GreenBoard';
import ConvoWidget from '../components/ConvoWidget';
import { matchBoardTopic } from '../lib/boardTopics';
import { stripMarkdown } from '../lib/md';
import { streamChat } from '../lib/api';
import {
  speak, stopSpeaking, listenOnce, startContinuousListening,
  speechSupported, recognitionSupported,
} from '../lib/speech';
import { store } from '../lib/store';
import { TEACHER_IMG } from '../lib/teacherImage';
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
  const [layout, setLayout] = useState('center');
  const [boardTopic, setBoardTopic] = useState(null);
  const [boardLine, setBoardLine] = useState(0);
  const abortRef = useRef(null);

  // Refs so timers and speech callbacks always see fresh values.
  const avatarRef = useRef('idle');
  const busyRef = useRef(false);
  const langRef = useRef(lang);
  const continuousRef = useRef(false);
  const boardTopicRef = useRef(null);
  const captionRef = useRef('');
  const listenStopRef = useRef(null);

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

  useEffect(() => { store.chat = msgs; }, [msgs]);
  useEffect(() => () => {
    stopSpeaking();
    if (listenStopRef.current) listenStopRef.current();
    if (abortRef.current) abortRef.current();
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
  };

  // Speak an answer aloud; the board follows the word boundaries.
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
      setAvatarState('happy');
      setTimeout(() => setAvatarState((a) => (a === 'happy' ? 'idle' : a)), 4000);
      if (continuousRef.current) setTimeout(() => { if (continuousRef.current) startListeningLoop(); }, 500);
    };
    speak(
      plain,
      lang,
      (i) => advanceBoardLine(i, plain),
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
      () => {
        setBusy(false);
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

  const clearChat = () => {
    stopSpeaking();
    setMsgs([WELCOME]);
    setCaption('');
    setBoardTopic(null);
    setLayout('center');
  };

  const imgClass = `teacher-img${avatar === 'speaking' ? ' speaking' : ''}${avatar === 'listening' ? ' listening' : ''}`;
  const boardMode = layout === 'board' && boardTopic;

  return (
    <section className="teacher-stage">
      <div className="wrap">
        <p className="kicker"><span className="dot">●</span> AI Teacher</p>
        <h1 className="display display-md teacher-title">Ask. Listen. Learn.</h1>
        <p className="teacher-tagline">Ask anything, learn anything.</p>

        {/* The classroom stage: the teacher owns the whole space. */}
        <div className={`teacher-area ${boardMode ? 'board-mode' : ''}`}>
          {boardMode ? (
            <>
              <div className="teacher-side">
                <img src={TEACHER_IMG} alt="JARVISH, your AI teacher" className={imgClass} />
                <p className="stage-status">{STATUS[avatar] || STATUS.idle}</p>
              </div>
              <GreenBoard topic={boardTopic} activeLine={boardLine} />
            </>
          ) : (
            <div className="teacher-center">
              <img src={TEACHER_IMG} alt="JARVISH, your AI teacher" className={imgClass} />
              <p className="stage-status">{STATUS[avatar] || STATUS.idle}</p>
            </div>
          )}
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
        onStartTalking={startTalking}
        onStopTalking={stopTalking}
      />
    </section>
  );
}
