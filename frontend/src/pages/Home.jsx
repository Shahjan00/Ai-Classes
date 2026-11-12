// Home — the landing page. Design follows the reference Shahjan picked:
// giant display type, one yellow accent, one strong hero visual (the
// talking avatar), lots of white space.
import { Link } from 'react-router-dom';
import Avatar from '../components/Avatar';

const CAPABILITIES = [
  { n: '01', t: 'AI Teacher', d: 'Ask anything, Class 1 to 12. Answers stream in, in simple words, in English or Hindi.' },
  { n: '02', t: 'Talking Avatar', d: 'A real teacher face that listens, thinks and speaks with you. Lip-synced, with expressions.' },
  { n: '03', t: 'Hindi Voice', d: 'Ask in Hindi, get a Hindi answer spoken aloud. 40 languages on the roadmap.' },
  { n: '04', t: 'Notes Maker', d: 'Chapter notes in minutes, in your class, subject and language.' },
  { n: '05', t: 'Coding Lab', d: 'Real Python in the browser. Write code, run it, pass the tests.' },
  { n: '06', t: 'Quiz Centre', d: 'AI quizzes that check what you actually understood, not what you memorised.' },
  { n: '07', t: 'Exam Hall', d: 'Timed practice exams with instant results and revision pointers.' },
];

const TIERS = [
  { t: 'Foundation', c: 'Classes 1–5', d: 'Reading, numbers and curiosity, with a patient AI teacher.' },
  { t: 'Explorer', c: 'Classes 6–8', d: 'Science and maths made visual, with quizzes after every chapter.' },
  { t: 'Achiever', c: 'Classes 9–10', d: 'Board exam prep: notes, tests and revision plans that adapt.' },
  { t: 'Future Tech', c: 'Classes 11–12', d: 'AI, quantum, robotics and more. 11 modules for what comes next.' },
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <p className="kicker"><span className="dot">●</span> Learnzo Bharat Education · Demo build</p>
          <h1 className="display display-xl">
            Ask<br />anything<span style={{ color: 'var(--yellow)' }}>.</span><br />Learn<br />everything.
          </h1>
          <div className="hero-grid" style={{ marginTop: 40 }}>
            <div>
              <p className="lede">
                JARVISH is your AI teacher, in every classroom. A real talking
                avatar that explains, listens and answers, in English or Hindi,
                for Classes 1 to 12.
              </p>
              <div style={{ display: 'flex', gap: 14, marginTop: 32, flexWrap: 'wrap', alignItems: 'center' }}>
                <Link to="/teacher-ai" className="btn btn-dark">Talk to AI Teacher →</Link>
                <Link to="/teacher-ai" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, fontWeight: 700 }}>
                  <span className="play-btn">▶</span> Watch the avatar talk
                </Link>
              </div>
              <div className="stat-row">
                <div className="stat"><b>1–12</b><span>Classes covered</span></div>
                <div className="stat"><b>40+</b><span>Languages planned</span></div>
                <div className="stat"><b>2 Cr</b><span>Students, ready to scale</span></div>
              </div>
            </div>
            <div>
              <Avatar state="idle" />
              <p style={{ marginTop: 14, fontSize: 14, color: 'var(--ink-soft)' }}>
                <strong style={{ color: 'var(--ink)' }}>Meet JARVISH.</strong> Not a robot
                illustration, a teacher who talks back. Try her on the AI Teacher page.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section grey">
        <div className="wrap">
          <p className="kicker"><span className="dot">●</span> What it does</p>
          <h2 className="display display-md" style={{ margin: '12px 0 36px' }}>Seven ways to learn</h2>
          <div className="cards">
            {CAPABILITIES.map((c) => (
              <div className="card" key={c.n}>
                <span className="num">{c.n}</span>
                <h3>{c.t}</h3>
                <p>{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <p className="kicker"><span className="dot">●</span> How it works</p>
          <h2 className="display display-md" style={{ margin: '12px 0 36px' }}>Three steps. That is it.</h2>
          <div className="cards">
            <div className="card"><span className="num">Step 1</span><h3>Ask</h3><p>Type, or just speak. In English or Hindi, any subject, any class.</p></div>
            <div className="card"><span className="num">Step 2</span><h3>Listen</h3><p>The avatar answers out loud, word by word, with examples you can follow.</p></div>
            <div className="card"><span className="num">Step 3</span><h3>Check</h3><p>A quick quiz checks you got it. Stuck? Ask again, differently.</p></div>
          </div>
          <div style={{ marginTop: 36 }}>
            <Link to="/teacher-ai" className="btn btn-yellow">Try it now →</Link>
          </div>
        </div>
      </section>

      <section className="section grey">
        <div className="wrap">
          <p className="kicker"><span className="dot">●</span> Programme</p>
          <h2 className="display display-md" style={{ margin: '12px 0 36px' }}>Four tiers, Class 1 to 12</h2>
          <div className="cards">
            {TIERS.map((t) => (
              <div className="card" key={t.t}>
                <span className="num">{t.c}</span>
                <h3>{t.t}</h3>
                <p>{t.d}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 28 }}>
            <Link to="/programme" className="btn btn-dark">See the full programme →</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap grid2">
          <div>
            <p className="kicker"><span className="dot">●</span> Built to scale</p>
            <h2 className="display display-md" style={{ margin: '12px 0 20px' }}>Ready for 2 crore students</h2>
            <p className="lede">
              The teacher runs on a stateless API behind a CDN, so every extra
              school just adds more of the same small boxes. No single server
              holds a student's state, answers are cached per chapter, and the
              heavy work, the AI, scales on Groq.
            </p>
            <p style={{ marginTop: 16 }}><Link to="/about" className="btn btn-ghost">How it scales →</Link></p>
          </div>
          <div className="diagram">
            <div className="node"><b>Student</b><span>Phone / classroom TV</span></div>
            <div className="arrow">→</div>
            <div className="node"><b>CDN</b><span>Static site, cached close to you</span></div>
            <div className="arrow">→</div>
            <div className="node"><b>API</b><span>Stateless FastAPI, many copies</span></div>
            <div className="arrow">→</div>
            <div className="node"><b>Groq AI</b><span>Answers stream back</span></div>
          </div>
        </div>
      </section>

      <section className="section grey">
        <div className="wrap" style={{ textAlign: 'center' }}>
          <h2 className="display display-lg">AI complements teachers.<br />It never replaces them.</h2>
          <p className="lede" style={{ margin: '20px auto 0' }}>
            JARVISH handles the repeat questions, so teachers get their time
            back for the teaching only a human can do.
          </p>
          <div style={{ marginTop: 32 }}>
            <Link to="/schools" className="btn btn-dark">Bring JARVISH to your school →</Link>
          </div>
        </div>
      </section>
    </>
  );
}
