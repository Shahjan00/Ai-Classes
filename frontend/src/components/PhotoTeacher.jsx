import { useEffect, useRef, useState } from 'react';
import { TEACHER_PHOTO } from '../lib/teacherPhoto';
import { TEACHER_MOUTH_OPEN, TEACHER_MOUTH_SLIGHT, TEACHER_MOUTH_WIDE, TEACHER_MOUTH_O, TEACHER_BLINK } from '../lib/teacherFrames';

const FRAMES = [TEACHER_MOUTH_SLIGHT, TEACHER_MOUTH_OPEN, TEACHER_MOUTH_WIDE, TEACHER_MOUTH_O];

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
  const lastBoundaryRef = useRef(0);
  const boundariesSeenRef = useRef(false);
  const speakingStartRef = useRef(0);
  const seqRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    if (!speaking || wordIndex < 0) return;
    lastBoundaryRef.current = Date.now();
    boundariesSeenRef.current = true;
    if (seqRef.current) clearInterval(seqRef.current);
    if (closeRef.current) clearTimeout(closeRef.current);
    const frames = vowelFrames(word);
    const hold = Math.min(450, 150 + (word || '').length * 25);
    setMouth(frames[0]);
    if (frames.length === 1) {
      closeRef.current = setTimeout(() => setMouth(null), hold);
    } else {
      const stepMs = Math.max(90, Math.floor(hold / frames.length));
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
      boundariesSeenRef.current = false;
      return;
    }
    speakingStartRef.current = Date.now();
    boundariesSeenRef.current = false;
    const id = setInterval(() => {
      if (!boundariesSeenRef.current && Date.now() - speakingStartRef.current > 1200) {
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
  const cls = `photo-teacher ${state}${isQuestion && speaking ? ' question' : ''}`;
  return (
    <div className={cls}>
      <img src={frame} alt="Your AI teacher" draggable={false} />
    </div>
  );
}
