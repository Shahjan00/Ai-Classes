// The teacher is the user's robot, not a drawing: three real poses of the
// same 3D character, and he changes pose with his mood. All three poses
// are stacked; only the active one is opaque, so he crossfades smoothly
// between moods instead of snapping. He breathes (a slow scale) and bobs
// the whole time, so he feels alive instead of pasted on.
//   idle      -> atom in hand, two round eyes, neutral
//   listening -> magnifying glass, one wink, curious
//   thinking  -> magnifying glass, searching for the answer
//   speaking  -> book + lightbulb, happy, teaching
//   happy     -> book + lightbulb, happy closed eyes
const POSES = {
  idle: '/robot-idle.png',
  search: '/robot-search.png',
  teach: '/robot-teach.png',
};

const POSE_FOR_STATE = {
  idle: 'idle',
  listening: 'search',
  thinking: 'search',
  speaking: 'teach',
  happy: 'teach',
};

export default function RobotImg({ state = 'idle', leanBoard = false, className = '' }) {
  const pose = POSE_FOR_STATE[state] || 'idle';
  return (
    <div className={`teacher-figure robot-img ${state} ${leanBoard ? 'lean-board' : ''} ${className}`}>
      <div className="teacher-bob-wrap">
        {Object.entries(POSES).map(([name, src]) => (
          <img
            key={name}
            src={src}
            alt=""
            draggable={false}
            className={`robot-pose ${pose === name ? 'active' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}
