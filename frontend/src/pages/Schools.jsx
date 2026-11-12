// For Schools — B2B pitch: partnership steps, 3-week pilot, enquiry form.
import { useState } from 'react';
import { useToast } from '../App';

const STEPS = [
  { n: '01', t: 'Talk', d: 'A 30-minute call. We learn how your school teaches today.' },
  { n: '02', t: 'Pilot', d: 'Three weeks, two classes. Teachers and students try everything.' },
  { n: '03', t: 'Review', d: 'We look at usage and learning together, honestly.' },
  { n: '04', t: 'Roll out', d: 'Whole school, with teacher training included.' },
];

export default function Schools() {
  const toast = useToast();
  const [name, setName] = useState('');
  const [school, setSchool] = useState('');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim() || !school.trim() || !email.trim()) { toast('Please fill in all three fields.'); return; }
    setSent(true);
    toast('Enquiry sent. The Learnzo team will call you back.');
  };

  return (
    <section className="section" style={{ paddingTop: 48 }}>
      <div className="wrap">
        <p className="kicker"><span className="dot">●</span> For Schools</p>
        <h1 className="display display-md" style={{ margin: '10px 0 8px' }}>An AI teacher for every classroom</h1>
        <p className="lede">JARVISH gives every student a patient tutor, and gives teachers their time back. Start with a three-week pilot, no commitment.</p>

        <div className="cards" style={{ marginTop: 36 }}>
          {STEPS.map((s) => (
            <div className="card" key={s.n}>
              <span className="num">Step {s.n}</span>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </div>
          ))}
        </div>

        <div className="grid2" style={{ marginTop: 56, alignItems: 'start' }}>
          <div>
            <h2 className="display display-md">What schools get</h2>
            <ul style={{ fontSize: 17, lineHeight: 2, marginTop: 16 }}>
              <li>AI Teacher for Classes 1–12, in English and Hindi</li>
              <li>Teacher dashboards with real class data</li>
              <li>Notes, quizzes and coding lab included</li>
              <li>Teacher training, in person or online</li>
              <li>Works on the phones and computers schools already have</li>
            </ul>
            <p style={{ color: 'var(--ink-soft)' }}>Commercial models: school licence, partnership, or per-student. Pricing is shared after the pilot call.</p>
          </div>
          <div className="card">
            <h3>Book a pilot</h3>
            {sent ? (
              <p style={{ marginTop: 12 }}>✓ Thanks, {name}. We will call {school} back within two working days.</p>
            ) : (
              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
                <div className="field"><label>Your name</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya Sharma" /></div>
                <div className="field"><label>School name</label><input value={school} onChange={(e) => setSchool(e.target.value)} placeholder="e.g. Sunrise Public School" /></div>
                <div className="field"><label>Work email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu.in" /></div>
                <button className="btn btn-yellow" type="submit">Request a pilot →</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
