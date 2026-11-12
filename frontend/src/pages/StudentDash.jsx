// Student Dashboard — the original showed "Sign in to see your
// dashboard" AND a stuck "Loading…" card AND a Logout button at once.
// This one shows real state immediately: signed out gets a clean sign-in
// prompt, signed in gets the dashboard. No fake loading.
import { Link } from 'react-router-dom';
import { store } from '../lib/store';

const TODAY = [
  { t: 'Science · Light and Sound', d: 'Revise reflection with the AI Teacher', done: true },
  { t: 'Maths · Fractions quiz', d: '5 questions, 10 minutes', done: false },
  { t: 'Coding Lab · A loop that counts', d: 'Class 8 Python lesson', done: false },
];

export default function StudentDash() {
  const user = store.user;
  if (!user) {
    return (
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="wrap" style={{ maxWidth: 640 }}>
          <p className="kicker"><span className="dot">●</span> Student Dashboard</p>
          <h1 className="display display-md" style={{ margin: '10px 0 16px' }}>Sign in to see your dashboard</h1>
          <p className="lede">Your lessons, quizzes and progress live here once you sign in. It takes ten seconds, no email verification in this demo.</p>
          <Link to="/login" className="btn btn-yellow" style={{ marginTop: 20 }}>Sign in →</Link>
        </div>
      </section>
    );
  }
  const done = store.doneLessons.length;
  return (
    <section className="section" style={{ paddingTop: 48 }}>
      <div className="wrap">
        <p className="kicker"><span className="dot">●</span> Student Dashboard</p>
        <h1 className="display display-md" style={{ margin: '10px 0 8px' }}>Welcome back, {user.name}</h1>
        <p className="lede">Here is today, and where you left off.</p>

        <div className="stat-row" style={{ margin: '28px 0' }}>
          <div className="stat"><b>{done}</b><span>Coding lessons done</span></div>
          <div className="stat"><b>7 day</b><span>Streak</span></div>
          <div className="stat"><b>Class 8</b><span>Your class</span></div>
        </div>

        <div className="card" style={{ maxWidth: 720 }}>
          <h3>Today</h3>
          {TODAY.map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: i < TODAY.length - 1 ? '1px solid var(--line)' : 'none', alignItems: 'start' }}>
              <span style={{ fontSize: 20 }}>{t.done ? '✓' : '○'}</span>
              <div>
                <strong>{t.t}</strong>
                <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 14 }}>{t.d}</p>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
            <Link to="/teacher-ai" className="btn btn-dark btn-sm">Open AI Teacher →</Link>
            <Link to="/quiz" className="btn btn-ghost btn-sm">Take the quiz →</Link>
            <Link to="/progress" className="btn btn-ghost btn-sm">Full progress →</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
