// NCERT textbooks, Classes 9 to 12, English medium.
// Official source: ncert.nic.in. Book list cross-checked against the official
// textbook page (textbook.php) and chapter titles against official chapter PDFs.
// Chapter PDFs live at https://ncert.nic.in/textbook/pdf/{code}{NN}.pdf.
// The old https://ncert.nic.in/ncerts/l/ path is DEAD: it returns a blank page
// with just the word ERROR (verified live in a browser, 16 Nov 2026), so every
// book uses the textbook/pdf/ path now.
//
// verified: 'archive' means a Wayback capture confirmed the exact official URL
// returned HTTP 200 on ncert.nic.in. 'linked' means a third-party page links
// the exact official URL and checked it live. 'pattern' means the URL follows
// the official pattern but no capture was found yet, so check it live before
// trusting it. bundled: true means the PDF is packed inside the app as base64
// and opens in the in-app reader with no fetch at runtime.

const L = 'https://ncert.nic.in/textbook/pdf/';
const T = 'https://ncert.nic.in/textbook/pdf/';

// chapters: [displayNo, fileNo, title, verified?, note?]
// fileNo is the number in the PDF filename; displayNo is the chapter number
// printed in the book. They differ for Part II books and sectioned readers.
function book(code, title, chapters, opts = {}) {
  const base = opts.base || L;
  const list = chapters.map(([n, file, chTitle, verified = 'archive', note]) => {
    const ch = {
      n,
      file,
      title: chTitle,
      url: `${base}${code}${file}.pdf`,
      verified,
    };
    if (note) ch.note = note;
    if (opts.bundledFile === file) {
      ch.bundled = true;
      ch.pages = opts.bundledPages;
    }
    return ch;
  });
  return {
    code,
    title,
    edition: opts.edition || null,
    note: opts.note || null,
    chapters: list,
    bookUrl: `https://ncert.nic.in/textbook.php?${code}=0-${list.length}`,
  };
}

