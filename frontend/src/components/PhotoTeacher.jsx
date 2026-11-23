import { useEffect, useRef, useState } from 'react';
import { TEACHER_PHOTO } from '../lib/teacherPhoto';
import { TEACHER_MOUTH_OPEN, TEACHER_MOUTH_SLIGHT, TEACHER_MOUTH_WIDE, TEACHER_MOUTH_O, TEACHER_BLINK } from '../lib/teacherFrames';

function mouthForVowel(v) {
  if (v === 'o' || v === 'u') return TEACHER_MOUTH_O;
  if (v === 'a') return TEACHER_MOUTH_WIDE;
  return TEACHER_MOUTH_OPEN;
}

function vowelFrames(word) {
  const w = (word || '').toLowerCase();
  if (w.length <= 2) return [TEACHER_MOUTH_SLIGHT];
  const groups = w.match(/[aeiou]+/g) || [];
  if (!groups.length) return [TEACHER_MOUTH_SLIGHT];
  return groups.map((g) => mouthForVowel(g[0]));
}

export default function PhotoTeacher({ speaking = false, listening = false, wordIndex = -1, word = '', isQuestion = false }) {
  const [mouth, setMouth] = useState(null);
  const [blinking, setBlinking] = useState(false);
  const [paused, setPaused] = useState(false);
  const lastWordRef = useRef(0);
  const seqRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    if (!speaking || wordIndex < 0) return;
    lastWordRef.current = Date.now();
    setPaused(false);
    if (seqRef.current) clearInterval(seqRef.current);
    if (closeRef.current) clearTimeout(closeRef.current);
    const frames = vowelFrames(word);
    const hold = Math.min(600, 200 + (word || '').length * 35);
    setMouth(frames[0]);
    if (frames.length === 1) {
      closeRef.current = setTimeout(() => setMouth(null), hold);
    } else {
      const stepMs = Math.max(140, Math.floor(hold / frames.length));
      let i = 1;
      seqRef.current = setInterval(() => {
        if (i >= frames.length) {
          clearInterval(seqRef.current);
          seqRef.current = null;
          setMouth(null);
        } else {
          setMouth(frames[i]);
          i += 1;
        }
      }, stepMs);
    }
    return () => {
      if (seqRef.current) clearInterval(seqRef.current);
      if (closeRef.current) clearTimeout(closeRef.current);
    };
  }, [wordIndex, speaking, word]);

  useEffect(() => {
    if (!speaking) {
      setMouth(null);
      setPaused(false);
      return;
    }
    lastWordRef.current = Date.now();
    setMouth(TEACHER_MOUTH_OPEN);
    const id = setInterval(() => {
      if (Date.now() - lastWordRef.current > 800) {
        setPaused(true);
        setMouth(null);
      }
    }, 200);
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
  const cls = `photo-teacher ${state}${paused && speaking ? ' paused' : ''}${isQuestion && speaking ? ' question' : ''}`;
  return (
    <div className={cls}>
      <img src={frame} alt="Your AI teacher" draggable={false} />
    </div>
  );
}
