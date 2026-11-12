// Notes Maker — pick class, subject, chapter, language, length; get
// clean chapter notes. The original gated this behind sign-in while the
// chat was open; here it just works.
import { useState } from 'react';
import { renderMarkdown } from '../lib/md';
import { getNotes } from '../lib/api';
import { useToast } from '../App';

const SUBJECTS = ['Science', 'Maths', 'English', 'Hindi', 'Social Science'];
const CHAPTERS = {
  Science: ['Photosynthesis', 'Electricity', 'The Human Body', 'Water Cycle', 'Force and Motion'],
  Maths: ['Fractions', 'Algebra Basics', 'Geometry: Triangles', 'Decimals', 'Ratios'],
  English: ['Tenses', 'Letter Writing', 'Reading Comprehension', 'Vocabulary'],
  Hindi: ['संज्ञा', 'क्रिया', 'पत्र लेखन', 'मुहावरे'],
  'Social Science': ['The Mughal Empire', 'Maps and Globes', 'Our Constitution', 'Agriculture'],
};

export default function Notes() {
  const toast = useToast();
  const [subject, setSubject] = useState('Science');
  const [chapter, setChapter] = useState('Photosynthesis');
  const [cls, setCls] = useState('Class 8');
  const [lang, setLang] = useState('en');
  const [length, setLength] = useState('Short');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const generate = async () => {
    setBusy(true);
    setNotes('');
    try {
      const res = await getNotes({ subject, chapter: `${chapter} (${length})`, cls, lang });
      setNotes(res.notes || '');
    } catch {
      toast('Notes backend is offline. Is it running?');
    }
    setBusy(false);
  };

  return (
    <section className="section" style={{ paddingTop: 48 }}>
      <div className="wrap">
        <p className="kicker"><span className="dot">●</span> Notes Maker</p>
        <h1 className="display display-md" style={{ margin: '10px 0 8px' }}>Chapter notes in minutes</h1>
        <p className="lede">Pick your class and chapter. JARVISH writes clean notes you can actually revise from.</p>

        <div className="grid2" style={{ marginTop: 32, alignItems: 'start' }}>
          <div className="card">
            <div className="field" style={{ marginBottom: 14 }}>
              <label>Class</label>
              <select value={cls} onChange={(e) => setCls(e.target.value)}>
                {Array.from({ length: 12 }, (_, i) => <option key={i}>Class {i + 1}</option>)}
              </select>
            </div>
            <div className="field" style={{ marginBottom: 14 }}>
              <label>Subject</label>
              <select value={subject} onChange={(e) => { setSubject(e.target.value); setChapter(CHAPTERS[e.target.value][0]); }}>
                {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="field" style={{ marginBottom: 14 }}>
              <label>Chapter</label>
              <select value={chapter} onChange={(e) => setChapter(e.target.value)}>
                {CHAPTERS[subject].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="field" style={{ marginBottom: 14 }}>
              <label>Language</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className={`chip ${lang === 'en' ? 'on' : ''}`} onClick={() => setLang('en')}>English</button>
                <button className={`chip ${lang === 'hi' ? 'on' : ''}`} onClick={() => setLang('hi')}>हिन्दी</button>
              </div>
            </div>
            <div className="field" style={{ marginBottom: 20 }}>
              <label>Length</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['Short', 'Detailed'].map((l) => (
                  <button key={l} className={`chip ${length === l ? 'on' : ''}`} onClick={() => setLength(l)}>{l}</button>
                ))}
              </div>
            </div>
            <button className="btn btn-yellow" onClick={generate} disabled={busy}>
              {busy ? 'Writing notes…' : 'Generate notes →'}
            </button>
          </div>

          <div className="card" style={{ minHeight: 320 }}>
            {busy && <span className="typing"><i /><i /><i /></span>}
            {!busy && !notes && <p style={{ color: 'var(--ink-faint)' }}>Your notes will appear here. Try Science, Photosynthesis, Class 8.</p>}
            {!busy && notes && <div dangerouslySetInnerHTML={{ __html: renderMarkdown(notes) }} />}
          </div>
        </div>
      </div>
    </section>
  );
}
