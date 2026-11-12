// Talking avatar — the headline feature of this rebuild.
// A real person photo (not the robot illustration the original used).
// States: idle / listening / thinking / speaking / happy.
// Lip-sync is driven by the browser's speech output: speechSynthesis
// fires a boundary event per word, so the photo bobs, the ring pulses
// and the live caption highlights the word being spoken, all in time.
// A true phoneme-level mouth needs a video avatar model; this is the
// honest browser-only version, and it reads as alive in the demo.
import { useMemo } from 'react';
import { AVATAR_SRC } from '../lib/avatarData';

const LABELS = {
  idle: { label: 'Ready to teach', sub: 'Ask anything, Class 1 to 12, in English or Hindi.' },
  listening: { label: 'Listening', sub: 'Speak now, I am hearing you.' },
  thinking: { label: 'Thinking', sub: 'Working out the clearest way to explain it.' },
  speaking: { label: 'Speaking', sub: 'Tap the speaker icon to stop me anytime.' },
  happy: { label: 'Did that help?', sub: 'Ask a follow-up, or try a checkpoint quiz.' },
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
    <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.55, color: '#33332e' }}>
      {parts.map((p, i) => (
        <span key={i} style={p.on ? { background: '#ffc700', borderRadius: 4, padding: '0 2px' } : undefined}>
          {p.t}
        </span>
      ))}
    </p>
  );
}

export default function Avatar({ state = 'idle', caption, activeIndex, compact = false }) {
  const info = LABELS[state] || LABELS.idle;
  const waveOn = state === 'speaking' || state === 'listening';
  return (
    <div style={{ position: 'relative' }}>
      <div className="avatar-badge" style={{ top: -14, left: 18, zIndex: 2 }}><span className="dot" /> Live AI</div>
      <div className={`avatar-frame ${state}`}>
        <img src={AVATAR_SRC} alt="JARVISH, your AI teacher" />
        <div className="ring" />
        <div className="avatar-state">
          <div className={`wave ${waveOn ? 'on' : ''}`}><i /><i /><i /><i /><i /></div>
          <div>
            <div className="label">{info.label}</div>
            <div className="sub">{info.sub}</div>
          </div>
        </div>
      </div>
      {!compact && caption && (
        <div style={{ marginTop: 14 }}>
          <span className="pill live"><span className="dot" /> JARVISH is speaking</span>
          <Caption text={caption} activeIndex={activeIndex} />
        </div>
      )}
    </div>
  );
}
