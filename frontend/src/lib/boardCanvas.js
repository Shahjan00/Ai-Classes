// Board canvas: draws the green chalkboard face for the 3D classroom.
// The board is a diagram ONLY, never a transcript: one chalk diagram
// (flow, bars, cycle, scale, number line, fraction bars, timeline) or a
// single formula, plus a short title. The drawing mirrors GreenBoard.jsx
// (the old 2D board) so every board spec the backend produces still
// works, just rendered onto a canvas texture instead of SVG.
// With no topic the board shows a welcome: JARVISH, ask anything.
export const BOARD_W = 1408;
export const BOARD_H = 720;

const CHALK = '#f5f5e8';
const YELLOW = '#ffd94d';
const GREEN_TOP = '#35714f';
const GREEN_BOTTOM = '#2a5240';

// Wrap text to lines that fit maxWidth, at most two lines.
function wrapLines(ctx, text, maxWidth, maxLines = 2) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(next).width > maxWidth && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = next;
    }
    if (lines.length === maxLines) break;
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  return lines;
}

function drawTextLines(ctx, lines, cx, cy, lineHeight) {
  const startY = cy - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((ln, i) => {
    ctx.fillText(ln, cx, startY + i * lineHeight);
  });
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function arrow(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const size = 18;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - size * Math.cos(angle - 0.42), y2 - size * Math.sin(angle - 0.42));
  ctx.lineTo(x2 - size * Math.cos(angle + 0.42), y2 - size * Math.sin(angle + 0.42));
  ctx.closePath();
  ctx.fill();
}

function flowDiagram(ctx, labels) {
  const items = labels.slice(0, 4);
  const n = items.length;
  const gap = 56;
  const margin = 64;
  const w = (BOARD_W - margin * 2 - gap * (n - 1)) / n;
  const h = 170;
  const y = 300;
  const cy = y + h / 2;
  ctx.strokeStyle = CHALK;
  ctx.lineWidth = 4;
  ctx.fillStyle = CHALK;
  ctx.font = '600 34px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  items.forEach((label, i) => {
    const x = margin + i * (w + gap);
    roundedRect(ctx, x, y, w, h, 18);
    ctx.stroke();
    const lines = wrapLines(ctx, label, w - 28);
    drawTextLines(ctx, lines, x + w / 2, cy, 44);
    if (i < n - 1) arrow(ctx, x + w + 8, cy, x + w + gap - 8, cy);
  });
}

function barsDiagram(ctx, labels, values, unit) {
  const items = labels.slice(0, 4);
  const max = Math.max(...(values || [1]), 1);
  ctx.textBaseline = 'middle';
  items.forEach((label, i) => {
    const v = values[i] || 0;
    const bw = Math.max(16, (v / max) * 760);
    const y = 170 + i * 130;
    ctx.fillStyle = CHALK;
    ctx.font = '600 36px Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(label, 380, y + 29);
    ctx.fillStyle = YELLOW;
    roundedRect(ctx, 410, y, bw, 58, 10);
    ctx.fill();
    ctx.fillStyle = CHALK;
    ctx.font = '600 32px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(String(v.toLocaleString('en-IN')), 410 + bw + 18, y + 29);
  });
  if (unit) {
    ctx.fillStyle = CHALK;
    ctx.font = '400 28px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(unit, 410, 668);
  }
}

