// Coding Lab — real Python in the browser via Pyodide (WASM), loaded
// lazily from the CDN, exactly like the original. Lessons are mapped to
// classes (the original admitted its levels were not mapped).
import { useRef, useState } from 'react';
import { store } from '../lib/store';
import { useToast } from '../App';

const LESSONS = [
  {
    id: 'py1', cls: 'Class 6', title: 'Your first print',
    goal: 'Print "Hello, JARVISH" to the screen.',
    code: 'print("Hello, JARVISH")',
    test: 'Hello, JARVISH',
    hint: 'print() shows text on the screen. Put your words in quotes.',
  },
  {
    id: 'py2', cls: 'Class 7', title: 'Maths with variables',
    goal: 'Add two numbers and print the total.',
    code: 'a = 12\nb = 8\nprint(a + b)',
    test: '20',
    hint: 'Variables hold numbers. print(a + b) shows their sum.',
  },
  {
    id: 'py3', cls: 'Class 8', title: 'A loop that counts',
    goal: 'Print the numbers 1 to 5, one per line.',
    code: 'for i in range(1, 6):\n    print(i)',
    test: '1\n2\n3\n4\n5',
    hint: 'range(1, 6) gives 1, 2, 3, 4, 5. The loop repeats print for each.',
  },
  {
    id: 'py4', cls: 'Class 9', title: 'A function that doubles',
    goal: 'Write a function double(x) that returns twice x, then print double(7).',
    code: 'def double(x):\n    return x * 2\n\nprint(double(7))',
    test: '14',
    hint: 'def makes a function. return sends the answer back.',
  },
];

// Pyodide (real Python in the browser) from the first CDN that answers.
const PYODIDE_URLS = [
  'https://unpkg.com/pyodide@0.26.4/full/pyodide.js',
  'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js',
];
let pyodidePromise = null;
function loadPyodide() {
  if (pyodidePromise) return pyodidePromise;
  const tryUrl = (i) => new Promise((resolve, reject) => {
    if (i >= PYODIDE_URLS.length) return reject(new Error('Could not load Pyodide'));
    const s = document.createElement('script');
    s.src = PYODIDE_URLS[i];
    s.onload = async () => { try { resolve(await window.loadPyodide()); } catch (e) { reject(e); } };
    s.onerror = () => tryUrl(i + 1).then(resolve, reject);
    document.head.appendChild(s);
  });
  pyodidePromise = tryUrl(0);
  return pyodidePromise;
}

export default function Coding() {
  const toast = useToast();
  const [lesson, setLesson] = useState(LESSONS[0]);
  const [code, setCode] = useState(LESSONS[0].code);
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState('idle');
  const [pyReady, setPyReady] = useState(false);
  const [done, setDone] = useState(store.doneLessons);
  const outRef = useRef(null);

  const pick = (l) => { setLesson(l); setCode(l.code); setOutput(''); setStatus('idle'); };

  const run = async () => {
    setStatus('loading');
    setOutput('Starting Python…');
    try {
      const py = await loadPyodide();
      setPyReady(true);
      py.setStdout({ batched: (s) => setOutput((o) => (o === 'Starting Python…' ? '' : o) + s + '\n') });
      py.setStderr({ batched: (s) => setOutput((o) => o + s + '\n') });
      setOutput('');
      await py.runPythonAsync(code);
      setStatus('done');
    } catch (e) {
      setOutput('Error: ' + (e && e.message ? e.message : e));
      setStatus('error');
    }
  };

  // Check the test after a run: re-run capturing stdout properly.
  const runAndCheck = async () => {
    setStatus('loading');
    setOutput('Starting Python…');
    try {
      const py = await loadPyodide();
      setPyReady(true);
      let captured = '';
      py.setStdout({ batched: (s) => { captured += s + '\n'; } });
      py.setStderr({ batched: (s) => { captured += s + '\n'; } });
      await py.runPythonAsync(code);
      setOutput(captured || '(no output)');
      if (captured.trim() === lesson.test.trim()) {
        setStatus('pass');
        store.markLessonDone(lesson.id);
        setDone(store.doneLessons);
        toast('Test passed. Lesson done.');
      } else {
        setStatus('fail');
      }
    } catch (e) {
      setOutput('Error: ' + (e && e.message ? e.message : e));
      setStatus('error');
    }
  };

  return (
    <section className="section" style={{ paddingTop: 48 }}>
      <div className="wrap">
        <p className="kicker"><span className="dot">●</span> Coding Lab</p>
        <h1 className="display display-md" style={{ margin: '10px 0 8px' }}>Write code. Run it.</h1>
        <p className="lede">Real Python, running in your browser. No install, no account. Lessons are mapped to your class.</p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 28 }}>
          {LESSONS.map((l) => (
            <button key={l.id} className={`chip ${lesson.id === l.id ? 'on' : ''}`} onClick={() => pick(l)}>
              {done.includes(l.id) ? '✓ ' : ''}{l.cls} · {l.title}
            </button>
          ))}
        </div>

        <div className="grid2" style={{ marginTop: 24, alignItems: 'start' }}>
          <div>
            <div className="card">
              <span className="num">{lesson.cls}</span>
              <h3>{lesson.title}</h3>
              <p>{lesson.goal}</p>
              <p style={{ marginTop: 10, fontSize: 14 }}><strong>Hint:</strong> {lesson.hint}</p>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={8}
              style={{ width: '100%', marginTop: 16, fontFamily: 'ui-monospace, monospace', fontSize: 15, padding: 16, border: '1.5px solid var(--line)', borderRadius: 16, background: '#111110', color: '#e8f5e9' }}
              spellCheck={false}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button className="btn btn-yellow" onClick={runAndCheck} disabled={status === 'loading'}>
                {status === 'loading' ? 'Running…' : '▶ Run + check test'}
              </button>
              <button className="btn btn-ghost" onClick={run} disabled={status === 'loading'}>Run only</button>
            </div>
            {status === 'pass' && <p style={{ color: 'var(--green)', fontWeight: 700, marginTop: 14 }}>✓ 1/1 tests passed. Lesson marked done.</p>}
            {status === 'fail' && <p style={{ color: 'var(--red)', fontWeight: 700, marginTop: 14 }}>Output did not match yet. Expected: “{lesson.test}”. Read the hint and try again.</p>}
          </div>
          <div>
            <div className="card">
              <h3>Output</h3>
              <div className="codebox" ref={outRef}>{output || 'Press Run to see your output here.'}</div>
              <p style={{ marginTop: 12, fontSize: 13, color: 'var(--ink-faint)' }}>
                Python runs on your device with Pyodide (WebAssembly). {pyReady ? 'Loaded and ready.' : 'First run downloads the Python runtime (~10 MB), once.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
