// The teacher, as AI video. While she speaks, the real Flow video plays
// (8 seconds, muted, looped — the spoken words come from speech
// synthesis, the video is the face). When she is not speaking she stands
// still as the base image, so she never looks like she is talking to no
// one. This replaces the old frame-swap mouth: the wide-open frame looked
// like screaming, and a video moves like a person. No split, no seam,
// no mouth timer. The video is frontend/public/teacher-video.mp4.
import { TEACHER_IMG } from '../lib/teacherImage';

export default function TeacherVideo({ state = 'idle', leanBoard = false, className = '' }) {
  const speaking = state === 'speaking';
  return (
    <div className="teacher-bob-wrap">
      <div
        className={`teacher-figure video ${className} ${state} ${leanBoard ? 'lean-board' : ''}`}
        role="img"
        aria-label="JARVISH, your AI teacher"
      >
        {speaking ? (
          <video
            key="teacher-video"
            src="/teacher-video.mp4"
            className="teacher-img"
            autoPlay
            muted
            loop
            playsInline
            aria-label="JARVISH speaking"
          />
        ) : (
          <img src={TEACHER_IMG} alt="JARVISH, your AI teacher" className="teacher-img" draggable="false" />
        )}
      </div>
    </div>
  );
}
