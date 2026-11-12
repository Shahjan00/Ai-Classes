// JARVISH the robot teacher. A friendly little bot with a screen face,
// drawn as pure SVG, so it is crisp at any size and cheap to animate.
// No photo, no video, no uncanny face: the mouth is a simple shape that
// opens and closes (CSS) while he speaks, the eyes change with his state,
// the antenna glows while he listens or thinks, and he waves when happy.
// Replaces the girl teacher (photo + video) entirely.
export default function RobotTeacher({ state = 'idle', leanBoard = false, className = '' }) {
  const happy = state === 'happy';
  const thinking = state === 'thinking';
  const listening = state === 'listening';
  const speaking = state === 'speaking';

  const eye = (cx) => {
    if (happy) {
      // Happy eyes: upside-down U arcs.
      return (
        <path
          key={cx}
          d={`M ${cx - 15} 108 Q ${cx} 88 ${cx + 15} 108`}
          fill="none"
          stroke="#ffd94d"
          strokeWidth="7"
          strokeLinecap="round"
        />
      );
    }
    // Round glowing eyes. Thinking looks up, listening goes wide.
    const ry = listening ? 24 : 19;
    const cy = thinking ? 96 : 104;
    return (
      <g key={cx}>
        <ellipse cx={cx} cy={cy} rx="15" ry={ry} fill="#ffd94d" />
        <circle cx={cx - 5} cy={cy - 7} r="4.5" fill="#fff7cc" />
      </g>
    );
  };

  return (
    <div className="teacher-bob-wrap">
      <div
        className={`teacher-figure robot ${className} ${state} ${leanBoard ? 'lean-board' : ''}`}
        role="img"
        aria-label="JARVISH, your robot teacher"
      >
        <svg viewBox="0 0 360 540" className="teacher-img" aria-hidden="true">
          {/* soft floor shadow */}
          <ellipse cx="180" cy="522" rx="105" ry="12" fill="#000" opacity="0.08" />

          {/* antenna */}
          <line x1="180" y1="52" x2="180" y2="20" stroke="#9ca3af" strokeWidth="7" strokeLinecap="round" />
          <circle className="robot-antenna-tip" cx="180" cy="14" r="10" fill="#ffd94d" />

          {/* ears / headphones */}
          <circle cx="60" cy="128" r="15" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="2" />
          <circle cx="300" cy="128" r="15" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="2" />

          {/* head: the screen face */}
          <rect x="70" y="52" width="220" height="152" rx="38" fill="#151524" />
          <rect x="70" y="52" width="220" height="152" rx="38" fill="none" stroke="#000" strokeOpacity="0.12" strokeWidth="2" />
          {eye(128)}
          {eye(232)}
          {/* mouth: talking bar while speaking, open smile when happy, small smile otherwise */}
          {speaking ? (
            <rect className="robot-mouth" x="158" y="142" width="44" height="18" rx="9" fill="#ffd94d" />
          ) : happy ? (
            <path d="M 152 140 Q 180 172 208 140 Q 180 152 152 140 Z" fill="#ffd94d" />
          ) : (
            <path d="M 152 144 Q 180 160 208 144" fill="none" stroke="#ffd94d" strokeWidth="6" strokeLinecap="round" />
          )}
          {/* thinking dots */}
          {thinking && (
            <g fill="#ffd94d">
              <circle cx="156" cy="176" r="4" />
              <circle cx="180" cy="176" r="4" />
              <circle cx="204" cy="176" r="4" />
            </g>
          )}

          {/* neck */}
          <rect x="164" y="204" width="32" height="18" rx="6" fill="#d1d5db" />

          {/* left arm */}
          <rect x="66" y="238" width="26" height="120" rx="13" fill="#ffffff" stroke="#e5e7eb" strokeWidth="2" transform="rotate(8 79 238)" />
          {/* right arm (waves when happy) */}
          <g className="robot-wave-arm">
            <rect x="268" y="238" width="26" height="120" rx="13" fill="#ffffff" stroke="#e5e7eb" strokeWidth="2" transform="rotate(-8 281 238)" />
          </g>

          {/* body */}
          <rect x="92" y="222" width="176" height="196" rx="42" fill="#ffffff" stroke="#e5e7eb" strokeWidth="2" />
          {/* chest screen with a bolt */}
          <rect x="122" y="248" width="116" height="66" rx="14" fill="#151524" />
          <path d="M 186 258 L 168 288 L 180 288 L 172 306 L 194 278 L 182 278 Z" fill="#ffd94d" />
          {/* chest buttons */}
          <circle cx="150" cy="340" r="8" fill="#ffd94d" />
          <circle cx="180" cy="340" r="8" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="2" />
          <circle cx="210" cy="340" r="8" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="2" />
          {/* belly line */}
          <rect x="130" y="372" width="100" height="10" rx="5" fill="#f3f4f6" />

          {/* feet */}
          <rect x="118" y="418" width="52" height="26" rx="13" fill="#151524" />
          <rect x="190" y="418" width="52" height="26" rx="13" fill="#151524" />
          {/* wheel dots on the feet */}
          <circle cx="144" cy="431" r="5" fill="#ffd94d" />
          <circle cx="216" cy="431" r="5" fill="#ffd94d" />
        </svg>
      </div>
    </div>
  );
}
