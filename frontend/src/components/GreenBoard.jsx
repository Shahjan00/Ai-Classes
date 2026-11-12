// The green chalkboard — a GENERIC chalk renderer. It draws whatever the
// board spec says: the backend (Groq in live mode, the demo table in demo
// mode) picks the diagram type and fills the content for ANY question, so
// the board is no longer limited to a handful of fixed topics. Chalk lines
// appear one by one, top to bottom, and the active line (the one she is
// pointing at) is underlined in yellow chalk.
const CHALK = '#f5f5e8';
const YELLOW = '#ffd94d';

// Split a label into at most two short lines so it fits a chalk box.
function wrapLines(text, maxChars = 12) {
  const words = String(text || '').split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars && cur) { lines.push(cur); cur = w; }
    else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 2);
}

function ArrowDefs({ id }) {
  return (
    <defs>
      <marker id={id} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
        <path d="M0 0 L8 4 L0 8 Z" fill={CHALK} />
      </marker>
    </defs>
  );
}

function FlowDiagram({ labels }) {
  const items = labels.slice(0, 4);
  const n = items.length;
  const gap = 34;
  const w = (560 - gap * (n - 1)) / n;
  const h = 78;
  const y = 66;
  return (
    <svg viewBox="0 0 560 210" className="board-diagram" aria-hidden="true">
      <ArrowDefs id="flow-arr" />
      {items.map((label, i) => {
        const x = i * (w + gap);
        const lines = wrapLines(label, 13);
        return (
          <g key={i}>
            <rect x={x} y={y} width={w} height={h} rx="10" fill="none" stroke={CHALK} strokeWidth="3" />
            <text x={x + w / 2} y={y + h / 2 - (lines.length - 1) * 9 + 5} textAnchor="middle" fill={CHALK} fontSize="15" fontFamily="inherit">
              {lines.map((ln, j) => (<tspan key={j} x={x + w / 2} dy={j === 0 ? 0 : 18}>{ln}</tspan>))}
            </text>
            {i < n - 1 && (
              <line x1={x + w + 4} y1={y + h / 2} x2={x + w + gap - 4} y2={y + h / 2} stroke={CHALK} strokeWidth="3" markerEnd="url(#flow-arr)" />
            )}
          </g>
        );
      })}
    </svg>
  );
}

function BarsDiagram({ labels, values, unit }) {
  const items = labels.slice(0, 4);
  const max = Math.max(...(values || [1]), 1);
  return (
    <svg viewBox="0 0 560 210" className="board-diagram" aria-hidden="true">
      {items.map((label, i) => {
        const v = values[i] || 0;
        const bw = Math.max(10, (v / max) * 330);
        const y = 28 + i * 46;
        return (
          <g key={i}>
            <text x="118" y={y + 16} textAnchor="end" fill={CHALK} fontSize="14" fontFamily="inherit">{label}</text>
            <rect x="130" y={y} width={bw} height="26" rx="6" fill={YELLOW} opacity="0.9" />
            <text x={140 + bw} y={y + 18} fill={CHALK} fontSize="13" fontFamily="inherit">{v.toLocaleString('en-IN')}</text>
          </g>
        );
      })}
      {unit && <text x="130" y="205" fill={CHALK} fontSize="12" fontFamily="inherit" opacity="0.8">{unit}</text>}
    </svg>
  );
}

