// Meet Marina: the 3D teacher, on her own full page. Drag her around,
// zoom in, let her spin. She is a real 3D model, not a video.
import { Link } from 'react-router-dom';
import MarinaViewer from '../components/MarinaViewer';

export default function Marina() {
  return (
    <section className="marina-page">
      <div className="wrap">
        <p className="kicker"><span className="dot">●</span> Your 3D AI Teacher</p>
        <h1 className="display display-md teacher-title">Meet Marina.</h1>
        <p className="teacher-tagline">
          Your AI teacher, standing in the classroom with you. Ask her anything,
          Class 1 to 12, and she answers in her own voice.
        </p>

        <div className="marina-hero">
          <MarinaViewer height={560} />
          <div>
            <div className="marina-facts">
              <div className="marina-fact">
                <span className="mark">3D</span>
                <div>
                  <strong>A real 3D teacher, not a video</strong>
                  <p>Drag to walk around her, scroll to zoom in close. She turns slowly on her own, and pauses while you look.</p>
                </div>
              </div>
              <div className="marina-fact">
                <span className="mark">AI</span>
                <div>
                  <strong>She teaches every subject</strong>
                  <p>Science, maths, English, coding and more, for Classes 1 to 12, with the green board beside her when a diagram helps.</p>
                </div>
              </div>
              <div className="marina-fact">
                <span className="mark">♪</span>
                <div>
                  <strong>She talks with her voice</strong>
                  <p>Marina is a 3D model, so her mouth does not move. She answers out loud, sways gently while she speaks, and listens when you talk back.</p>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
              <Link to="/teacher-ai" className="btn btn-yellow">Ask Marina a question</Link>
              <Link to="/about" className="btn btn-ghost">How JARVISH works</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
