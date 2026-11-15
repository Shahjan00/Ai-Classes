// Books browser: Class first, then subjects, then chapters on a new page.
// Shared by the Notes page (Books section) and the NCERT Books page, so
// both places behave the same. Pick a class, pick a subject, and the
// subject's chapters open on their own page (/books/:class/:subject).
// No giant stretched list: one step at a time.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  NCERT_CLASSES,
  NCERT_TOTAL_BOOKS,
  NCERT_TOTAL_CHAPTERS,
} from '../lib/ncertBooks';

export default function BooksBrowser() {
  const [cls, setCls] = useState(10);
  const navigate = useNavigate();
  const classData = NCERT_CLASSES.find((c) => c.cls === cls);
  const subjects = classData ? classData.subjects : [];

  const chapterCount = (subject) =>
    subject.books.reduce((n, b) => n + b.chapters.length, 0);

  return (
    <div>
      <div className="ncert-tabs" role="tablist" aria-label="Pick a class">
        {NCERT_CLASSES.map((c) => (
          <button
            key={c.cls}
            role="tab"
            aria-selected={cls === c.cls}
            className={`ncert-tab ${cls === c.cls ? 'ncert-tab-active' : ''}`}
            onClick={() => setCls(c.cls)}
          >
            Class {c.cls}
          </button>
        ))}
      </div>

      <p className="ncert-browser-hint">
        Pick a subject to see all its chapters on a new page.
        {` ${NCERT_TOTAL_BOOKS} books · ${NCERT_TOTAL_CHAPTERS} chapters · Classes 9 to 12, free.`}
      </p>

      <div className="ncert-grid">
        {subjects.map((subject) => (
          <button
            key={subject.name}
            type="button"
            className="ncert-card ncert-subject-card"
            onClick={() => navigate(`/books/${cls}/${encodeURIComponent(subject.name)}`)}
          >
            <div className="ncert-card-top">
              <span className="ncert-subject">Class {cls}</span>
              <span className="ncert-code">{subject.books.length} book{subject.books.length > 1 ? 's' : ''}</span>
            </div>
            <h3>{subject.name}</h3>
            <p className="ncert-meta">
              {chapterCount(subject)} chapters · {subject.books.map((b) => b.title).join(' · ')}
            </p>
            <span className="btn btn-dark btn-sm">View all chapters →</span>
          </button>
        ))}
      </div>
    </div>
  );
}
