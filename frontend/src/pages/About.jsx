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
        <h1 className="display display-md" style={{ margin: '10px 0 8px' }}>One crore students. One teacher each.</h1>
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
              The aim is 1 crore students. Not by selling software, but by
              making the AI teacher so useful that students ask for it by name.
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
            <h3>How it scales to 2 crore students</h3>
            <p style={{ marginTop: 8 }}>
              Three choices do the heavy lifting. Everything else follows.
            </p>
            <ol style={{ lineHeight: 1.9, paddingLeft: 20 }}>
              <li><strong>Stateless API.</strong> No server remembers a student. Any copy can answer any question, so we add copies when load grows.</li>
              <li><strong>CDN for everything static.</strong> The site, the avatar and the lessons are cached near the student, so the servers only do the thinking.</li>
              <li><strong>Cache per chapter.</strong> Ten lakh students asking the same photosynthesis question get the same good answer, computed once.</li>
            </ol>
            <div className="diagram" style={{ marginTop: 20 }}>
              <div className="node"><b>2 Cr students</b><span>Phones + classroom TVs</span></div>
              <div className="arrow">→</div>
              <div className="node"><b>CDN</b><span>Static, cached</span></div>
              <div className="arrow">→</div>
              <div className="node"><b>Stateless API</b><span>Scales sideways</span></div>
              <div className="arrow">→</div>
              <div className="node"><b>Groq</b><span>Fast answers</span></div>
            </div>
            <p style={{ marginTop: 16, fontSize: 14, color: 'var(--ink-soft)' }}>
              Voice runs in the browser, so it costs the servers nothing.
              That is what makes the Hindi voice teacher affordable at
              this scale.
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
