// Programme — the 4 tiers plus the Class 11–12 Future Technology
// programme with its 11 modules.
import { Link } from 'react-router-dom';

const TIERS = [
  { t: 'Foundation', c: 'Classes 1–5', d: 'Reading, numbers and curiosity. Short lessons, a patient AI teacher, and plenty of stories.' },
  { t: 'Explorer', c: 'Classes 6–8', d: 'Science and maths made visual. Quizzes after every chapter, coding starts here.' },
  { t: 'Achiever', c: 'Classes 9–10', d: 'Board exam prep. Notes, timed tests and revision plans that adapt to weak topics.' },
  { t: 'Future Technology', c: 'Classes 11–12', d: 'What comes next: AI, quantum, robotics. Eleven modules, one per month.' },
];

const MODULES = [
  'Next-Gen Networks', 'Autonomous Systems', 'Quantum Computing', 'Humanoid Robotics',
  'Brain-Computer Interfaces', 'AGI', 'Data Trust', 'Photonic Computing',
  'Neuromorphic Computing', 'Quantum Communication', 'Advanced Digital Humans', 'Technology Convergence',
];

export default function Programme() {
  return (
    <section className="section" style={{ paddingTop: 48 }}>
      <div className="wrap">
        <p className="kicker"><span className="dot">●</span> Programme</p>
        <h1 className="display display-md" style={{ margin: '10px 0 8px' }}>One journey, Class 1 to 12</h1>
        <p className="lede">Four tiers that grow with the student, from first words to future technology.</p>

        <div className="cards" style={{ marginTop: 32 }}>
          {TIERS.map((t) => (
            <div className="card" key={t.t}>
              <span className="num">{t.c}</span>
              <h3>{t.t}</h3>
              <p>{t.d}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 64 }}>
          <p className="kicker"><span className="dot">●</span> Future Technology Learning Program · Classes 11–12</p>
          <h2 className="display display-md" style={{ margin: '12px 0 24px' }}>Twelve modules for what comes next</h2>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {MODULES.map((m, i) => (
              <span key={m} className="chip" style={{ cursor: 'default' }}>{String(i + 1).padStart(2, '0')} · {m}</span>
            ))}
          </div>
          <p style={{ marginTop: 24, color: 'var(--ink-soft)', maxWidth: 640 }}>
            The Future Technology syllabus is being documented with schools now.
            Each module pairs a concept with a hands-on build, so students
            leave with something they made, not just something they read.
          </p>
          <Link to="/schools" className="btn btn-yellow" style={{ marginTop: 12 }}>Bring the programme to your school →</Link>
        </div>
      </div>
    </section>
  );
}
