import { useEffect, useRef, useState } from 'react';
import { TEACHER_PHOTO } from '../lib/teacherPhoto';
import { TEACHER_MOUTH_OPEN, TEACHER_MOUTH_SLIGHT, TEACHER_MOUTH_WIDE, TEACHER_MOUTH_O, TEACHER_BLINK } from '../lib/teacherFrames';

const FRAMES = [TEACHER_MOUTH_SLIGHT, TEACHER_MOUTH_OPEN, TEACHER_MOUTH_WIDE, TEACHER_MOUTH_O];

function mouthFor(word) {
  const w = (word || '').toLowerCase();
  if (w.length <= 2) return TEACHER_MOUTH_SLIGHT;
  const m = w.match(/[aeiou]/);
  if (!m) return TEACHER_MOUTH_SLIGHT;
  if (m[0] === 'o' || m[0] === 'u') return TEACHER_MOUTH_O;
  if (m[0] === 'a') return TEACHER_MOUTH_WIDE;
  return TEACHER_MOUTH_OPEN;
}

export default function PhotoTeacher({ speaking = false, listening = false, wordIndex = -1, word = '' }) {
  const [mouth, setMouth] = useState(null);
  const [blinking, setBlinking] = useState(false);
  const lastBoundaryRef = useRef(0);
  const closeRef = useRef(null);

  useEffect(() => {
    if (!speaking || wordIndex < 0) return;
    lastBoundaryRef.current = Date.now();
    setMouth(mouthFor(word));
    if (closeRef.current) clearTimeout(closeRef.current);
    const hold = Math.min(450, 150 + (word || '').length * 25);
    closeRef.current = setTimeout(() => setMouth(null), hold);
    return () => clearTimeout(closeRef.current);
  }, [wordIndex, speaking, word]);

  useEffect(() => {
    if (!speaking) {
      setMouth(null);
      return;
    }
    const id = setInterval(() => {
      if (Date.now() - lastBoundaryRef.current > 800) {
        setMouth(FRAMES[Math.floor(Math.random() * FRAMES.length)]);
        setTimeout(() => setMouth(null), 220);
      }
    }, 380);
    return () => clearInterval(id);
  }, [speaking]);

  useEffect(() => {
    let alive = true;
    let t1;
    let t2;
    const schedule = () => {
      t1 = setTimeout(() => {
        if (!alive) return;
        setBlinking(true);
        t2 = setTimeout(() => { if (alive) setBlinking(false); }, 160);
        schedule();
      }, 2000 + Math.random() * 3000);
    };
    schedule();
    return () => { alive = false; clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const frame = blinking ? TEACHER_BLINK : mouth && speaking ? mouth : TEACHER_PHOTO;
  const state = speaking ? 'speaking' : listening ? 'listening' : 'idle';
  return (
    <div className={`photo-teacher ${state}`}>
      <img src={frame} alt="Your AI teacher" draggable={false} />
    </div>
  );
}
