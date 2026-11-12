// Exam Hall — timed sample exam with instant results.
import { useEffect, useRef, useState } from 'react';

const EXAM = {
  id: 'SAMPLE-101', title: 'Science · Light and Sound', minutes: 15,
  qs: [
    { q: 'Why do we see lightning before we hear thunder?', opts: ['Light travels faster than sound', 'Sound travels faster than light', 'Thunder is silent', 'Lightning comes from the ground'], a: 0 },
    { q: 'What is the speed of sound in air?', opts: ['About 343 m/s', 'About 3,00,000 km/s', 'About 150 m/s', 'About 1,000 m/s'], a: 0 },
    { q: 'Which mirror is used in a torch?', opts: ['Concave mirror', 'Plane mirror', 'Convex mirror', 'No mirror'], a: 0 },
    { q: 'Sound cannot travel through?', opts: ['Vacuum', 'Water', 'Steel', 'Air'], a: 0 },
    { q: 'The bouncing back of light is called?', opts: ['Reflection', 'Refraction', 'Absorption', 'Scattering'], a: 0 },
    { q: 'Which of these is a luminous object?', opts: ['The Sun', 'The Moon', 'A mirror', 'A book'], a: 0 },
  ],
};

export default function Exam() {
  const [started, setStarted] = useState(false);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState({});
  const [left, setLeft] = useState(EXAM.minutes * 60);
  const [done, setDone] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (!started || done) return;
    timer.current = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) { clearInterval(timer.current); setDone(true); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer.current);
  }, [started, done]);

  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  const score = EXAM.qs.reduce((s, q, idx) => s + (answers[idx] === q.a ? 1 : 0), 0);

  if (!started) {
    return (
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="wrap" style={{ maxWidth: 720 }}>
          <p className="kicker"><span className="dot">●</span> Exam Hall</p>
          <h1 className="display display-md" style={{ margin: '10px 0 8px' }}>Practice like it is real</h1>
          <p className="lede">Timed exams, instant results, and a pointer to what to revise. This sample exam is {EXAM.minutes} minutes, {EXAM.qs.length} questions.</p>
          <div className="card" style={{ marginTop: 28 }}>
            <span className="num">{EXAM.id}</span>
            <h3>{EXAM.title}</h3>
            <p>{EXAM.minutes} minutes · {EXAM.qs.length} questions · No negative marking in this demo.</p>
            <button className="btn btn-yellow" style={{ marginTop: 16 }} onClick={() => setStarted(true)}>Start exam →</button>
          </div>
        </div>
      </section>
    );
  }

  if (done) {
    return (
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="wrap" style={{ maxWidth: 720 }}>
          <p className="kicker"><span className="dot">●</span> Exam Hall · Result</p>
          <h1 className="display display-lg" style={{ marginTop: 12 }}>{score} / {EXAM.qs.length}</h1>
          <p className="lede">{score === EXAM.qs.length ? 'Perfect score. Well done.' : score >= 4 ? 'Strong. Revise the ones you missed.' : 'Keep practising. Ask the AI Teacher about the ones you missed.'}</p>
          <div style={{ marginTop: 24 }}>
            {EXAM.qs.map((q, idx) => (
              <p key={idx} style={{ margin: '10px 0' }}>
                {answers[idx] === q.a ? '✓' : '✗'} {q.q} <br />
                <span style={{ color: 'var(--ink-soft)', fontSize: 14 }}>Answer: {q.opts[q.a]}</span>
              </p>
            ))}
          </div>
          <button className="btn btn-dark" style={{ marginTop: 20 }} onClick={() => { setStarted(false); setI(0); setAnswers({}); setLeft(EXAM.minutes * 60); setDone(false); }}>Retake exam</button>
        </div>
      </section>
    );
  }

  const q = EXAM.qs[i];
  return (
    <section className="section" style={{ paddingTop: 48 }}>
      <div className="wrap" style={{ maxWidth: 720 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p className="kicker"><span className="dot">●</span> {EXAM.id} · {EXAM.title}</p>
          <span className="pill live"><span className="dot" /> {mm}:{ss} left</span>
        </div>
        <div className="card" style={{ marginTop: 20 }}>
          <span className="num">Question {i + 1} of {EXAM.qs.length}</span>
          <h3 style={{ fontSize: 26, textTransform: 'none', marginTop: 10 }}>{q.q}</h3>
          {q.opts.map((o, idx) => (
            <button
              key={idx}
              className={`quiz-opt ${answers[i] === idx ? 'right' : ''}`}
              onClick={() => setAnswers((a) => ({ ...a, [i]: idx }))}
            >
              {o}
            </button>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
            <button className="btn btn-ghost btn-sm" disabled={i === 0} onClick={() => setI(i - 1)}>← Back</button>
            {i + 1 < EXAM.qs.length
              ? <button className="btn btn-dark btn-sm" onClick={() => setI(i + 1)}>Next →</button>
              : <button className="btn btn-yellow btn-sm" onClick={() => setDone(true)}>Submit exam</button>}
          </div>
        </div>
      </div>
    </section>
  );
}
