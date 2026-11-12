import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import CursorMesh from '../components/CursorMesh'

/* Content is refined from the original site (jarvis-rust-phi.vercel.app).
   The dark "Capabilities we are designing" orbit section is NOT on this
   page: the user asked for it to be removed. */

const SAMPLES = [
  { tag: 'AI Basics', q: 'What is AI, in simple words?' },
  { tag: 'Machine Learning', q: 'How does machine learning actually learn?' },
  { tag: 'AI Agents', q: 'What is an AI agent?' },
  { tag: 'Super AI', q: 'What is super AI?' },
  { tag: 'Build AI Startups', q: 'How do I start building with AI?' },
  { tag: 'Quiz', q: 'Quiz me on photosynthesis' },
]

export default function Home() {
  const demoRef = useRef(null)

  useEffect(() => {
    document.title = 'JARVISH AI — Your AI Teacher'
  }, [])

  return (
    <div className="page home-page">
      <section className="hero">
        <CursorMesh />
        <div className="wrap hero-grid">
          <div className="hero-copy fade-up">
            <p className="kicker"><span className="dot" /> LEARNZO BHARAT EDUCATION · DEMO BUILD</p>
            <h1>Ask<br />anything<span className="dot">.</span> Learn<br />everything.</h1>
            <p className="lede">
              Ask questions, get step-by-step explanations, practise with quizzes
              and track learning — an AI-powered teaching and learning platform
              designed for schools.
            </p>
            <div className="hero-cta">
              <Link className="btn btn-yellow" to="/teacher-ai">Talk to your AI teacher</Link>
              <a className="btn btn-ghost" href="#demo">See it in action</a>
            </div>
            <div className="hero-stats">
              <div><strong>1–12</strong><span>Classes covered</span></div>
              <div><strong>2</strong><span>Languages · English + Hindi</span></div>
              <div><strong>4</strong><span>Tiers · Standards 1–12</span></div>
            </div>
          </div>
          <div className="hero-teacher fade-up">
            <img src="/teacher.png" alt="Your AI teacher" className="hero-teacher-img" />
            <p className="hero-teacher-caption">Your AI teacher, ready when you are.</p>
          </div>
        </div>
      </section>

      <section className="section" id="demo" ref={demoRef}>
        <div className="wrap">
          <p className="kicker">SEE JARVISH IN ACTION</p>
          <h2>Try a sample conversation.</h2>
          <p className="section-lede">
            Pre-written sample conversations that replay automatically.
            Pick one to see how the real-time AI response feels.
          </p>
          <div className="sample-grid">
            {SAMPLES.map((s) => (
              <Link key={s.tag} className="sample-card" to={`/teacher-ai?q=${encodeURIComponent(s.q)}`}>
                <span className="sample-tag">{s.tag}</span>
                <span className="sample-q">{s.q}</span>
                <span className="sample-go">Ask your teacher →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-grey">
        <div className="wrap">
          <p className="kicker">TRY YOUR OWN QUESTION</p>
          <h2>Ask anything to see how the real-time AI response feels.</h2>
          <p className="section-lede">
            <strong>LIVE AI RESPONSE</strong> · Real-time · Response generated via backend API.
          </p>
          <div className="try-box">
            <input
              className="try-input"
              placeholder="Ask me anything…"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  window.location.href = `/teacher-ai?q=${encodeURIComponent(e.currentTarget.value.trim())}`
                }
              }}
            />
            <Link className="btn btn-yellow" to="/teacher-ai">Ask your teacher</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <p className="kicker">PROPOSED PROGRAMME</p>
          <h2>Four tiers across Standards 1–12.</h2>
          <div className="tier-grid">
            {[
              { t: 'Tier 1', s: 'Standards 1–3', d: 'Curiosity first. Simple answers, spoken aloud, in easy words.' },
              { t: 'Tier 2', s: 'Standards 4–6', d: 'Short explanations with examples, plus quick quizzes to check understanding.' },
              { t: 'Tier 3', s: 'Standards 7–9', d: 'Step-by-step explanations, diagrams on the green board, and practice questions.' },
              { t: 'Tier 4', s: 'Standards 10–12', d: 'Deeper answers, exam-style practice, and revision notes you can keep.' },
            ].map((x) => (
              <article key={x.t} className="tier-card">
                <strong>{x.t}</strong>
                <h3>{x.s}</h3>
                <p>{x.d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-grey">
        <div className="wrap">
          <p className="kicker">A BLENDED APPROACH</p>
          <h2>A more connected learning experience.</h2>
          <p className="section-lede">
            AI-assisted learning, teacher guidance and student participation,
            brought together. JARVISH is intended to complement classroom
            teaching, not remove the importance of human teachers.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <p className="kicker">FACTS, NOT STATISTICS</p>
          <h2>Honest about what it is.</h2>
          <p className="section-lede">
            No user counts, accuracy, uptime, response-time or performance
            figures appear anywhere on this site.
          </p>
          <Link className="btn btn-yellow" to="/teacher-ai">Meet your AI teacher</Link>
        </div>
      </section>
    </div>
  )
}