function cycleDiagram(ctx, labels) {
  const items = labels.slice(0, 4);
  const cx = BOARD_W / 2;
  const cy = 410;
  const rx = 420;
  const ry = 165;
  const spots = [
    { a: -Math.PI / 2, lx: cx, ly: cy - ry - 78 },
    { a: 0, lx: cx + rx + 118, ly: cy },
    { a: Math.PI / 2, lx: cx, ly: cy + ry + 88 },
    { a: Math.PI, lx: cx - rx - 118, ly: cy },
  ];
  ctx.strokeStyle = CHALK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Arrowheads along the ellipse, so the cycle reads as a loop.
  ctx.fillStyle = CHALK;
  [-Math.PI / 4, Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4].forEach((a) => {
    const px = cx + rx * Math.cos(a);
    const py = cy + ry * Math.sin(a);
    const tx = -rx * Math.sin(a);
    const ty = ry * Math.cos(a);
    const ang = Math.atan2(ty, tx);
    const size = 20;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px - size * Math.cos(ang - 0.42), py - size * Math.sin(ang - 0.42));
    ctx.lineTo(px - size * Math.cos(ang + 0.42), py - size * Math.sin(ang + 0.42));
    ctx.closePath();
    ctx.fill();
  });
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  items.forEach((label, i) => {
    const s = spots[i];
    const px = cx + rx * Math.cos(s.a);
    const py = cy + ry * Math.sin(s.a);
    ctx.fillStyle = YELLOW;
    ctx.beginPath();
    ctx.arc(px, py, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2e5d46';
    ctx.font = '700 30px Arial, sans-serif';
    ctx.fillText(String(i + 1), px, py + 1);
    ctx.fillStyle = CHALK;
    ctx.font = '600 30px Arial, sans-serif';
    const lines = wrapLines(ctx, label, 240);
    drawTextLines(ctx, lines, s.lx, s.ly, 38);
  });
}

function scaleDiagram(ctx, labels) {
  const left = labels[0] || '';
  const right = labels[1] || '';
  const cx = BOARD_W / 2;
  ctx.strokeStyle = CHALK;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, 170);
  ctx.lineTo(cx, 520);
  ctx.moveTo(cx - 330, 200);
  ctx.lineTo(cx + 330, 200);
  ctx.moveTo(cx - 300, 200);
  ctx.lineTo(cx - 300, 260);
  ctx.moveTo(cx + 300, 200);
  ctx.lineTo(cx + 300, 260);
  ctx.moveTo(cx - 380, 260);
  ctx.lineTo(cx - 220, 260);
  ctx.moveTo(cx + 220, 260);
  ctx.lineTo(cx + 380, 260);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx - 300, 260, 80, 0, Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + 300, 260, 80, 0, Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 140, 520);
  ctx.lineTo(cx + 140, 520);
  ctx.stroke();
  ctx.fillStyle = CHALK;
  ctx.font = '600 36px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(left, cx - 300, 420);
  ctx.fillText(right, cx + 300, 420);
}

function numberLineDiagram(ctx, min = -5, max = 5, points = []) {
  const x0 = 120;
  const x1 = BOARD_W - 120;
  const y = 400;
  const xFor = (v) => x0 + ((v - min) / (max - min || 1)) * (x1 - x0);
  ctx.strokeStyle = CHALK;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x1, y);
  ctx.stroke();
  ctx.fillStyle = CHALK;
  ctx.font = '600 30px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let v = Math.ceil(min); v <= max; v += 1) {
    ctx.beginPath();
    ctx.moveTo(xFor(v), y - 14);
    ctx.lineTo(xFor(v), y + 14);
    ctx.stroke();
    ctx.fillText(String(v), xFor(v), y + 52);
  }
  (points || []).forEach((p) => {
    ctx.fillStyle = YELLOW;
    ctx.beginPath();
    ctx.arc(xFor(p.v), y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = YELLOW;
    ctx.font = '700 34px Arial, sans-serif';
    ctx.fillText(p.label || '', xFor(p.v), y - 56);
  });
}

function fractionBarsDiagram(ctx, bars = []) {
  bars.slice(0, 2).forEach((bar, bi) => {
    const y = 210 + bi * 240;
    const total = Math.max(1, bar.total || 1);
    const segW = 1100 / total;
    ctx.fillStyle = CHALK;
    ctx.font = '600 36px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(bar.label || '', 154, y - 44);
    for (let s = 0; s < total; s += 1) {
      const x = 154 + s * segW;
      if (s < bar.taken) {
        ctx.fillStyle = YELLOW;
        roundedRect(ctx, x, y, segW - 6, 84, 10);
        ctx.fill();
      } else {
        ctx.strokeStyle = CHALK;
        ctx.lineWidth = 4;
        roundedRect(ctx, x, y, segW - 6, 84, 10);
        ctx.stroke();
      }
    }
    ctx.fillStyle = CHALK;
    ctx.font = '400 30px Arial, sans-serif';
    ctx.fillText(`${bar.taken} of ${total} parts`, 154, y + 130);
  });
}

