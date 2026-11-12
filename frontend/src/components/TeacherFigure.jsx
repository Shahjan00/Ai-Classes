// The teacher, one full figure. No head/body split, no clip, no seam:
// the whole figure swaps between five aligned frames (base mouth
// closed, slightly open, wide open, blink, happy), so a face line is
// impossible by construction. Life comes from the whole figure: gentle
// bob, a slight tilt while she speaks, a lean toward the board, plus the
// mouth frames cycling and a blink every few seconds. All frames are
// face-centroid aligned, so swapping never moves the body.
import { useEffect, useState } from 'react';
import { TEACHER_IMG } from '../lib/teacherImage';
import {
  FRAME_SLIGHT, FRAME_WIDE, FRAME_BLINK, FRAME_HAPPY,
} from '../lib/teacherFrames';

const FRAMES = {
  0: TEACHER_IMG,
  1: FRAME_SLIGHT,
  2: FRAME_WIDE,
  3: FRAME_BLINK,
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
  const src = blinking
    ? FRAME_BLINK
    : (state === 'happy' ? FRAME_HAPPY : (FRAMES[mouthFrame] || TEACHER_IMG));
  return (
    <div className="teacher-bob-wrap">
      <div
        className={`teacher-figure ${className} ${state} ${leanBoard ? 'lean-board' : ''}`}
        data-mouth={mouthFrame}
        role="img"
        aria-label="JARVISH, your AI teacher"
      >
        <img src={src} alt="JARVISH, your AI teacher" className="teacher-img" draggable="false" />
      </div>
    </div>
  );
}
