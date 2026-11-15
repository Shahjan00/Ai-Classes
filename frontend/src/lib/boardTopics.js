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
  {
    id: 'embeddings',
    title: 'What Are Embeddings',
    match: ['embed', 'vector'],
    diagram: { type: 'flow', labels: ['Word', 'Vector numbers', 'Similar = close', 'AI understands'] },
    lines: [
      'A word becomes a list of numbers',
      'The numbers are the word\u2019s vector',
      'Similar words get similar numbers',
      'AI reads the numbers, not the letters',
    ],
  },
  {
    id: 'neural-net',
    title: 'A Neural Network',
    match: ['neural', 'neuron'],
    diagram: { type: 'flow', labels: ['Input', 'Hidden layers', 'Learns patterns', 'Output'] },
    lines: [
      'Numbers go in',
      'Hidden layers find patterns',
      'It learns from examples',
      'An answer comes out',
    ],
  },
  {
    id: 'mitochondria',
    title: 'Mitochondria',
    match: ['mitochondria', 'powerhouse of the cell'],
    diagram: { type: 'flow', labels: ['Food + oxygen in', 'Glucose is broken', 'ATP energy made', 'Powers the cell'] },
    equation: 'C\u2086H\u2081\u2082O\u2086 + 6O\u2082 \u2192 6CO\u2082 + 6H\u2082O + energy',
    lines: [
      "Mitochondria is the powerhouse of the cell",
      'It burns glucose using oxygen',
      "That makes ATP, the cell's energy",
      'Every part of the cell runs on ATP',
    ],
  },
  {
    id: 'optical-fibre',
    title: 'How Optical Fibre Works',
    match: ['optical fibre', 'optical fiber', 'fibre optics', 'fiber optics', 'total internal reflection'],
    diagram: { type: 'flow', labels: ['Light enters fibre', 'Bounces inside', 'Total reflection', 'Comes out the end'] },
    equation: 'Light stays inside by total internal reflection',
    lines: [
      'A fibre is a thin strand of glass',
      'Light enters one end of the core',
      'It bounces along inside, never escaping',
      'It comes out the other end, carrying data',
    ],
  },
  {
    id: 'cell-parts',
    title: 'Parts of a Cell',
    match: ['parts of a cell', 'plant cell', 'animal cell', 'nucleus', 'cell membrane'],
    diagram: { type: 'flow', labels: ['Cell membrane', 'Cytoplasm', 'Nucleus controls', 'Mitochondria powers'] },
    equation: 'Nucleus = control centre',
    lines: [
      'Membrane holds the cell together',
      'Cytoplasm is the jelly inside',
      'Nucleus is the brain, it controls all',
      'Mitochondria makes the energy',
    ],
  },
  {
    id: 'digestive-system',
    title: 'The Digestive System',
    match: ['digestive system', 'digestion', 'how do we digest'],
    diagram: { type: 'flow', labels: ['Mouth chews', 'Stomach churns', 'Small intestine absorbs', 'Waste leaves'] },
    equation: 'Food \u2192 nutrients + energy',
    lines: [
      'Teeth chew food into small bits',
      'Stomach acid and churning break it more',
      'Small intestine absorbs the nutrients',
      'Leftover waste leaves the body',
    ],
  },
  {
    id: 'respiration',
    title: 'Respiration',
    match: ['respiration', 'breathing', 'lungs', 'how do we breathe'],
    diagram: { type: 'flow', labels: ['Air in nose', 'Lungs take oxygen', 'Blood carries it', 'Cells use it'] },
    equation: 'Glucose + oxygen \u2192 energy',
    lines: [
      'We breathe air in through the nose',
      'Lungs take oxygen from the air',
      'Blood carries oxygen to every cell',
      'Cells burn glucose with oxygen for energy',
    ],
  },
  {
    id: 'reflection',
    title: 'Reflection of Light',
    match: ['reflection', 'mirror', 'angle of incidence', 'how does a mirror work'],
    diagram: { type: 'flow', labels: ['Light hits mirror', 'Angle in = angle out', 'Image forms', 'Left-right flips'] },
    equation: 'Angle in = angle out',
    lines: [
      'Light travels straight until it hits a mirror',
      'It bounces back at the same angle',
      'Your image forms behind the mirror',
      'Left and right swap in the mirror',
    ],
  },
  {
    id: 'sound',
    title: 'How Sound Travels',
    match: ['sound', 'how do we hear', 'vibration'],
    diagram: { type: 'flow', labels: ['Vibration starts', 'Waves travel in air', 'Ear catches waves', 'Brain hears sound'] },
    equation: 'Sound needs a medium',
    lines: [
      'Sound starts with something vibrating',
      'Vibrations travel as waves through air',
      'Your eardrum catches the waves',
      'Your brain turns them into sound',
    ],
  },
  {
    id: 'electric-circuit',
    title: 'An Electric Circuit',
    match: ['electric circuit', 'electricity', 'ohm', 'voltage'],
    diagram: { type: 'flow', labels: ['Battery pushes', 'Current flows', 'Bulb glows', 'Switch controls'] },
    equation: 'V = I \u00d7 R',
    lines: [
      'Battery is the push, called voltage',
      'Current is electrons flowing in the wire',
      'The bulb glows when current passes',
      'Switch opens or closes the path',
    ],
  },
  {
    id: 'food-chain',
    title: 'A Food Chain',
    match: ['food chain', 'food web'],
    diagram: { type: 'flow', labels: ['Plants make food', 'Herbivores eat plants', 'Carnivores eat them', 'Decomposers recycle'] },
    equation: 'Sunlight \u2192 plants \u2192 animals',
    lines: [
      'Plants make food from sunlight',
      'Herbivores like deer eat the plants',
      'Carnivores like lions eat herbivores',
      'Decomposers recycle everything back to soil',
    ],
  },
  {
    id: 'friction',
    title: 'Friction',
    match: ['friction'],
    diagram: { type: 'flow', labels: ['Push or pull', 'Friction opposes', 'Smooth = less', 'Rough = more'] },
    equation: 'Friction opposes motion',
    lines: [
      'Friction opposes motion',
      'Smooth surfaces have less friction',
      'Rough surfaces have more friction',
      'Oil reduces friction in machines',
    ],
  },
  {
    id: 'acids-bases-salts',
    title: 'Acids, Bases and Salts',
    match: [
      'class 10th chemistry chapter 2',
      'class 10 chemistry chapter 2',
      '10th chemistry chapter 2',
      'chemistry chapter 2',
      'acids, bases and salts',
      'acids bases and salts',
      'acid base',
      'acids and bases',
      'ph scale',
      'baking soda',
      'washing soda',
      'bleaching powder',
      'plaster of paris',
      'common salt',
    ],
    diagram: { type: 'flow', labels: ['2.1 Acids + bases react', '2.2 H+ and OH- in water', '2.3 pH scale 0 to 14', '2.4 Salts we use daily'] },
    equation: 'HCl + NaOH \u2192 NaCl + H2O (neutralisation)',
    lines: [
      'Acids react with metals, carbonates and bases. Zn + H2SO4 gives ZnSO4 + H2.',
      'All acids make H+ ions in water. All bases make OH- ions. HCl + NaOH gives NaCl + H2O.',
      'pH runs 0 to 14. Below 7 is acidic, 7 is neutral, above 7 is basic. Stomach acid sits near pH 2, toothpaste is basic and protects teeth.',
      'Common salt NaCl, baking soda NaHCO3, washing soda Na2CO3, bleaching powder CaOCl2, plaster of Paris CaSO4.1/2H2O.',
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
