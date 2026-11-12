// Login — demo sign-in. Any name + class signs you in locally and
// unlocks the Student Dashboard. The original only had "Student Login";
// this is honest about being a demo.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { store } from '../lib/store';
import { useToast } from '../App';

export default function Login() {
  const toast = useToast();
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [cls, setCls] = useState('Class 8');

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) { toast('Please enter your name.'); return; }
    store.user = { name: name.trim(), cls };
    toast(`Welcome, ${name.trim()}.`);
    nav('/student');
  };

  const demoLogin = () => {
    store.user = { name: 'Demo Student', cls: 'Class 8' };
    toast('Welcome, Demo Student. This is a demo account.');
    nav('/student');
  };

  return (
    <section className="section" style={{ paddingTop: 48 }}>
      <div className="wrap" style={{ maxWidth: 520 }}>
        <p className="kicker"><span className="dot">●</span> Sign in</p>
        <h1 className="display display-md" style={{ margin: '10px 0 8px' }}>Student login</h1>
        <p className="lede">Demo sign-in. Any name works, nothing leaves your device.</p>
        <form onSubmit={submit} className="card" style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field"><label>Your name</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Aarav Sharma" /></div>
          <div className="field">
            <label>Your class</label>
            <select value={cls} onChange={(e) => setCls(e.target.value)}>
              {Array.from({ length: 12 }, (_, i) => <option key={i}>Class {i + 1}</option>)}
            </select>
          </div>
          <button className="btn btn-yellow" type="submit">Sign in →</button>
          <button className="btn btn-ghost btn-sm" type="button" onClick={demoLogin} style={{ alignSelf: 'center' }}>Demo login</button>
        </form>
      </div>
    </section>
  );
}
