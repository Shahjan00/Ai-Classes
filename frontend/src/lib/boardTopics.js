// Board specs — fallback for when the backend cannot be reached.
// The backend (/api/board) is the real source: in live mode Groq draws a
// board for ANY question, in demo mode it serves its own table. These five
// original topics stay here only so the board still works offline.
export const FALLBACK_SPECS = [
  {
    id: 'photosynthesis',
    title: 'Photosynthesis',
    match: ['photosynthesis', 'photo synthesis', 'plant makes food', 'chlorophyll'],
    diagram: { type: 'flow', labels: ['Sunlight in', 'Leaf catches light', 'Glucose made', 'Oxygen out'] },
    equation: '6CO\u2082 + 6H\u2082O + sunlight \u2192 C\u2086H\u2081\u2082O\u2086 + 6O\u2082',
    lines: [
      'Sunlight + water + carbon dioxide go in',
      'Chlorophyll in the leaf catches the sunlight',
      'The plant makes glucose — its food',
      'Oxygen comes out into the air',
    ],
  },
  {
    id: 'newton',
    title: "Newton's First Law",
    match: ['newton', 'first law', 'inertia', 'laws of motion'],
    diagram: { type: 'flow', labels: ['Still ball', 'A push', 'Keeps rolling', 'A force stops it'] },
    equation: 'No force = no change in motion',
    lines: [
      'A still thing stays still',
      'A moving thing keeps moving straight',
      'Only a force can change that',
      'Bus stops suddenly, you lurch forward',
    ],
  },
  {
    id: 'fractions',
    title: 'Fractions',
    match: ['fraction', 'fractions', 'half', 'quarter'],
    diagram: { type: 'fraction-bars', bars: [{ label: '3/4 taken', taken: 3, total: 4 }, { label: '1/4 left', taken: 1, total: 4 }] },
    equation: '1/2 + 1/4 = 2/4 + 1/4 = 3/4',
    lines: [
      'Bottom number = total equal parts',
      'Top number = parts you take',
      '3/4 of a pizza = 3 slices out of 4',
      'Same bottom first, then add the tops',
    ],
  },
  {
    id: 'thunder',
    title: 'Lightning and thunder',
    match: ['lightning', 'thunder', 'why do we see lightning'],
    diagram: { type: 'flow', labels: ['Flash made', 'Light races ahead', 'Sound follows', 'You hear thunder'] },
    equation: 'distance \u2248 seconds \u00d7 343 m',
    lines: [
      'Light: 3,00,000 km every second',
      'Sound: only 343 metres every second',
      'Same moment, light wins the race',
      '3 seconds gap = storm about 1 km away',
    ],
  },
  {
    id: 'algebra',
    title: 'Solving for x',
    match: ['algebra', 'solve for x', 'equation'],
    diagram: { type: 'scale', labels: ['2x + 3', '11'] },
    equation: '2x + 3 = 11  \u2192  x = 4',
    lines: [
      'x is a number we do not know yet',
      'Do the same thing on both sides',
      'Take 3 away: 2x = 8',
      'Divide by 2: x = 4',
    ],
  },
];

// Find a fallback board spec for a question, or null for a text-only answer.
export function matchBoardTopic(question) {
  const q = (question || '').toLowerCase();
  for (const t of FALLBACK_SPECS) {
    if (t.match.some((k) => q.includes(k))) return t;
  }
  return null;
}

// Build a FRESH board from an answer, for ANY question. Used when the
// backend cannot be reached and no canned topic matches, so the board
// still generates instead of showing an old example. Mirrors the
// backend's generic_board_spec: each sentence becomes one flow step
// (its first few words are the box label) and one chalk line.
export function genericBoardSpec(question, answer) {
  const topic = (question || 'this topic').trim().replace(/\?+$/, '') || 'this topic';
  const topicLabel = topic.slice(0, 40);
  const topicLabelCap = topicLabel[0].toUpperCase() + topicLabel.slice(1);
  const fillerLabels = [
    ['here is the simple idea behind', topicLabelCap],
    ['break it into small parts', 'Break it into parts'],
    ['then connect it to', 'Connect to daily life'],
  ];
  const sentences = (answer || '')
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4);
  if (!sentences.length) return null;
  let labels = sentences.map((s) => {
    const low = s.toLowerCase();
    for (const [start, plain] of fillerLabels) {
      if (low.startsWith(start)) return plain;
    }
    return s.split(/\s+/).slice(0, 4).join(' ').replace(/[.,?!]+$/, '') || s.slice(0, 20);
  });
  if (labels.length < 2) {
    const words = sentences[0].split(/\s+/);
    const half = Math.max(1, Math.floor(words.length / 2));
    labels = [words.slice(0, half).join(' '), words.slice(half).join(' ') || '...'];
  }
  let title = (question || 'On the board').trim().replace(/\?+$/, '').slice(0, 50) || 'On the board';
  title = title[0].toUpperCase() + title.slice(1);
  return {
    id: 'live',
    title,
    diagram: { type: 'flow', labels },
    lines: sentences.map((s) => s.slice(0, 80)),
  };
}
