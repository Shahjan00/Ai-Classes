// About — Learnzo story, leadership, and the scale diagram.
// The scale question (2 crore users) gets a short, honest answer here.
import { Link } from 'react-router-dom';

const TEAM = [
  { n: 'Rohan Kale', r: 'Founder & CMD' },
  { n: 'Yogesh Ghorpade', r: 'Managing Director' },
  { n: 'Rupesh Anjarlekar', r: 'Managing Director' },
  { n: 'Rajendra Rithe', r: 'Managing Director' },
];

export default function About() {
  return (
    <section className="section" style={{ paddingTop: 48 }}>
      <div className="wrap">
        <p className="kicker"><span className="dot">●</span> About</p>
        <h1 className="display display-md" style={{ margin: '10px 0 8px' }}>One teacher for every student.</h1>
        <p className="lede">
          Learnzo Bharat Education started with a simple problem: a classroom
          has forty students and one teacher, and every student has a different
          question at a different time. JARVISH is the patient second teacher
          that never gets tired.
        </p>

        <div className="grid2" style={{ marginTop: 48, alignItems: 'start' }}>
          <div>
            <h2 className="display display-md" style={{ fontSize: 40 }}>Our story</h2>
            <p style={{ marginTop: 16 }}>
              Maharaja Education has worked with schools since 2018. Learnzo
              was incorporated in 2026 to bring AI teaching to Indian
              classrooms, starting with a demo that schools could try before
              they believed it.
            </p>
            <p>
              The aim is simple: make the AI teacher so useful that students
              ask for it by name, in every classroom.
            </p>
            <h3 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', marginTop: 32 }}>Leadership</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              {TEAM.map((t) => (
                <div className="card" key={t.n} style={{ padding: 20 }}>
                  <strong>{t.n}</strong>
                  <p>{t.r}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3>What every student gets</h3>
            <p style={{ marginTop: 8 }}>
              The same patient teacher, for every subject and every class.
            </p>
            <ol style={{ lineHeight: 1.9, paddingLeft: 20 }}>
              <li><strong>Ask anything.</strong> A question in class, homework, or general knowledge — answered in simple words.</li>
              <li><strong>Hear it out loud.</strong> The teacher speaks the answer, in English or Hindi, at your pace.</li>
              <li><strong>See it on the board.</strong> When a question needs a diagram or an equation, the teacher explains it on the green board, line by line.</li>
              <li><strong>Check yourself.</strong> A quick quiz after every answer shows what you understood.</li>
            </ol>
            <p style={{ marginTop: 16, fontSize: 14, color: 'var(--ink-soft)' }}>
              No question is too small. Ask the same thing twice, and the
              teacher explains it a different way.
            </p>
          </div>
        </div>

        <div style={{ marginTop: 48 }}>
          <Link to="/contact" className="btn btn-yellow">Talk to us →</Link>
        </div>
      </div>
    </section>
  );
}
