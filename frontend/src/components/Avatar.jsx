// The talking teacher — a layered SVG character modelled on the
// reference Shahjan picked: full body, navy suit, white shirt, brown
// hair in a bun, green book in her left arm, pointer stick in her
// right hand. Fully animated, all automatic:
//  - mouth opens and closes with the voice (mouth prop, 0..1, driven by
//    speech-synthesis word boundaries in the Teacher page)
//  - eyes blink on a timer and look around on their own
//  - head nods while she speaks, body sways gently
//  - right arm + stick rotate to point at the green board (pointing /
//    pointLevel props) when she explains on it.
import { useEffect, useState } from 'react';

const SKIN = '#f2c29b';
const SKIN_DARK = '#d89b6a';
const HAIR = '#4a2c1a';
const NAVY = '#232f63';
const NAVY_DARK = '#1b2450';
const BOOK = '#1d7a4f';
const STICK = '#8a5a2b';

export default function Avatar({ state = 'idle', mouth = 0, pointing = false, pointLevel = 0 }) {
  const [blink, setBlink] = useState(false);
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  const speaking = state === 'speaking';

  // Blink every few seconds.
  useEffect(() => {
    let alive = true;
    let t1;
    let t2;
    const loop = () => {
      t1 = setTimeout(() => {
        if (!alive) return;
        setBlink(true);
        t2 = setTimeout(() => {
          if (!alive) return;
          setBlink(false);
          loop();
        }, 140);
      }, 2200 + Math.random() * 2800);
    };
    loop();
    return () => {
      alive = false;
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Eyes wander on their own.
  useEffect(() => {
    let alive = true;
    let t;
    const loop = () => {
      t = setTimeout(() => {
        if (!alive) return;
        setGaze({ x: Math.random() * 7 - 3.5, y: Math.random() * 4 - 2 });
        loop();
      }, 2600 + Math.random() * 2600);
    };
    loop();
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, []);

  const mouthOpen = Math.max(0, Math.min(1, mouth));
  const mouthScale = 0.15 + mouthOpen * 1.5;

  return (
    <svg viewBox="0 0 400 560" className="teacher-svg" role="img" aria-label="JARVISH, your AI teacher">
      <ellipse cx="200" cy="542" rx="92" ry="12" fill="rgba(0,0,0,0.08)" />
      <g className="teacher-sway">
        {/* legs */}
        <rect x="166" y="378" width="27" height="128" rx="12" fill={SKIN} />
        <rect x="207" y="378" width="27" height="128" rx="12" fill={SKIN} />
        {/* heels */}
        <path d="M160 506 h34 v10 q0 8 -8 8 h-26 q-8 0 -8 -8 Z" fill="#1a1a2e" />
        <path d="M206 512 h34 v10 q0 8 -8 8 h-26 q-8 0 -8 -8 Z" fill="#1a1a2e" />
        {/* skirt */}
        <path d="M148 252 L252 252 L264 384 Q200 398 136 384 Z" fill={NAVY} />
        {/* blazer */}
        <path d="M146 152 Q200 128 254 152 L264 258 Q200 272 136 258 Z" fill={NAVY} />
        {/* white shirt + lapels */}
        <polygon points="176,148 224,148 200,212" fill="#ffffff" />
        <polygon points="176,148 200,212 188,216 166,152" fill={NAVY_DARK} />
        <polygon points="224,148 200,212 212,216 234,152" fill={NAVY_DARK} />
        <circle cx="200" cy="226" r="3.5" fill="#ffc700" />
        <circle cx="200" cy="244" r="3.5" fill="#ffc700" />
        {/* flower pin */}
        <g transform="translate(234 192)" fill="#ffc700">
          <circle cx="0" cy="-5" r="3" /><circle cx="5" cy="0" r="3" /><circle cx="0" cy="5" r="3" />
          <circle cx="-5" cy="0" r="3" /><circle cx="0" cy="0" r="2.4" fill="#fff" />
        </g>
        {/* left arm + green book (her left, viewer right) */}
        <path d="M248 160 Q270 210 256 258" fill="none" stroke={NAVY} strokeWidth="23" strokeLinecap="round" />
        <g transform="rotate(-12 256 276)">
          <rect x="226" y="238" width="62" height="78" rx="6" fill={BOOK} />
          <rect x="232" y="244" width="50" height="66" rx="4" fill="none" stroke="#ffd94d" strokeWidth="2" />
          <path d="M246 268 q8 -8 16 0 q8 8 16 0" fill="none" stroke="#ffd94d" strokeWidth="2" />
          <path d="M252 292 h24" stroke="#ffd94d" strokeWidth="2" />
          <path d="M252 300 h24" stroke="#ffd94d" strokeWidth="2" />
        </g>
        <circle cx="256" cy="258" r="10" fill={SKIN} />
        {/* neck */}
        <rect x="189" y="126" width="22" height="28" rx="8" fill={SKIN} />
        {/* right arm + pointer stick (her right, viewer left).
            Two poses, cross-faded: rest (stick raised, like the
            reference) and pointing (arm extended towards the board).
            pointLevel tilts the pointing arm between the top and
            bottom board lines. */}
        <g style={{ opacity: pointing ? 0 : 1, transition: 'opacity 0.45s ease' }}>
          <path d="M150 165 Q120 198 108 236" fill="none" stroke={NAVY} strokeWidth="23" strokeLinecap="round" />
          <path d="M108 236 Q100 202 96 168" fill="none" stroke={NAVY} strokeWidth="20" strokeLinecap="round" />
          <line x1="96" y1="168" x2="50" y2="94" stroke={STICK} strokeWidth="5" strokeLinecap="round" />
          <circle cx="96" cy="166" r="10" fill={SKIN} />
        </g>
        <g
          style={{
            opacity: pointing ? 1 : 0,
            transform: `rotate(${-8 + pointLevel * 20}deg)`,
            transformOrigin: '150px 165px',
            transformBox: 'view-box',
            transition: 'opacity 0.45s ease, transform 0.55s ease',
          }}
        >
          <path d="M150 165 Q176 196 186 216" fill="none" stroke={NAVY} strokeWidth="23" strokeLinecap="round" />
          <path d="M186 216 Q222 206 248 184" fill="none" stroke={NAVY} strokeWidth="20" strokeLinecap="round" />
          <line x1="248" y1="184" x2="316" y2="138" stroke={STICK} strokeWidth="5" strokeLinecap="round" />
          <circle cx="248" cy="184" r="10" fill={SKIN} />
        </g>
        {/* head */}
        <g className={speaking ? 'teacher-head talking' : 'teacher-head'}>
          {/* bun behind */}
          <circle cx="200" cy="48" r="24" fill={HAIR} />
          {/* ears */}
          <circle cx="153" cy="108" r="8" fill={SKIN} />
          <circle cx="247" cy="108" r="8" fill={SKIN} />
          <circle cx="153" cy="118" r="2" fill="#ffc700" />
          <circle cx="247" cy="118" r="2" fill="#ffc700" />
          {/* face */}
          <ellipse cx="200" cy="105" rx="47" ry="53" fill={SKIN} />
          {/* hair cap */}
          <path
            d="M152 104 Q146 42 200 40 Q254 42 248 104 Q246 76 232 68 Q238 92 224 90 Q230 60 200 56 Q170 60 176 90 Q162 92 168 68 Q154 76 152 104 Z"
            fill={HAIR}
          />
          {/* blush */}
          <circle cx="168" cy="120" r="7" fill="#f2a0a0" opacity="0.55" />
          <circle cx="232" cy="120" r="7" fill="#f2a0a0" opacity="0.55" />
          {/* eyebrows */}
          <path d="M170 88 Q180 83 191 88" fill="none" stroke={HAIR} strokeWidth="3" strokeLinecap="round" />
          <path d="M209 88 Q220 83 230 88" fill="none" stroke={HAIR} strokeWidth="3" strokeLinecap="round" />
          {/* eyes */}
          {[180, 220].map((cx) => (
            <g key={cx}>
              <ellipse cx={cx} cy="101" rx="9.5" ry="11.5" fill="#ffffff" />
              <g
                style={{
                  transform: `translate(${gaze.x}px, ${gaze.y}px)`,
                  transition: 'transform 0.5s ease',
                }}
              >
                <circle cx={cx} cy="102" r="4.6" fill="#2b2118" />
                <circle cx={cx + 1.6} cy="100" r="1.5" fill="#ffffff" />
              </g>
              <ellipse
                cx={cx}
                cy="101"
                rx="10"
                ry="12"
                fill={SKIN}
                style={{
                  transform: blink ? 'scaleY(1)' : 'scaleY(0)',
                  transformBox: 'fill-box',
                  transformOrigin: '50% 0%',
                  transition: 'transform 90ms ease',
                }}
              />
            </g>
          ))}
          {/* nose */}
          <path d="M200 106 Q204 116 198 120" fill="none" stroke={SKIN_DARK} strokeWidth="2.5" strokeLinecap="round" />
          {/* mouth: smile when closed, open mouth while talking */}
          <path
            d="M186 132 Q200 144 214 132"
            fill="none"
            stroke="#b3552e"
            strokeWidth="3"
            strokeLinecap="round"
            style={{ opacity: 1 - mouthOpen, transition: 'opacity 120ms' }}
          />
          <ellipse
            cx="200"
            cy="136"
            rx="9"
            ry="6.5"
            fill="#7a2e1d"
            style={{
              transform: `scaleY(${mouthScale})`,
              transformBox: 'fill-box',
              transformOrigin: 'center',
              opacity: mouthOpen > 0.04 ? 1 : 0,
              transition: 'transform 90ms ease, opacity 90ms ease',
            }}
          />
        </g>
      </g>
    </svg>
  );
}
