import { TEACHER_PHOTO } from '../lib/teacherPhoto';

export default function PhotoTeacher({ speaking = false, listening = false }) {
  const state = speaking ? 'speaking' : listening ? 'listening' : 'idle';
  return (
    <div className={`photo-teacher ${state}`}>
      <img src={TEACHER_PHOTO} alt="Your AI teacher" draggable={false} />
    </div>
  );
}
