// The teacher, split into head and body so she can actually MOVE.
// One image (TEACHER_IMG) rendered twice: the head layer is clipped to the
// top of the figure with a feathered mask at the neck, the body layer is
// clipped below it. Both layers show the same pixels at the seam, so it
// stays invisible. The head nods and tilts while she speaks and looks
// around when idle; the body breathes on its own. No fake mouth overlay —
// that always looks wrong.
// mouthFrame is the hook for real mouth variants: when the user supplies
// open/closed-mouth head images, add them to HEAD_FRAMES and the head
// swaps frames while speaking. Frame 0 is the base image.
import { TEACHER_IMG } from '../lib/teacherImage';

const HEAD_FRAMES = {
  0: TEACHER_IMG,
};

export default function TeacherFigure({ state = 'idle', leanBoard = false, mouthFrame = 0, className = '' }) {
  const headSrc = HEAD_FRAMES[mouthFrame] || TEACHER_IMG;
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
