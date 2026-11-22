import { useEffect, useRef, useState } from 'react';
import { TEACHER_PHOTO } from '../lib/teacherPhoto';
import { TEACHER_MOUTH_OPEN, TEACHER_BLINK } from '../lib/teacherFrames';

export default function PhotoTeacher({ speaking = false, listening = false, wordIndex = -1 }) {
  const [mouthOpen, setMouthOpen] = useState(false);
  const [blinking, setBlinking] = useState(false);
  const lastBoundaryRef = useRef(0);
  const closeRef = useRef(null);

  useEffect(() => {
    if (!speaking || wordIndex < 0) return;
    lastBoundaryRef.current = Date.now();
    setMouthOpen(true);
    if (closeRef.current) clearTimeout(closeRef.current);
    closeRef.current = setTimeout(() => setMouthOpen(false), 200);
    return () => clearTimeout(closeRef.current);
  }, [wordIndex, speaking]);

  useEffect(() => {
    if (!speaking) {
      setMouthOpen(false);
      return;
    }
    const id = setInterval(() => {
      if (Date.now() - lastBoundaryRef.current > 800) setMouthOpen((v) => !v);
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

  const frame = blinking ? TEACHER_BLINK : mouthOpen && speaking ? TEACHER_MOUTH_OPEN : TEACHER_PHOTO;
  const state = speaking ? 'speaking' : listening ? 'listening' : 'idle';
  return (
    <div className={`photo-teacher ${state}`}>
      <img src={frame} alt="Your AI teacher" draggable={false} />
    </div>
  );
}