function CycleDiagram({ labels }) {
  const items = labels.slice(0, 4);
  const spots = [
    { cx: 280, cy: 42, lx: 280, ly: 18 },
    { cx: 450, cy: 105, lx: 505, ly: 109 },
    { cx: 280, cy: 168, lx: 280, ly: 200 },
    { cx: 110, cy: 105, lx: 55, ly: 109 },
  ];
  const arcs = [
    'M 280 42 A 170 63 0 0 1 450 105',
    'M 450 105 A 170 63 0 0 1 280 168',
    'M 280 168 A 170 63 0 0 1 110 105',
    'M 110 105 A 170 63 0 0 1 280 42',
  ];
  return (
    <svg viewBox="0 0 560 210" className="board-diagram" aria-hidden="true">
      <ArrowDefs id="cyc-arr" />
      <g fill="none" stroke={CHALK} strokeWidth="2.5">
        {arcs.map((d, i) => (<path key={i} d={d} markerEnd="url(#cyc-arr)" />))}
      </g>
      {items.map((label, i) => {
        const s = spots[i];
        const lines = wrapLines(label, 12);
        return (
          <g key={i}>
            <circle cx={s.cx} cy={s.cy} r="13" fill={YELLOW} />
            <text x={s.cx} y={s.cy + 4.5} textAnchor="middle" fill="#2e5d46" fontSize="13" fontWeight="700" fontFamily="inherit">{i + 1}</text>
            <text x={s.lx} y={s.ly} textAnchor="middle" fill={CHALK} fontSize="13" fontFamily="inherit">
              {lines.map((ln, j) => (<tspan key={j} x={s.lx} dy={j === 0 ? 0 : 15}>{ln}</tspan>))}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function ScaleDiagram({ labels }) {
  const left = labels[0] || '';
  const right = labels[1] || '';
  return (
    <svg viewBox="0 0 560 210" className="board-diagram" aria-hidden="true">
      <g fill="none" stroke={CHALK} strokeWidth="3" strokeLinecap="round">
        <line x1="280" y1="18" x2="280" y2="150" />
        <line x1="110" y1="34" x2="450" y2="34" />
        <line x1="150" y1="34" x2="150" y2="66" />
        <line x1="410" y1="34" x2="410" y2="66" />
        <path d="M118 66 A32 32 0 0 0 182 66 Z" />
        <path d="M378 66 A32 32 0 0 0 442 66 Z" />
        <line x1="220" y1="150" x2="340" y2="150" />
      </g>
      <g fill={CHALK} fontSize="15" fontFamily="inherit" textAnchor="middle">
        <text x="150" y="110">{left}</text>
        <text x="410" y="110">{right}</text>
      </g>
    </svg>
  );
}

function NumberLineDiagram({ min = -5, max = 5, points = [] }) {
  const x0 = 40;
  const x1 = 520;
  const xFor = (v) => x0 + ((v - min) / (max - min || 1)) * (x1 - x0);
  const ticks = [];
  for (let v = Math.ceil(min); v <= max; v += 1) ticks.push(v);
  return (
    <svg viewBox="0 0 560 210" className="board-diagram" aria-hidden="true">
      <g stroke={CHALK} strokeWidth="3" strokeLinecap="round">
        <line x1={x0} y1="105" x2={x1} y2="105" />
        {ticks.map((v) => (
          <line key={v} x1={xFor(v)} y1="97" x2={xFor(v)} y2="113" />
        ))}
      </g>
      <g fill={CHALK} fontSize="13" fontFamily="inherit" textAnchor="middle">
        {ticks.map((v) => (<text key={v} x={xFor(v)} y="132">{v}</text>))}
      </g>
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={xFor(p.v)} cy="105" r="8" fill={YELLOW} />
          <text x={xFor(p.v)} y="72" textAnchor="middle" fill={YELLOW} fontSize="15" fontWeight="700" fontFamily="inherit">{p.label}</text>
        </g>
      ))}
    </svg>
  );
}

function FractionBarsDiagram({ bars = [] }) {
  return (
    <svg viewBox="0 0 560 210" className="board-diagram" aria-hidden="true">
      {bars.slice(0, 2).map((bar, bi) => {
        const y = 34 + bi * 88;
        const total = Math.max(1, bar.total || 1);
        const segW = 500 / total;
        return (
          <g key={bi}>
            <text x="20" y={y - 10} fill={CHALK} fontSize="15" fontFamily="inherit">{bar.label}</text>
            {Array.from({ length: total }).map((_, s) => (
              <rect
                key={s}
                x={20 + s * segW}
                y={y}
                width={segW - 3}
                height="40"
                rx="6"
                fill={s < bar.taken ? YELLOW : 'none'}
                stroke={CHALK}
                strokeWidth="2.5"
              />
            ))}
            <text x="20" y={y + 66} fill={CHALK} fontSize="13" fontFamily="inherit" opacity="0.85">
              {bar.taken} of {total} parts
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function TimelineDiagram({ events = [] }) {
  const items = events.slice(0, 4);
  const xFor = (i) => 70 + i * ((560 - 140) / Math.max(1, items.length - 1));
  return (
    <svg viewBox="0 0 560 210" className="board-diagram" aria-hidden="true">
      <line x1="40" y1="105" x2="520" y2="105" stroke={CHALK} strokeWidth="3" strokeLinecap="round" />
      {items.map((ev, i) => {
        const x = xFor(i);
        const lines = wrapLines(ev.label, 11);
        return (
          <g key={i}>
            <circle cx={x} cy="105" r="7" fill={YELLOW} />
            <text x={x} y="80" textAnchor="middle" fill={YELLOW} fontSize="15" fontWeight="700" fontFamily="inherit">{ev.year}</text>
            <text x={x} y="136" textAnchor="middle" fill={CHALK} fontSize="13" fontFamily="inherit">
              {lines.map((ln, j) => (<tspan key={j} x={x} dy={j === 0 ? 0 : 15}>{ln}</tspan>))}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Diagram({ diagram }) {
  if (!diagram) return null;
  switch (diagram.type) {
    case 'flow': return <FlowDiagram labels={diagram.labels || []} />;
    case 'bars': return <BarsDiagram labels={diagram.labels || []} values={diagram.values || []} unit={diagram.unit} />;
    case 'cycle': return <CycleDiagram labels={diagram.labels || []} />;
    case 'scale': return <ScaleDiagram labels={diagram.labels || []} />;
    case 'number-line': return <NumberLineDiagram min={diagram.min} max={diagram.max} points={diagram.points || []} />;
    case 'fraction-bars': return <FractionBarsDiagram bars={diagram.bars || []} />;
    case 'timeline': return <TimelineDiagram events={diagram.events || []} />;
    case 'formula-only': return null;
    default: return null;
  }
}

export default function GreenBoard({ topic, activeLine = 0 }) {
  if (!topic) return null;
  const diagram = topic.diagram || {};
  return (
    <div className="board" key={topic.id} role="img" aria-label={`Green board: ${topic.title}`}>
      <div className="board-inner">
        <div className="board-title">{topic.title}</div>
        {diagram.type === 'formula-only' ? (
          <div className="board-formula">{topic.equation}</div>
        ) : (
          <Diagram diagram={diagram} />
        )}
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
        {diagram.type !== 'formula-only' && topic.equation && <div className="board-eq">{topic.equation}</div>}
      </div>
    </div>
  );
}
