// The teacher, split into head and body so she can actually MOVE.
// The head is a tight crop (hair to chin/neck, rows 0..275 of the figure)
// from one of five frames: closed mouth, slightly open, wide open, blink
// (eyes closed) and happy. The body is always the base image, so the body
// never jitters when the face changes. The body starts just below the chin
// and overlaps the head at the neck, so the seam stays invisible and only
// the head ever moves — never the shoulders. The mouth swaps frames while
// she speaks (mouthFrame prop); she blinks every few seconds on her own.
import { useEffect, useState } from 'react';
import { TEACHER_IMG } from '../lib/teacherImage';
import {
  HEAD_CLOSED, HEAD_SLIGHT, HEAD_WIDE, HEAD_BLINK, HEAD_HAPPY,
} from '../lib/teacherHeadFrames';

const HEAD_FRAMES = {
  0: HEAD_CLOSED,
  1: HEAD_SLIGHT,
  2: HEAD_WIDE,
  3: HEAD_BLINK,
};

export default function TeacherFigure({ state = 'idle', leanBoard = false, mouthFrame = 0, className = '' }) {
  const [blinking, setBlinking] = useState(false);
  useEffect(() => {
    let alive = true;
    let off;
    const id = setInterval(() => {
      if (!alive) return;
      setBlinking(true);
      off = setTimeout(() => { if (alive) setBlinking(false); }, 150);
    }, 3400);
    return () => { alive = false; clearInterval(id); clearTimeout(off); };
  }, []);
  const headSrc = blinking
    ? HEAD_BLINK
    : (state === 'happy' ? HEAD_HAPPY : (HEAD_FRAMES[mouthFrame] || HEAD_CLOSED));
  return (
    <div className="teacher-bob-wrap">
      <div
        className={`teacher-figure ${className} ${state} ${leanBoard ? 'lean-board' : ''}`}
        data-mouth={mouthFrame}
        role="img"
        aria-label="JARVISH, your AI teacher"
      >
        <img src={TEACHER_IMG} alt="" className="teacher-layer teacher-body" aria-hidden="true" draggable="false" />
        <img src={headSrc} alt="JARVISH, your AI teacher" className="teacher-layer teacher-head" draggable="false" />
      </div>
    </div>
  );
}
