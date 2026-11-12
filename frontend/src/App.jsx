// App shell: nav, routes, footer, toast.
// Toasts auto-dismiss after 3 seconds (the original's toast stuck forever).
import { createContext, useCallback, useContext, useState } from 'react';
import { NavLink, Route, Routes, Link, useNavigate } from 'react-router-dom';
import { store } from './lib/store';
import Home from './pages/Home';
import Teacher from './pages/Teacher';
import Notes from './pages/Notes';
import Coding from './pages/Coding';
import Quiz from './pages/Quiz';
import Progress from './pages/Progress';
import TeacherDash from './pages/TeacherDash';
import StudentDash from './pages/StudentDash';
import Programme from './pages/Programme';
import Schools from './pages/Schools';
import Exam from './pages/Exam';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

const LINKS = [
  ['/', 'Home'],
  ['/teacher-ai', 'AI Teacher'],
  ['/notes-maker', 'Notes Maker'],
  ['/coding-lab', 'Coding Lab'],
  ['/quiz', 'Quiz Centre'],
  ['/progress', 'Progress'],
  ['/programme', 'Programme'],
  ['/schools', 'For Schools'],
  ['/exam-hall', 'Exam Hall'],
  ['/about', 'About'],
];

function Nav() {
  const [user, setUser] = useState(store.user);
  const nav = useNavigate();
  const logout = () => { store.user = null; setUser(null); nav('/'); };
  return (
    <header className="nav">
      <div className="wrap nav-inner">
        <Link to="/" className="logo">JARVISH<span> AI</span></Link>
        <nav className="nav-links">
          {LINKS.slice(0, 6).map(([to, label]) => (
            <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>{label}</NavLink>
          ))}
        </nav>
        {user ? (
          <>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Hi, {user.name}</span>
            <button className="btn btn-ghost btn-sm" onClick={logout}>Log out</button>
          </>
        ) : (
          <Link to="/login" className="btn btn-dark btn-sm" style={{ marginLeft: 'auto' }}>Sign in</Link>
        )}
        <Link to="/teacher-ai" className="btn btn-yellow btn-sm">Try AI Teacher</Link>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div className="display">JARVISH AI</div>
            <p style={{ maxWidth: 420 }}>Your AI Teacher, in Every Classroom. Built for Indian schools, Classes 1 to 12. AI complements teachers, it never replaces them.</p>
          </div>
          <div>
            <p><strong>Learnzo Bharat Education Pvt. Ltd.</strong><br />Thane West, Maharashtra, India</p>
            <p><Link to="/about">About</Link> · <Link to="/contact">Contact</Link> · <Link to="/schools">For Schools</Link></p>
          </div>
        </div>
        <p style={{ marginTop: 28, color: 'var(--ink-faint)' }}>Demo rebuild — sample data. Not the official Learnzo site.</p>
      </div>
    </footer>
  );
}

export default function App() {
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((msg) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);

  return (
    <ToastCtx.Provider value={toast}>
      <Nav />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/teacher-ai" element={<Teacher />} />
          <Route path="/notes-maker" element={<Notes />} />
          <Route path="/coding-lab" element={<Coding />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/teacher" element={<TeacherDash />} />
          <Route path="/student" element={<StudentDash />} />
          <Route path="/programme" element={<Programme />} />
          <Route path="/schools" element={<Schools />} />
          <Route path="/exam-hall" element={<Exam />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
      <div className="toast-wrap">
        {toasts.map((t) => <div key={t.id} className="toast">{t.msg}</div>)}
      </div>
    </ToastCtx.Provider>
  );
}
