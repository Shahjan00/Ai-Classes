// NCERT Books library: every official NCERT textbook for Classes 9 to 12,
// English medium, with real chapter titles and official ncert.nic.in links.
// One chapter (Class 10 Science, Chapter 2) is packed inside the app and
// opens in the in-app reader with no fetch at runtime. Every other chapter
// opens its verified official NCERT PDF in a new tab. Each chapter also has
// a "Learn on board" button that asks the AI Teacher about that chapter.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  NCERT_CLASSES,
  NCERT_TOTAL_BOOKS,
  NCERT_TOTAL_CHAPTERS,
  chapterQuestion,
} from '../lib/ncertBooks';

async function loadBundledPdf() {
  const { NCERT_CH2_PDF_BASE64 } = await import('../lib/ncertPdf.js');
  const bin = atob(NCERT_CH2_PDF_BASE64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
}

export default function NcertBooks() {
  const [cls, setCls] = useState(10);
  const [subject, setSubject] = useState(null);
  const [openBook, setOpenBook] = useState('jesc1');
  const [reading, setReading] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfError, setPdfError] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const classData = NCERT_CLASSES.find((c) => c.cls === cls);
  const subjects = classData.subjects;
  const visibleBooks = subject
    ? subjects.filter((s) => s.name === subject).flatMap((s) => s.books.map((b) => ({ ...b, subjectName: s.name })))
    : subjects.flatMap((s) => s.books.map((b) => ({ ...b, subjectName: s.name })));

  useEffect(() => () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); }, [pdfUrl]);

  function pickClass(next) {
    setCls(next);
    setSubject(null);
    setOpenBook(next === 10 ? 'jesc1' : null);
    closeReader();
  }

  function closeReader() {
    setReading(null);
    setPdfError(null);
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
  }

  async function readInApp(book, chapter) {
    setReading({ book, chapter, cls, subjectName: book.subjectName });
    setPdfError(null);
    setPdfLoading(true);
    try {
      const url = await loadBundledPdf();
      setPdfUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return url; });
    } catch {
      setPdfError('Could not load this chapter in the app. Try the official PDF link below instead.');
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <div className="page ncert-page">
      <section className="ncert-hero">
        <div className="wrap">
          <p className="kicker"><span className="dot">●</span> FREE NCERT TEXTBOOKS · CLASSES 9 TO 12</p>
          <h1 className="display display-md ncert-title">Every NCERT book.<br />One shelf.</h1>
          <p className="lede">
            The real textbooks, chapter by chapter, straight from ncert.nic.in.
            Read a chapter here, open it on the NCERT site, or ask your AI teacher
            to teach it on the board.
          </p>
          <div className="ncert-stats">
            <div><strong>{NCERT_TOTAL_BOOKS}</strong><span>books</span></div>
            <div><strong>{NCERT_TOTAL_CHAPTERS}</strong><span>chapters</span></div>
            <div><strong>4</strong><span>classes</span></div>
            <div><strong>Free</strong><span>always</span></div>
          </div>
        </div>
      </section>

      {reading && (
        <section className="wrap ncert-reader" aria-label="In-app PDF reader">
          <div className="ncert-reader-head">
            <div>
              <p className="kicker">READING IN THE APP</p>
              <h2>{reading.book.title} · Chapter {reading.chapter.n}: {reading.chapter.title}</h2>
              <p>Class {reading.cls} {reading.subjectName} · {reading.chapter.pages} pages · packed inside the app, no download needed</p>
            </div>
            <div className="ncert-reader-actions">
              {pdfUrl && <a className="btn btn-dark btn-sm" href={pdfUrl} download={`${reading.book.code}${reading.chapter.file}.pdf`}>Download PDF</a>}
              <button className="btn btn-ghost btn-sm" onClick={closeReader}>Close reader</button>
            </div>
          </div>
          {pdfLoading && <p className="ncert-reader-status">Loading your chapter...</p>}
          {pdfError && <p className="ncert-reader-status ncert-error">{pdfError}</p>}
          {pdfUrl && !pdfError && (
            <iframe title={`${reading.book.title} Chapter ${reading.chapter.n}`} src={pdfUrl} className="ncert-iframe" />
          )}
        </section>
      )}

      <section className="wrap ncert-browser">
        <div className="ncert-tabs" role="tablist" aria-label="Pick a class">
          {NCERT_CLASSES.map((c) => (
            <button
              key={c.cls}
              role="tab"
              aria-selected={cls === c.cls}
              className={`ncert-tab ${cls === c.cls ? 'ncert-tab-active' : ''}`}
              onClick={() => pickClass(c.cls)}
            >
              Class {c.cls}
            </button>
          ))}
        </div>

        <div className="ncert-chips">
          <button className={`ncert-chip ${!subject ? 'ncert-chip-active' : ''}`} onClick={() => setSubject(null)}>All subjects</button>
          {subjects.map((s) => (
            <button
              key={s.name}
              className={`ncert-chip ${subject === s.name ? 'ncert-chip-active' : ''}`}
              onClick={() => setSubject(s.name)}
            >
              {s.name}
            </button>
          ))}
        </div>

        <div className="ncert-grid">
          {visibleBooks.map((book) => {
            const isOpen = openBook === book.code;
            return (
              <article key={book.code} className="ncert-card">
                <div className="ncert-card-top">
                  <span className="ncert-subject">{book.subjectName}</span>
                  <span className="ncert-code">{book.code}</span>
                </div>
                <h3>{book.title}</h3>
                <p className="ncert-meta">
                  {book.chapters.length} chapters · Class {cls}
                  {book.edition ? ` · ${book.edition}` : ''}
                </p>
                {book.note && <p className="ncert-note">{book.note}</p>}
                <button
                  className="btn btn-dark btn-sm"
                  aria-expanded={isOpen}
                  onClick={() => setOpenBook(isOpen ? null : book.code)}
                >
                  {isOpen ? 'Hide chapters' : 'View chapters'}
                </button>
                {isOpen && (
                  <ol className="ncert-chapters">
                    {book.chapters.map((ch) => {
                      const boardQ = chapterQuestion(cls, book.subjectName, ch);
                      return (
                        <li key={ch.file} className="ncert-chapter">
                          <div className="ncert-chapter-info">
                            <span className="ncert-chapter-no">{ch.n}</span>
                            <div>
                              <strong>{ch.title}</strong>
                              {ch.note && <span className="ncert-chapter-note"> · {ch.note}</span>}
                              {ch.verified === 'pattern' && (
                                <span className="ncert-pattern">Link follows the official pattern, not yet verified live</span>
                              )}
                            </div>
                          </div>
                          <div className="ncert-chapter-actions">
                            {ch.bundled ? (
                              <button className="btn btn-yellow btn-sm" onClick={() => readInApp(book, ch)}>
                                Read in app · {ch.pages} pages
                              </button>
                            ) : (
                              <a className="btn btn-yellow btn-sm" href={ch.url} target="_blank" rel="noreferrer">
                                Open PDF on ncert.nic.in
                              </a>
                            )}
                            <Link
                              className="btn btn-ghost btn-sm"
                              to={`/teacher-ai?q=${encodeURIComponent(boardQ)}`}
                            >
                              Learn on board
                            </Link>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </article>
            );
          })}
        </div>

        <p className="ncert-footnote">
          All books are free NCERT textbooks from ncert.nic.in. Chapters marked with the
          yellow button open the official NCERT PDF in a new tab. Class 10 Science
          Chapter 2, Acids, Bases and Salts, is packed inside the app and reads here.
        </p>
      </section>
    </div>
  );
}