export const NCERT_CLASSES = [
  {
    cls: 9,
    subjects: [
      {
        name: 'Science',
        books: [
          book('iesc1', 'Exploration', [
            [1, '01', 'Exploration: Entering the World of Secondary Science'],
            [2, '02', 'Cell: The Building Block of Life'],
            [3, '03', 'Tissues in Action'],
            [4, '04', 'Describing Motion Around Us'],
            [5, '05', 'Exploring Mixtures and Their Separation'],
            [6, '06', 'How Forces Affect Motion'],
            [7, '07', 'Work, Energy, and Simple Machines'],
            [8, '08', 'Journey Inside the Atom'],
            [9, '09', 'Atomic Foundations of Matter'],
            [10, '10', 'Sound Waves: Characteristics and Applications'],
            [11, '11', 'Reproduction: How Life Continues'],
            [12, '12', 'Patterns in Life: Diversity and Classification'],
            [13, '13', 'Earth as a System: Energy, Matter, and Life'],
          ], { edition: 'New 2026-27 edition (NCF-SE 2023)' }),
        ],
      },
      {
        name: 'Mathematics',
        books: [
          book('iemh1', 'Ganita Manjari Part I', [
            [1, '01', 'Orienting Yourself: The Use of Coordinates'],
            [2, '02', 'Introduction to Linear Polynomials'],
            [3, '03', 'The World of Numbers'],
            [4, '04', 'Exploring Algebraic Identities'],
            [5, '05', "I'm Up and Down, and Round and Round"],
            [6, '06', 'Measuring Space: Perimeter and Area'],
            [7, '07', 'The Mathematics of Maybe: Introduction to Probability'],
            [8, '08', 'Predicting What Comes Next: Exploring Sequences and Progressions'],
          ], { edition: 'New 2026-27 edition (NCF-SE 2023)' }),
          book('iemh2', 'Ganita Manjari Part II', [
            [9, '01', 'Propositions and their Converses', 'pattern'],
            [10, '02', 'How Quantities Combine: Understanding Data', 'linked'],
            [11, '03', 'The World of Algorithms', 'pattern'],
            [12, '04', 'Quadrilaterals', 'pattern'],
            [13, '05', 'Two Variables, One Line', 'linked'],
            [14, '06', 'Math of Space: Surface Area and Volume', 'linked'],
          ], { base: T, edition: 'New 2026-27 edition (NCF-SE 2023)', note: 'Chapters are numbered 9 to 14, continuing Part I.' }),
        ],
      },
      {
        name: 'English',
        books: [
          book('iebe1', 'Kaveri', [
            [1, '01', 'How I Taught My Grandmother to Read'],
            [2, '02', 'The Pot Maker'],
            [3, '03', 'Winds of Change'],
            [4, '04', 'Vitamin-M'],
            [5, '05', 'The World of Limitless Possibilities'],
            [6, '06', 'Twin Melodies'],
            [7, '07', 'Carrier of Words'],
            [8, '08', 'Follow'],
          ], { edition: 'New 2026-27 edition (NCF-SE 2023)' }),
          book('iemo1', 'Moments (Supplementary Reader)', [
            [1, '01', 'The Lost Child'],
            [2, '02', 'The Adventures of Toto'],
            [3, '03', 'Iswaran the Storyteller'],
            [4, '04', 'In the Kingdom of Fools'],
            [5, '05', 'The Happy Prince'],
            [6, '06', 'Weathering the Storm in Ersama'],
            [7, '07', 'The Last Leaf'],
            [8, '08', 'A House Is Not a Home'],
            [9, '09', 'The Beggar'],
          ]),
          book('iewe1', 'Words and Expressions 1 (Workbook)', [
            [1, '01', 'Unit 1: Science Fiction'],
            [2, '02', 'Unit 2: Music'],
            [3, '03', 'Unit 3: The Little Girl'],
            [4, '04', 'Unit 4: Great Personalities'],
            [5, '05', 'Unit 5: Snakes'],
            [6, '06', 'Unit 6: Presidents of India'],
            [7, '07', 'Unit 7: Packing'],
            [8, '08', 'Unit 8: Santosh Yadav'],
            [9, '09', 'Unit 9: Animals'],
          ], { base: T }),
        ],
      },
      {
        name: 'Social Science',
        books: [
          book('iest1', 'Understanding Society: India and Beyond Part I', [
            [1, '01', 'Understanding Social Science', 'pattern'],
            [2, '02', 'Shaping of the Earth\u2019s Surface'],
            [3, '03', 'Atmosphere and Climate', 'pattern'],
            [4, '04', 'Early Humans and Beginning of Civilisation', 'pattern'],
            [5, '05', 'State and Society up to 1000 CE', 'pattern'],
            [6, '06', 'Democracy'],
            [7, '07', 'Elections', 'pattern'],
            [8, '08', 'Building Blocks in Economics: The Problem of Choice', 'pattern'],
            [9, '09', 'The Price Puzzle: What Drives the Market', 'pattern'],
          ], { base: T, edition: 'New 2026-27 edition (NCF-SE 2023)' }),
          book('iest2', 'Understanding Society: India and Beyond Part II', [
            [1, '01', 'Oceans and Life', 'pattern'],
            [2, '02', 'Life on Earth', 'pattern'],
            [3, '03', 'Resistance and Resilience (1000-1700 CE)', 'pattern'],
            [4, '04', 'Governance and Public Policy', 'pattern'],
            [5, '05', 'Managing Your Personal Finances', 'pattern'],
            [6, '06', 'From Ideas to Startups', 'pattern'],
          ], { base: T, edition: 'New 2026-27 edition (NCF-SE 2023)' }),
          book('iess1', 'Contemporary India I', [
            [1, '01', 'India: Size and Location'],
            [2, '02', 'Physical Features of India'],
            [3, '03', 'Drainage'],
            [4, '04', 'Climate'],
            [5, '05', 'Natural Vegetation and Wildlife'],
            [6, '06', 'Population'],
          ], { edition: 'Earlier edition, still listed on ncert.nic.in' }),
          book('iess2', 'Economics', [
            [1, '01', 'The Story of Village Palampur'],
            [2, '02', 'People as Resource'],
            [3, '03', 'Poverty as a Challenge'],
            [4, '04', 'Food Security in India'],
          ], { edition: 'Earlier edition, still listed on ncert.nic.in' }),
          book('iess3', 'India and the Contemporary World I', [
            [1, '01', 'The French Revolution'],
            [2, '02', 'Socialism in Europe and the Russian Revolution'],
            [3, '03', 'Nazism and the Rise of Hitler'],
            [4, '04', 'Forest Society and Colonialism'],
            [5, '05', 'Pastoralists in the Modern World'],
          ], { edition: 'Earlier edition, still listed on ncert.nic.in' }),
        ],
      },
    ],
  },
  {
    cls: 10,
    subjects: [
      {
        name: 'Science',
        books: [
          book('jesc1', 'Science', [
            [1, '01', 'Chemical Reactions and Equations'],
            [2, '02', 'Acids, Bases and Salts'],
            [3, '03', 'Metals and Non-metals'],
            [4, '04', 'Carbon and its Compounds'],
            [5, '05', 'Life Processes'],
            [6, '06', 'Control and Coordination'],
            [7, '07', 'How do Organisms Reproduce?'],
            [8, '08', 'Heredity'],
            [9, '09', 'Light: Reflection and Refraction'],
            [10, '10', 'The Human Eye and the Colourful World'],
            [11, '11', 'Electricity'],
            [12, '12', 'Magnetic Effects of Electric Current'],
            [13, '13', 'Our Environment'],
          ], { bundledFile: '02', bundledPages: 20 }),
        ],
      },
      {
        name: 'Mathematics',
        books: [
          book('jemh1', 'Mathematics', [
            [1, '01', 'Real Numbers'],
            [2, '02', 'Polynomials'],
            [3, '03', 'Pair of Linear Equations in Two Variables'],
            [4, '04', 'Quadratic Equations'],
            [5, '05', 'Arithmetic Progressions'],
            [6, '06', 'Triangles'],
            [7, '07', 'Coordinate Geometry'],
            [8, '08', 'Introduction to Trigonometry'],
            [9, '09', 'Some Applications of Trigonometry'],
            [10, '10', 'Circles'],
            [11, '11', 'Areas Related to Circles'],
            [12, '12', 'Surface Areas and Volumes'],
            [13, '13', 'Statistics'],
            [14, '14', 'Probability'],
          ]),
        ],
      },
      {
        name: 'Social Science',
        books: [
          book('jess1', 'Contemporary India II', [
            [1, '01', 'Resources and Development'],
            [2, '02', 'Forest and Wildlife Resources'],
            [3, '03', 'Water Resources'],
            [4, '04', 'Agriculture'],
            [5, '05', 'Minerals and Energy Resources'],
            [6, '06', 'Manufacturing Industries'],
            [7, '07', 'Lifelines of National Economy'],
          ]),
          book('jess2', 'Understanding Economic Development', [
            [1, '01', 'Development'],
            [2, '02', 'Sectors of the Indian Economy'],
            [3, '03', 'Money and Credit'],
            [4, '04', 'Globalisation and the Indian Economy'],
            [5, '05', 'Consumer Rights'],
          ]),
          book('jess3', 'India and the Contemporary World II', [
            [1, '01', 'The Rise of Nationalism in Europe'],
            [2, '02', 'Nationalism in India'],
            [3, '03', 'The Making of a Global World'],
            [4, '04', 'The Age of Industrialisation'],
            [5, '05', 'Print Culture and the Modern World'],
          ]),
          book('jess4', 'Democratic Politics II', [
            [1, '01', 'Power-sharing'],
            [2, '02', 'Federalism'],
            [3, '03', 'Gender, Religion and Caste'],
            [4, '04', 'Political Parties'],
            [5, '05', 'Outcomes of Democracy'],
          ]),
        ],
      },
      {
        name: 'English',
        books: [
          book('jeff1', 'First Flight', [
            [1, '01', 'A Letter to God'],
            [2, '02', 'Nelson Mandela: Long Walk to Freedom'],
            [3, '03', 'Two Stories About Flying'],
            [4, '04', 'From the Diary of Anne Frank'],
            [5, '05', 'Glimpses of India'],
            [6, '06', 'Mijbil the Otter'],
            [7, '07', 'Madam Rides the Bus'],
            [8, '08', 'The Sermon at Benares'],
            [9, '09', 'The Proposal'],
          ], { note: 'Poems are printed inside the prose units.' }),
          book('jefp1', 'Footprints Without Feet (Supplementary Reader)', [
            [1, '01', 'A Triumph of Surgery'],
            [2, '02', 'The Thief\u2019s Story'],
            [3, '03', 'The Midnight Visitor'],
            [4, '04', 'A Question of Trust'],
            [5, '05', 'Footprints Without Feet'],
            [6, '06', 'The Making of a Scientist'],
            [7, '07', 'The Necklace'],
            [8, '08', 'Bholi'],
            [9, '09', 'The Book That Saved the Earth'],
          ]),
          book('jewe2', 'Words and Expressions 2 (Workbook)', [
            [1, '01', 'Unit 1: A Letter to God'],
            [2, '02', 'Unit 2: Nelson Mandela: Long Walk to Freedom'],
            [3, '03', 'Unit 3: Two Stories About Flying'],
            [4, '04', 'Unit 4: From the Diary of Anne Frank'],
            [5, '05', 'Unit 5: Glimpses of India'],
            [6, '06', 'Unit 6: Mijbil the Otter'],
            [7, '07', 'Unit 7: Madam Rides the Bus'],
            [8, '08', 'Unit 8: The Sermon at Benares'],
            [9, '09', 'Unit 9: The Proposal'],
          ], { base: T, note: 'Workbook units follow First Flight, chapter by chapter.' }),
        ],
      },
    ],
  },
  {
    cls: 11,
    subjects: [
      {
        name: 'Physics',
        books: [
          book('keph1', 'Physics Part I', [
            [1, '01', 'Units and Measurement'],
            [2, '02', 'Motion in a Straight Line'],
            [3, '03', 'Motion in a Plane'],
            [4, '04', 'Laws of Motion'],
            [5, '05', 'Work, Energy and Power'],
            [6, '06', 'System of Particles and Rotational Motion'],
            [7, '07', 'Gravitation'],
          ]),
          book('keph2', 'Physics Part II', [
            [8, '01', 'Mechanical Properties of Solids'],
            [9, '02', 'Mechanical Properties of Fluids'],
            [10, '03', 'Thermal Properties of Matter'],
            [11, '04', 'Thermodynamics'],
            [12, '05', 'Kinetic Theory'],
            [13, '06', 'Oscillations'],
            [14, '07', 'Waves'],
          ], { note: 'Chapters are numbered 8 to 14, continuing Part I.' }),
        ],
      },
      {
        name: 'Chemistry',
        books: [
          book('kech1', 'Chemistry Part I', [
            [1, '01', 'Some Basic Concepts of Chemistry'],
            [2, '02', 'Structure of Atom'],
            [3, '03', 'Classification of Elements and Periodicity in Properties'],
            [4, '04', 'Chemical Bonding and Molecular Structure'],
            [5, '05', 'Thermodynamics'],
            [6, '06', 'Equilibrium'],
          ]),
          book('kech2', 'Chemistry Part II', [
            [7, '01', 'Redox Reactions'],
            [8, '02', 'Organic Chemistry: Some Basic Principles and Techniques'],
            [9, '03', 'Hydrocarbons'],
          ], { note: 'Chapters are numbered 7 to 9, continuing Part I.' }),
        ],
      },
      {
        name: 'Mathematics',
        books: [
          book('kemh1', 'Mathematics', [
            [1, '01', 'Sets'],
            [2, '02', 'Relations and Functions'],
            [3, '03', 'Trigonometric Functions'],
            [4, '04', 'Complex Numbers and Quadratic Equations'],
            [5, '05', 'Linear Inequalities'],
            [6, '06', 'Permutations and Combinations'],
            [7, '07', 'Binomial Theorem'],
            [8, '08', 'Sequences and Series'],
            [9, '09', 'Straight Lines'],
            [10, '10', 'Conic Sections'],
            [11, '11', 'Introduction to Three Dimensional Geometry'],
            [12, '12', 'Limits and Derivatives'],
            [13, '13', 'Statistics'],
            [14, '14', 'Probability'],
          ]),
        ],
      },
      {
        name: 'Biology',
        books: [
          book('kebo1', 'Biology', [
            [1, '01', 'The Living World'],
            [2, '02', 'Biological Classification'],
            [3, '03', 'Plant Kingdom'],
            [4, '04', 'Animal Kingdom'],
            [5, '05', 'Morphology of Flowering Plants'],
            [6, '06', 'Anatomy of Flowering Plants'],
            [7, '07', 'Structural Organisation in Animals'],
            [8, '08', 'Cell: The Unit of Life'],
            [9, '09', 'Biomolecules'],
            [10, '10', 'Cell Cycle and Cell Division'],
            [11, '11', 'Photosynthesis in Higher Plants'],
            [12, '12', 'Respiration in Plants'],
            [13, '13', 'Plant Growth and Development'],
            [14, '14', 'Breathing and Exchange of Gases'],
            [15, '15', 'Body Fluids and Circulation'],
            [16, '16', 'Excretory Products and Their Elimination'],
            [17, '17', 'Locomotion and Movement'],
            [18, '18', 'Neural Control and Coordination'],
            [19, '19', 'Chemical Coordination and Integration'],
          ]),
        ],
      },
      {
        name: 'English',
        books: [
          book('kehb1', 'Hornbill', [
            [1, '01', 'The Portrait of a Lady', 'archive', 'Poem: A Photograph'],
            [2, '02', 'We\u2019re Not Afraid to Die... if We Can All Be Together'],
            [3, '03', 'Discovering Tut: the Saga Continues', 'archive', 'Poem: The Laburnum Top'],
            [4, '04', 'Landscape of the Soul', 'archive', 'Poem: The Voice of the Rain'],
            [5, '05', 'The Ailing Planet: the Green Movement\u2019s Role'],
            [6, '06', 'The Browning Version', 'archive', 'Poem: Childhood'],
            [7, '07', 'The Adventure'],
            [8, '08', 'Silk Road', 'archive', 'Poem: Father to Son'],
            [9, '09', 'Note-making', 'pattern'],
            [10, '10', 'Summarising', 'pattern'],
            [11, '11', 'Sub-titling'],
            [12, '12', 'Essay-writing'],
            [13, '13', 'Letter-writing'],
            [14, '14', 'Creative Writing'],
          ], { note: 'Poems are printed inside the prose PDFs. Writing skills chapters are numbered 9 to 14.' }),
          book('kesp1', 'Snapshots (Supplementary Reader)', [
            [1, '01', 'The Summer of the Beautiful White Horse'],
            [2, '02', 'The Address'],
            [3, '03', 'Mother\u2019s Day'],
            [4, '04', 'Birth'],
            [5, '05', 'The Tale of Melon City'],
          ]),
          book('keww1', 'Woven Words', [
            [1, '01', 'The Lament'],
            [2, '02', 'A Pair of Mustachios'],
            [3, '03', 'The Rocking-horse Winner'],
            [4, '04', 'The Adventure of the Three Garridebs'],
            [5, '05', 'Pappachi\u2019s Moth'],
            [6, '06', 'The Third and Final Continent'],
            [7, '07', 'Glory at Twilight'],
            [8, '08', 'The Luncheon'],
            [9, '11', 'Poetry: Introduction'],
            [10, '12', 'Let Me Not to the Marriage of True Minds'],
            [11, '13', 'Coming'],
            [12, '14', 'Telephone Conversation'],
            [13, '15', 'The World is too Much With Us'],
            [14, '16', 'Mother Tongue'],
            [15, '17', 'Hawk Roosting'],
            [16, '18', 'For Elkana'],
            [17, '19', 'Refugee Blues'],
            [18, '20', 'Felling of the Banyan Tree'],
            [19, '21', 'Ode to a Nightingale'],
            [20, '22', 'Ajamil and the Tigers'],
            [21, '31', 'Essays: Introduction'],
            [22, '32', 'My Three Passions'],
            [23, '33', 'Patterns of Creativity'],
            [24, '34', 'Tribal Verse'],
            [25, '35', 'What is a Good Book?'],
            [26, '36', 'The Story'],
            [27, '37', 'Bridges'],
          ], { base: T, note: 'Three sections: short stories, poetry, essays.' }),
        ],
      },
    ],
  },
  {
    cls: 12,
    subjects: [
      {
        name: 'Physics',
        books: [
          book('leph1', 'Physics Part I', [
            [1, '01', 'Electric Charges and Fields'],
            [2, '02', 'Electrostatic Potential and Capacitance'],
            [3, '03', 'Current Electricity'],
            [4, '04', 'Moving Charges and Magnetism'],
            [5, '05', 'Magnetism and Matter'],
            [6, '06', 'Electromagnetic Induction'],
            [7, '07', 'Alternating Current'],
            [8, '08', 'Electromagnetic Waves'],
          ]),
          book('leph2', 'Physics Part II', [
            [9, '01', 'Ray Optics and Optical Instruments'],
            [10, '02', 'Wave Optics'],
            [11, '03', 'Dual Nature of Radiation and Matter'],
            [12, '04', 'Atoms'],
            [13, '05', 'Nuclei'],
            [14, '06', 'Semiconductor Electronics: Materials, Devices and Simple Circuits'],
          ], { note: 'Chapters are numbered 9 to 14, continuing Part I.' }),
        ],
      },
      {
        name: 'Chemistry',
        books: [
          book('lech1', 'Chemistry Part I', [
            [1, '01', 'Solutions'],
            [2, '02', 'Electrochemistry'],
            [3, '03', 'Chemical Kinetics'],
            [4, '04', 'The d- and f-Block Elements'],
            [5, '05', 'Coordination Compounds'],
          ]),
          book('lech2', 'Chemistry Part II', [
            [6, '01', 'Haloalkanes and Haloarenes'],
            [7, '02', 'Alcohols, Phenols and Ethers'],
            [8, '03', 'Aldehydes, Ketones and Carboxylic Acids'],
            [9, '04', 'Amines'],
            [10, '05', 'Biomolecules'],
          ], { note: 'Chapters are numbered 6 to 10, continuing Part I.' }),
        ],
      },
      {
        name: 'Mathematics',
        books: [
          book('lemh1', 'Mathematics Part I', [
            [1, '01', 'Relations and Functions'],
            [2, '02', 'Inverse Trigonometric Functions'],
            [3, '03', 'Matrices'],
            [4, '04', 'Determinants'],
            [5, '05', 'Continuity and Differentiability'],
            [6, '06', 'Application of Derivatives'],
          ]),
          book('lemh2', 'Mathematics Part II', [
            [7, '01', 'Integrals'],
            [8, '02', 'Application of Integrals'],
            [9, '03', 'Differential Equations'],
            [10, '04', 'Vector Algebra'],
            [11, '05', 'Three Dimensional Geometry'],
            [12, '06', 'Linear Programming'],
            [13, '07', 'Probability'],
          ], { note: 'Chapters are numbered 7 to 13, continuing Part I.' }),
        ],
      },
      {
        name: 'Biology',
        books: [
          book('lebo1', 'Biology', [
            [1, '01', 'Sexual Reproduction in Flowering Plants'],
            [2, '02', 'Human Reproduction'],
            [3, '03', 'Reproductive Health'],
            [4, '04', 'Principles of Inheritance and Variation'],
            [5, '05', 'Molecular Basis of Inheritance'],
            [6, '06', 'Evolution'],
            [7, '07', 'Human Health and Disease'],
            [8, '08', 'Microbes in Human Welfare'],
            [9, '09', 'Biotechnology: Principles and Processes'],
            [10, '10', 'Biotechnology and its Applications'],
            [11, '11', 'Organisms and Populations'],
            [12, '12', 'Ecosystem'],
            [13, '13', 'Biodiversity and Conservation'],
          ]),
        ],
      },
      {
        name: 'English',
        books: [
          book('lefl1', 'Flamingo', [
            [1, '01', 'The Last Lesson'],
            [2, '02', 'Lost Spring'],
            [3, '03', 'Deep Water'],
            [4, '04', 'The Rattrap'],
            [5, '05', 'Indigo'],
            [6, '06', 'Poets and Pancakes'],
            [7, '07', 'The Interview'],
            [8, '08', 'Going Places'],
            [9, '11', 'My Mother at Sixty-six'],
            [10, '13', 'Keeping Quiet'],
            [11, '14', 'A Thing of Beauty'],
            [12, '15', 'A Roadside Stand'],
            [13, '16', 'Aunt Jennifer\u2019s Tigers'],
          ], { base: T, note: 'Prose chapters 1 to 8, poems 9 to 13.' }),
          book('levt1', 'Vistas (Supplementary Reader)', [
            [1, '01', 'The Third Level'],
            [2, '02', 'The Tiger King'],
            [3, '03', 'Journey to the End of the Earth'],
            [4, '04', 'The Enemy'],
            [5, '05', 'On the Face of It'],
            [6, '06', 'Memories of Childhood'],
          ]),
          book('lekl1', 'Kaleidoscope', [
            [1, '01', 'I Sell My Dreams'],
            [2, '02', 'Eveline'],
            [3, '03', 'A Wedding in Brownsville'],
            [4, '04', 'Tomorrow'],
            [5, '05', 'One Centimetre'],
            [6, '11', 'Poetry: Introduction'],
            [7, '12', 'Poems by Milton'],
            [8, '13', 'Poems by Blake'],
            [9, '14', 'Kubla Khan (A Vision in a Dream: A Fragment)'],
            [10, '15', 'Trees'],
            [11, '16', 'The Wild Swans at Coole'],
            [12, '17', 'Time and Time Again'],
            [13, '18', 'Blood'],
            [14, '21', 'Freedom'],
            [15, '22', 'The Mark on the Wall'],
            [16, '23', 'Film-making'],
            [17, '24', 'Why the Novel Matters'],
            [18, '25', 'The Argumentative Indian'],
            [19, '26', 'On Science Fiction'],
            [20, '31', 'Chandalika'],
            [21, '32', 'Broken Images'],
          ], { base: T, note: 'Four sections: short stories, poetry, non-fiction, drama.' }),
        ],
      },
    ],
  },
];

// Flat list of every book, with its class and subject attached.
export const NCERT_BOOKS = NCERT_CLASSES.flatMap((c) =>
  c.subjects.flatMap((s) => s.books.map((b) => ({ ...b, cls: c.cls, subject: s.name }))),
);

export const NCERT_TOTAL_BOOKS = NCERT_BOOKS.length;
export const NCERT_TOTAL_CHAPTERS = NCERT_BOOKS.reduce((sum, b) => sum + b.chapters.length, 0);

export function findBook(code) {
  return NCERT_BOOKS.find((b) => b.code === code) || null;
}

// The question the AI Teacher gets asked when a chapter's "Learn on board"
// button is tapped. Teacher.jsx already handles ?q= on /teacher-ai.
export function chapterQuestion(cls, subject, chapter) {
  return `Teach me Class ${cls} ${subject} Chapter ${chapter.n}: ${chapter.title}`;
}

