// Browser speech, free via the Web Speech API (Chrome / Edge).
// Voice out: speechSynthesis speaks the answer and fires word-boundary
// events, which the avatar uses to animate in time with the words.
// Voice in: SpeechRecognition turns the mic into text.

export function speechSupported() {
  return 'speechSynthesis' in window;
}

export function recognitionSupported() {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

// Pick the best voice for a language: exact locale first, then language.
export function pickVoice(lang) {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  if (lang !== 'hi') {
    const male = voices.find((x) => x.lang && x.lang.startsWith('en') && /male/i.test(x.name));
    if (male) return male;
    const named = voices.find((x) => x.lang && x.lang.startsWith('en') && /david|mark|daniel|alex|fred|james|george/i.test(x.name));
    if (named) return named;
    const google = voices.find((x) => x.lang === 'en-US' && x.name.toLowerCase().includes('google'));
    if (google) return google;
  }
  const want = lang === 'hi' ? ['hi-IN', 'hi'] : ['en-IN', 'en-GB', 'en-US', 'en'];
  for (const code of want) {
    const v = voices.find((x) => x.lang === code);
    if (v) return v;
  }
  for (const code of want) {
    const v = voices.find((x) => x.lang && x.lang.startsWith(code.slice(0, 2)));
    if (v) return v;
  }
  return voices[0];
}

let guessTimer = null;

function clearGuess() {
  if (guessTimer) {
    clearTimeout(guessTimer);
    guessTimer = null;
  }
}

function wordStarts(text) {
  const list = [];
  const re = /\S+/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    list.push({ at: m.index, word: m[0] });
  }
  return list;
}

function gapAfter(word) {
  if (/[.!?]$/.test(word)) return 550;
  if (/[,;:]$/.test(word)) return 220;
  return 60;
}

function wordTime(word) {
  return Math.min(650, 170 + word.length * 45);
}

// Speak text. onBoundary(charIndex) fires per word, onEnd when done.
// Returns a stop() function.
export function speak(text, lang, onBoundary, onEnd) {
  if (!speechSupported()) { onEnd && onEnd(); return () => {}; }
  window.speechSynthesis.cancel();
  clearGuess();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
  const voice = pickVoice(lang);
  if (voice) u.voice = voice;
  u.rate = 0.95;
  u.pitch = 0.8;
  const words = wordStarts(text);
  let realSeen = false;
  let done = false;
  const runWord = (i) => {
    if (done || realSeen || i >= words.length) return;
    if (onBoundary) onBoundary(words[i].at);
    const wait = wordTime(words[i].word) + gapAfter(words[i].word);
    guessTimer = setTimeout(() => runWord(i + 1), wait);
  };
  u.onboundary = (e) => {
    if (e.name !== 'word') return;
    realSeen = true;
    clearGuess();
    if (onBoundary) onBoundary(e.charIndex || 0);
  };
  u.onend = () => { done = true; clearGuess(); onEnd && onEnd(); };
  u.onerror = () => { done = true; clearGuess(); onEnd && onEnd(); };
  window.speechSynthesis.speak(u);
  guessTimer = setTimeout(() => runWord(0), 120);
  return () => { done = true; clearGuess(); window.speechSynthesis.cancel(); };
}

export function stopSpeaking() {
  clearGuess();
  if (speechSupported()) window.speechSynthesis.cancel();
}

// Continuous listening for the START / STOP talk mode.
// Keeps the mic open: every finished sentence is handed to onFinal,
// half-heard words to onInterim. The recogniser restarts itself after
// pauses or quiet errors, until stop() is called. Returns stop().
export function startContinuousListening(lang, onFinal, onInterim, onError) {
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Ctor) { onError && onError('not-supported'); return () => {}; }
  let active = true;
  let rec = null;

  const make = () => {
    const r = new Ctor();
    r.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    r.interimResults = true;
    r.continuous = true;
    r.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) {
          const t = res[0].transcript.trim();
          if (t) onFinal(t);
        } else {
          interim += res[0].transcript;
        }
      }
      if (interim.trim()) onInterim(interim);
    };
    r.onerror = (e) => {
      // Quiet-room errors are normal; the loop restarts itself.
      if (e.error && e.error !== 'no-speech' && e.error !== 'aborted') {
        onError && onError(e.error);
      }
    };
    r.onend = () => {
      if (active) setTimeout(() => { if (active) { rec = make(); rec.start(); } }, 250);
    };
    return r;
  };

  rec = make();
  try { rec.start(); } catch { /* already started */ }
  return () => {
    active = false;
    try { rec.abort(); } catch { /* ignore */ }
  };
}
export function listenOnce(lang, onResult, onError) {
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Ctor) { onError && onError('not-supported'); return null; }
  const rec = new Ctor();
  rec.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
  rec.interimResults = true;
  rec.continuous = false;
  rec.onresult = (e) => {
    let text = '';
    for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
    onResult(text, e.results[e.results.length - 1].isFinal);
  };
  rec.onerror = (e) => onError && onError(e.error || 'error');
  rec.start();
  return rec;
}
