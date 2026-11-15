// NCERT Books library: every official NCERT textbook for Classes 9 to 12,
// English medium, with real chapter titles and official ncert.nic.in links.
// Class first, then subjects, then chapters on a new page: the browser
// below lists subjects, and tapping one opens all its chapters at
// /books/:class/:subject. One chapter (Class 10 Science, Chapter 2) is
// packed inside the app and opens in the in-app reader there.
import { NCERT_TOTAL_BOOKS, NCERT_TOTAL_CHAPTERS } from '../lib/ncertBooks';
import BooksBrowser from '../components/BooksBrowser';

export default function NcertBooks() {
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

      <section className="wrap ncert-browser">
        <BooksBrowser />
        <p className="ncert-footnote">
          All books are free NCERT textbooks from ncert.nic.in. Chapters open the
          official NCERT PDF in a new tab. Class 10 Science Chapter 2, Acids, Bases
          and Salts, is packed inside the app and reads here.
        </p>
      </section>
    </div>
  );
}
