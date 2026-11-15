// One subject's chapters, on their own page: /books/:class/:subject.
// Reached by tapping a subject in the Books browser (Notes page or NCERT
// Books page). Lists every book of that subject with all its chapters.
// Chapter links open the official NCERT PDF in a new tab; Class 10
// Science Chapter 2 is packed inside the app and reads here instead.
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { NCERT_CLASSES, chapterQuestion } from '../lib/ncertBooks';

async function loadBundledPdf() {
  const { NCERT_CH2_PDF_BASE64 } = await import('../lib/ncertPdf.js');
  const bin = atob(NCERT_CH2_PDF_BASE64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
}

export default function BookChapters() {
  const { cls: clsParam, subject: subjectParam } = useParams();
  const cls = Number(clsParam);
  const subjectName = decodeURIComponent(subjectParam || '');
  const [reading, setReading] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfError, setPdfError] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const classData = NCERT_CLASSES.find((c) => c.cls === cls);
  const subject = classData ? classData.subjects.find((s) => s.name === subjectName) : null;

  useEffect(() => () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); }, [pdfUrl]);
  // A different subject means a fresh page: close any open reader.
  useEffect(() => {
    setReading(null);
    setPdfError(null);
    setPdfUrl(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clsParam, subjectParam]);

  function closeReader() {
    setReading(null);
    setPdfError(null);
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
  }

  async function readInApp(book, chapter) {
    setReading({ book, chapter });
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

  if (!classData || !subject) {
    return (
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="wrap">
          <p className="kicker"><span className="dot">●</span> NCERT Books</p>
          <h1 className="display display-md">That subject is not here.</h1>
          <p className="lede">Pick a class and a subject from the Books section instead.</p>
          <Link className="btn btn-yellow" to="/notes-maker">Go to Notes</Link>
        </div>
      </section>
    );
  }

  const totalChapters = subject.books.reduce((n, b) => n + b.chapters.length, 0);

  return (
    <div className="page ncert-page">
      <section className="ncert-hero">
        <div className="wrap">
          <p className="kicker"><span className="dot">●</span> CLASS {cls} · NCERT TEXTBOOKS</p>
          <h1 className="display display-md ncert-title">{subject.name}</h1>
          <p className="lede">
            {subject.books.length} book{subject.books.length > 1 ? 's' : ''} · {totalChapters} chapters.
            Read a chapter here, open it on the NCERT site, or ask your AI teacher
            to teach it on the board.
          </p>
          <Link className="btn btn-ghost" to="/notes-maker">← Back to Notes</Link>
        </div>
      </section>

      {reading && (
        <section className="wrap ncert-reader" aria-label="In-app PDF reader">
          <div className="ncert-reader-head">
            <div>
              <p className="kicker">READING IN THE APP</p>
              <h2>{reading.book.title} · Chapter {reading.chapter.n}: {reading.chapter.title}</h2>
              <p>Class {cls} {subject.name} · {reading.chapter.pages} pages · packed inside the app, no download needed</p>
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
        {subject.books.map((book) => (
          <article key={book.code} className="ncert-card" style={{ marginBottom: 20 }}>
            <div className="ncert-card-top">
              <span className="ncert-subject">{subject.name}</span>
              <span className="ncert-code">{book.code}</span>
            </div>
            <h3>{book.title}</h3>
            <p className="ncert-meta">
              {book.chapters.length} chapters · Class {cls}
              {book.edition ? ` · ${book.edition}` : ''}
            </p>
            {book.note && <p className="ncert-note">{book.note}</p>}
            <ol className="ncert-chapters">
              {book.chapters.map((ch) => {
                const boardQ = chapterQuestion(cls, subject.name, ch);
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
          </article>
        ))}

        <p className="ncert-footnote">
          All books are free NCERT textbooks from ncert.nic.in. Chapters open the
          official NCERT PDF in a new tab. Class 10 Science Chapter 2, Acids, Bases
          and Salts, is packed inside the app and reads here.
        </p>
      </section>
    </div>
  );
}
