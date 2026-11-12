// Quiz Centre — three ready-made 5-question sets. Working flow: answer,
// next, score at the end, saved to progress.
import { useState } from 'react';
import { store } from '../lib/store';

const SETS = [
  {
    id: 'ml', title: 'ML Basics', cls: 'Class 9', qs: [
      { q: 'What does AI stand for?', opts: ['Artificial Intelligence', 'Automatic Internet', 'Advanced Information', 'Artificial Internet'], a: 0 },
      { q: 'Which of these is an example of machine learning?', opts: ['A calculator adding numbers', 'A spam filter learning from examples', 'A light switch', 'A printed book'], a: 1 },
      { q: 'What is training data?', opts: ['Data used to test a model', 'Data used to teach a model', 'Data stored in a printer', 'Data deleted after use'], a: 1 },
      { q: 'Which is a neural network inspired by?', opts: ['The human brain', 'A bicycle', 'A river', 'A clock'], a: 0 },
      { q: 'What should you check before trusting an AI answer?', opts: ['Nothing, AI is always right', 'A reliable source', 'The font size', 'The time of day'], a: 1 },
    ],
  },
  {
    id: 'sci', title: 'Light and Sound', cls: 'Class 8', qs: [
      { q: 'Why do we see lightning before we hear thunder?', opts: ['Light travels faster than sound', 'Sound travels faster than light', 'Thunder comes from clouds', 'Lightning is silent'], a: 0 },
      { q: 'What is the speed of light in vacuum?', opts: ['3,00,000 km/s', '340 m/s', '150 km/s', '1,00,000 km/s'], a: 0 },
      { q: 'Sound needs what to travel?', opts: ['A vacuum', 'A medium like air', 'Darkness', 'Electricity'], a: 1 },
      { q: 'Which mirror is used in a car headlight?', opts: ['Plane mirror', 'Concave mirror', 'Convex mirror', 'No mirror'], a: 1 },
      { q: 'The bouncing back of light is called?', opts: ['Refraction', 'Reflection', 'Absorption', 'Diffraction'], a: 1 },
    ],
  },
  {
    id: 'math', title: 'Fractions', cls: 'Class 6', qs: [
      { q: 'What is 1/2 + 1/4?', opts: ['3/4', '2/6', '1/6', '2/4'], a: 0 },
      { q: 'Which fraction is biggest?', opts: ['1/2', '1/4', '1/8', '1/10'], a: 0 },
      { q: 'What is 3/4 of 20?', opts: ['12', '15', '10', '18'], a: 1 },
      { q: 'Simplify 6/8.', opts: ['3/4', '2/3', '6/8', '1/2'], a: 0 },
      { q: 'What is 2/5 as a decimal?', opts: ['0.2', '0.25', '0.4', '0.5'], a: 2 },
    ],
  },
];

export default function Quiz() {
  const [set, setSet] = useState(SETS[0]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const scores = store.quizScores;

  const pickSet = (s) => { setSet(s); setI(0); setPicked(null); setScore(0); setDone(false); };
  const answer = (idx) => {
    if (picked !== null) return;
    setPicked(idx);
    if (idx === set.qs[i].a) setScore((s) => s + 1);
  };
  const next = () => {
    if (i + 1 >= set.qs.length) {
      const finalScore = score + (picked === set.qs[i].a ? 1 : 0);
      store.saveQuizScore(set.id, finalScore, set.qs.length);
      setDone(true);
    } else {
      setI(i + 1);
      setPicked(null);
    }
  };

  const q = set.qs[i];
  return (
    <section className="section" style={{ paddingTop: 48 }}>
      <div className="wrap">
        <p className="kicker"><span className="dot">●</span> Quiz Centre</p>
        <h1 className="display display-md" style={{ margin: '10px 0 8px' }}>Check what you got</h1>
        <p className="lede">Short quizzes after every chapter. Scores save to your progress.</p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 28 }}>
          {SETS.map((s) => (
            <button key={s.id} className={`chip ${set.id === s.id ? 'on' : ''}`} onClick={() => pickSet(s)}>
              {s.title} · {s.cls}{scores[s.id] ? ` · best ${scores[s.id].score}/${scores[s.id].total}` : ''}
            </button>
          ))}
        </div>

        <div className="card" style={{ marginTop: 24, maxWidth: 720 }}>
          {!done ? (
            <>
              <span className="num">Question {i + 1} of {set.qs.length} · {set.title}</span>
              <h3 style={{ fontSize: 26, textTransform: 'none', marginTop: 10 }}>{q.q}</h3>
              {q.opts.map((o, idx) => {
                let clsName = 'quiz-opt';
                if (picked !== null) {
                  if (idx === q.a) clsName += ' right';
                  else if (idx === picked) clsName += ' wrong';
                }
                return <button key={idx} className={clsName} onClick={() => answer(idx)} disabled={picked !== null}>{o}</button>;
              })}
              {picked !== null && (
                <div style={{ marginTop: 18 }}>
                  <p>{picked === q.a ? '✓ Correct.' : `✗ Not quite. The answer is: ${q.opts[q.a]}.`}</p>
                  <button className="btn btn-dark" onClick={next}>{i + 1 >= set.qs.length ? 'See score →' : 'Next →'}</button>
                </div>
              )}
            </>
          ) : (
            <>
              <span className="num">{set.title} · Done</span>
              <h3 style={{ fontSize: 40, textTransform: 'none', marginTop: 10 }}>You scored {score} / {set.qs.length}</h3>
              <p>{score === set.qs.length ? 'Perfect. You have got this chapter.' : score >= 3 ? 'Good work. Revise the ones you missed and try again.' : 'Keep going. Ask the AI Teacher about the ones you missed, then retry.'}</p>
              <button className="btn btn-yellow" onClick={() => pickSet(set)} style={{ marginTop: 12 }}>Try again</button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