function timelineDiagram(ctx, events = []) {
  const items = events.slice(0, 4);
  const y = 400;
  const xFor = (i) => 200 + i * ((BOARD_W - 400) / Math.max(1, items.length - 1));
  ctx.strokeStyle = CHALK;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(120, y);
  ctx.lineTo(BOARD_W - 120, y);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  items.forEach((ev, i) => {
    const x = xFor(i);
    ctx.fillStyle = YELLOW;
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = YELLOW;
    ctx.font = '700 38px Arial, sans-serif';
    ctx.fillText(ev.year || '', x, y - 62);
    ctx.fillStyle = CHALK;
    ctx.font = '600 30px Arial, sans-serif';
    const lines = wrapLines(ctx, ev.label || '', 240);
    drawTextLines(ctx, lines, x, y + 78, 38);
  });
}

function drawDiagram(ctx, diagram) {
  if (!diagram) return;
  switch (diagram.type) {
    case 'flow': flowDiagram(ctx, diagram.labels || []); break;
    case 'bars': barsDiagram(ctx, diagram.labels || [], diagram.values || [], diagram.unit); break;
    case 'cycle': cycleDiagram(ctx, diagram.labels || []); break;
    case 'scale': scaleDiagram(ctx, diagram.labels || []); break;
    case 'number-line': numberLineDiagram(ctx, diagram.min, diagram.max, diagram.points || []); break;
    case 'fraction-bars': fractionBarsDiagram(ctx, diagram.bars || []); break;
    case 'timeline': timelineDiagram(ctx, diagram.events || []); break;
    default: break;
  }
}

// Draw the whole board face onto ctx (a 1408x720 canvas context).
// topic is a board spec ({ title, diagram, equation }) or null for welcome.
export function drawBoard(ctx, topic) {
  // Green chalkboard with a soft top light and faint chalk dust.
  const grad = ctx.createLinearGradient(0, 0, 0, BOARD_H);
  grad.addColorStop(0, GREEN_TOP);
  grad.addColorStop(1, GREEN_BOTTOM);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, BOARD_W, BOARD_H);
  ctx.fillStyle = 'rgba(245, 245, 232, 0.03)';
  [
    [300, 180, 260, 60], [1050, 140, 300, 70], [700, 620, 340, 60],
    [150, 560, 220, 55], [1200, 560, 180, 50],
  ].forEach(([x, y, w, h]) => {
    ctx.beginPath();
    ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  if (!topic) {
    ctx.fillStyle = CHALK;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 120px Arial, sans-serif';
    ctx.fillText('JARVISH', BOARD_W / 2, 300);
    ctx.font = '600 46px Arial, sans-serif';
    ctx.fillText('Ask me anything, Class 1 to 12', BOARD_W / 2, 430);
    ctx.strokeStyle = YELLOW;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(BOARD_W / 2 - 180, 500);
    ctx.lineTo(BOARD_W / 2 + 180, 500);
    ctx.stroke();
    return;
  }

  // Short title at the top, diagram below.
  if (topic.title) {
    ctx.fillStyle = CHALK;
    ctx.font = '700 48px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const titleLines = wrapLines(ctx, topic.title, BOARD_W - 160, 1);
    ctx.fillText(titleLines[0] || '', BOARD_W / 2, 74);
  }
  const diagram = topic.diagram || {};
  if (diagram.type === 'formula-only') {
    ctx.fillStyle = YELLOW;
    ctx.font = '900 76px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lines = wrapLines(ctx, topic.equation || '', BOARD_W - 160, 2);
    drawTextLines(ctx, lines, BOARD_W / 2, 400, 96);
    return;
  }
  drawDiagram(ctx, diagram);
}
