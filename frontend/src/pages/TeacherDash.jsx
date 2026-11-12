// Teacher Dashboard — sample classes with real, readable data.
// The original used fictional "Student A–E"; we keep sample data but
// label it clearly as a demo class.
import { Link } from 'react-router-dom';

const CLASSES = [
  { name: 'Class 8-A', students: 32, avg: 78, topic: 'Light and Sound' },
  { name: 'Class 9-B', students: 28, avg: 71, topic: 'Fractions and Algebra' },
  { name: 'Class 7-C', students: 35, avg: 84, topic: 'Photosynthesis' },
];

const STUDENTS = [
  { name: 'Aarav', quiz: 82, notes: 12, last: 'Today' },
  { name: 'Diya', quiz: 74, notes: 9, last: 'Today' },
  { name: 'Kabir', quiz: 91, notes: 15, last: 'Yesterday' },
  { name: 'Meera', quiz: 66, notes: 7, last: 'Yesterday' },
  { name: 'Rohan', quiz: 79, notes: 11, last: '2 days ago' },
];

export default function TeacherDash() {
  return (
    <section className="section" style={{ paddingTop: 48 }}>
      <div className="wrap">
        <p className="kicker"><span className="dot">●</span> Teacher Dashboard</p>
        <h1 className="display display-md" style={{ margin: '10px 0 8px' }}>Your classes, in one place</h1>
        <p className="lede">Demo data for review. See who is keeping up, who needs a nudge, and what to teach next.</p>

        <div className="cards" style={{ marginTop: 32 }}>
          {CLASSES.map((c) => (
            <div className="card" key={c.name}>
              <span className="num">{c.students} students</span>
              <h3>{c.name}</h3>
              <p>Now learning: {c.topic}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginTop: 14 }}>
                <span>Class average</span><span>{c.avg}%</span>
              </div>
              <div className="bar" style={{ marginTop: 6 }}><i style={{ width: c.avg + '%' }} /></div>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginTop: 24 }}>
          <h3>Class 8-A · recent activity</h3>
          <table className="table" style={{ marginTop: 12 }}>
            <thead><tr><th>Student</th><th>Quiz avg</th><th>Notes made</th><th>Last active</th></tr></thead>
            <tbody>
              {STUDENTS.map((s) => (
                <tr key={s.name}><td>{s.name}</td><td>{s.quiz}%</td><td>{s.notes}</td><td>{s.last}</td></tr>
              ))}
            </tbody>
          </table>
          <p style={{ marginTop: 16, fontSize: 14, color: 'var(--ink-soft)' }}>
            Meera is below the class average on quizzes. Suggested next step: a 10-minute AI Teacher revision on fractions.
            <Link to="/teacher-ai" style={{ fontWeight: 700, color: 'var(--ink)' }}> Open AI Teacher →</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
