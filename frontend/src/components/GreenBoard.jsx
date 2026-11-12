// The green chalkboard. The teacher steps aside and explains on this
// when a question needs an equation or a diagram. Chalk lines appear one
// by one, top to bottom, and the active line (the one she is pointing
// at) is underlined in yellow chalk.
function Diagram({ kind }) {
  const stroke = '#f5f5e8';
  const yellow = '#ffd94d';
  if (kind === 'photosynthesis') {
    return (
      <svg viewBox="0 0 320 120" className="board-diagram" aria-hidden="true">
        <g fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round">
          <circle cx="42" cy="38" r="16" fill={yellow} stroke="none" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
            const r = (a * Math.PI) / 180;
            return <line key={a} x1={42 + Math.cos(r) * 22} y1={38 + Math.sin(r) * 22} x2={42 + Math.cos(r) * 30} y2={38 + Math.sin(r) * 30} />;
          })}
          <line x1="78" y1="52" x2="128" y2="62" markerEnd="url(#arr)" />
          <path d="M170 88 C150 50 175 30 200 38 C225 46 215 80 195 92 C185 98 175 96 170 88 Z" />
          <line x1="186" y1="92" x2="186" y2="112" />
          <line x1="222" y1="62" x2="272" y2="52" markerEnd="url(#arr)" />
          <defs><marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill={stroke} /></marker></defs>
        </g>
        <g fill={stroke} fontSize="13" fontFamily="inherit">
          <text x="18" y="112">sunlight</text>
          <text x="150" y="112">leaf</text>
          <text x="238" y="112">O2 out</text>
        </g>
      </svg>
    );
  }
  if (kind === 'newton') {
    return (
      <svg viewBox="0 0 320 120" className="board-diagram" aria-hidden="true">
        <g fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round">
          <line x1="20" y1="96" x2="300" y2="96" />
          <line x1="60" y1="96" x2="250" y2="96" strokeDasharray="6 8" stroke={yellow} />
          <circle cx="52" cy="80" r="15" fill={yellow} stroke="none" />
          <line x1="52" y1="80" x2="52" y2="96" />
          <line x1="80" y1="72" x2="150" y2="72" markerEnd="url(#arr2)" />
          <defs><marker id="arr2" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill={stroke} /></marker></defs>
        </g>
        <g fill={stroke} fontSize="13" fontFamily="inherit">
          <text x="30" y="26">ball keeps rolling</text>
          <text x="150" y="112">no force, no change</text>
        </g>
      </svg>
    );
  }
  if (kind === 'fractions') {
    return (
      <svg viewBox="0 0 320 120" className="board-diagram" aria-hidden="true">
        <g stroke={stroke} strokeWidth="3" fill="none">
          <circle cx="70" cy="60" r="42" />
          <line x1="70" y1="18" x2="70" y2="102" />
          <line x1="28" y1="60" x2="112" y2="60" />
          <path d="M70 60 L70 18 A42 42 0 0 1 112 60 Z" fill={yellow} opacity="0.85" stroke="none" />
          <path d="M70 60 L112 60 A42 42 0 0 1 70 102 Z" fill={yellow} opacity="0.55" stroke="none" />
          <path d="M70 60 L70 102 A42 42 0 0 1 28 60 Z" fill={yellow} opacity="0.85" stroke="none" />
        </g>
        <g fill={stroke} fontSize="13" fontFamily="inherit">
          <text x="160" y="48">4 equal slices</text>
          <text x="160" y="72">3 taken = 3/4</text>
          <text x="160" y="96">1 left = 1/4</text>
        </g>
      </svg>
    );
  }
  if (kind === 'thunder') {
    return (
      <svg viewBox="0 0 320 120" className="board-diagram" aria-hidden="true">
        <g fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M72 10 L48 62 L64 62 L52 110 L86 52 L68 52 Z" fill={yellow} stroke="none" />
          <path d="M150 34 A34 34 0 0 1 150 86" />
          <path d="M170 22 A50 50 0 0 1 170 98" />
          <path d="M190 12 A64 64 0 0 1 190 108" />
        </g>
        <g fill={stroke} fontSize="13" fontFamily="inherit">
          <text x="30" y="112">flash first</text>
          <text x="180" y="112">sound follows</text>
        </g>
      </svg>
    );
  }
  // algebra — a balance scale
  return (
    <svg viewBox="0 0 320 120" className="board-diagram" aria-hidden="true">
      <g fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round">
        <line x1="160" y1="18" x2="160" y2="100" />
        <line x1="70" y1="30" x2="250" y2="30" />
        <line x1="90" y1="30" x2="90" y2="52" />
        <line x1="230" y1="30" x2="230" y2="52" />
        <path d="M64 52 A26 26 0 0 0 116 52 Z" />
        <path d="M204 52 A26 26 0 0 0 256 52 Z" />
        <line x1="120" y1="100" x2="200" y2="100" />
      </g>
      <g fill={stroke} fontSize="14" fontFamily="inherit">
        <text x="70" y="88">2x + 3</text>
        <text x="226" y="88">11</text>
      </g>
    </svg>
  );
}

export default function GreenBoard({ topic, activeLine = 0 }) {
  if (!topic) return null;
  return (
    <div className="board" key={topic.id} role="img" aria-label={`Green board: ${topic.title}`}>
      <div className="board-inner">
        <div className="board-title">{topic.title}</div>
        <Diagram kind={topic.diagram} />
        <div className="board-lines">
          {topic.lines.map((line, i) => (
            <div
              key={i}
              className={`board-line ${i === activeLine ? 'active' : ''} ${i < activeLine ? 'done' : ''}`}
              style={{ animationDelay: `${0.15 + i * 0.45}s` }}
            >
              <span className="board-num">{i + 1}.</span> {line}
            </div>
          ))}
        </div>
        {topic.equation && <div className="board-eq">{topic.equation}</div>}
      </div>
    </div>
  );
}
