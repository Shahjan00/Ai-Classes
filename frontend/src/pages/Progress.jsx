// Progress Dashboard — charts from real local progress (lessons done,
// quiz scores). Sample history for the demo, but nothing stuck loading.
import { Link } from 'react-router-dom';
import { store } from '../lib/store';

const LESSONS = [
  { id: 'py1', title: 'Your first print', cls: 'Class 6' },
  { id: 'py2', title: 'Maths with variables', cls: 'Class 7' },
  { id: 'py3', title: 'A loop that counts', cls: 'Class 8' },
  { id: 'py4', title: 'A function that doubles', cls: 'Class 9' },
];

const MASTERY = [
  { topic: 'Fractions', pct: 82 },
  { topic: 'Light and Sound', pct: 74 },
  { topic: 'Photosynthesis', pct: 68 },
  { topic: 'Algebra Basics', pct: 55 },
];

export default function Progress() {
  const done = store.doneLessons;
  const scores = store.quizScores;
  const quizDone = Object.keys(scores).length;
  return (
    <section className="section" style={{ paddingTop: 48 }}>
      <div className="wrap">
        <p className="kicker"><span className="dot">●</span> Progress Dashboard</p>
        <h1 className="display display-md" style={{ margin: '10px 0 8px' }}>Your learning, at a glance</h1>
        <p className="lede">Lessons finished, quizzes taken and what to revise next. Everything here is yours, stored on your device.</p>

        <div className="stat-row" style={{ margin: '28px 0' }}>
          <div className="stat"><b>{done.length} / {LESSONS.length}</b><span>Coding lessons done</span></div>
          <div className="stat"><b>{quizDone}</b><span>Quiz sets attempted</span></div>
          <div className="stat"><b>7 day</b><span>Current streak</span></div>
        </div>

        <div className="grid2" style={{ alignItems: 'start' }}>
          <div className="card">
            <h3>Topic mastery</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 16 }}>
              {MASTERY.map((m) => (
                <div key={m.topic}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: 14 }}>
                    <span>{m.topic}</span><span>{m.pct}%</span>
                  </div>
                  <div className="bar" style={{ marginTop: 6 }}><i style={{ width: m.pct + '%' }} /></div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h3>Lesson history</h3>
            <table className="table" style={{ marginTop: 12 }}>
              <thead><tr><th>Lesson</th><th>Class</th><th>Status</th></tr></thead>
              <tbody>
                {LESSONS.map((l) => (
                  <tr key={l.id}>
                    <td>{l.title}</td><td>{l.cls}</td>
                    <td>{done.includes(l.id) ? '✓ Done' : 'Not started'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ marginTop: 16 }}><Link to="/coding-lab" className="btn btn-yellow btn-sm">Continue coding →</Link></p>
          </div>
        </div>

        {quizDone > 0 && (
          <div className="card" style={{ marginTop: 24 }}>
            <h3>Quiz results</h3>
            <table className="table" style={{ marginTop: 12 }}>
              <thead><tr><th>Quiz</th><th>Score</th></tr></thead>
              <tbody>
                {Object.entries(scores).map(([id, s]) => (
                  <tr key={id}><td>{id}</td><td>{s.score} / {s.total}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
