// Board topics — the questions the teacher explains on the green board
// instead of just talking. Each topic has chalk lines (explained one by
// one, top to bottom) and a small diagram drawn on the board.
export const BOARD_TOPICS = [
  {
    id: 'photosynthesis',
    title: 'Photosynthesis',
    match: ['photosynthesis', 'photo synthesis', 'plant makes food', 'chlorophyll'],
    diagram: 'photosynthesis',
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
    diagram: 'newton',
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
    diagram: 'fractions',
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
    diagram: 'thunder',
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
    diagram: 'algebra',
    equation: '2x + 3 = 11  \u2192  x = 4',
    lines: [
      'x is a number we do not know yet',
      'Do the same thing on both sides',
      'Take 3 away: 2x = 8',
      'Divide by 2: x = 4',
    ],
  },
];

// Find the board topic for a question, or null for a text-only answer.
export function matchBoardTopic(question) {
  const q = (question || '').toLowerCase();
  for (const t of BOARD_TOPICS) {
    if (t.match.some((k) => q.includes(k))) return t;
  }
  return null;
}
