// End-to-end check: load the built site in the real Chromium, open the
// Open convo window, ask a question from a chip, wait for the streamed
// answer, screenshot the teacher (center + board states) and the home
// page with the cursor mesh, then check Notes and Quiz still work.
// Screenshots for review land in ~/workspace/jarvis-rebuild/.
const { chromium } = require('playwright-core');
const fs = require('fs');

const SHOTS = '/home/hatch/workspace/jarvis-rebuild';
fs.mkdirSync(SHOTS, { recursive: true });
fs.mkdirSync('/tmp/jarvis_shots', { recursive: true });

(async () => {
  const browser = await chromium.launch({
    executablePath: '/home/hatch/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell',
    args: ['--no-sandbox', '--disable-gpu'],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1400 } });
  // This sandbox browser has no external network, so serve the CDN
  // assets (teacher model, Pyodide, face-api.js) from local copies
  // that curl verified. On a real browser they load from the CDN.
  const serveLocal = (dir) => async (route) => {
    const name = new URL(route.request().url()).pathname.split('/').pop();
    const path = `${dir}/${name}`;
    if (fs.existsSync(path)) {
      await route.fulfill({ path, contentType: name.endsWith('.wasm') ? 'application/wasm' : undefined });
    } else {
      await route.abort();
    }
  };
  await page.route('**/pyodide@0.26.4/full/*', serveLocal('/tmp/pyodide'));
  await page.route('**/pyodide/v0.26.4/full/*', serveLocal('/tmp/pyodide'));
  await page.route('**/npm/face-api.js@0.22.2/dist/*', serveLocal('/tmp/faceapi'));
  await page.route('**/face-api.js@master/weights/*', serveLocal('/tmp/faceapi/weights'));
  await page.route('**/avatars/brunette.glb', async (route) => {
    await route.fulfill({ path: '/tmp/brunette.glb' });
  });
  page.on('console', (m) => console.log('[console]', m.type(), m.text()));
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));

  // Headless has no voices, so a real utterance errors instantly and
  // speaking ends before any mouth check. Stub speechSynthesis to hold
  // the utterance (a voice that talks but sends no boundary events) so
  // the timer fallback drives the visemes. Plain assignment silently
  // fails (speechSynthesis is getter-only), so defineProperty is used.
  await page.addInitScript(() => {
    const fakeVoice = { name: 'Test Voice', lang: 'en-US', default: true };
    const stub = {
      getVoices: () => [fakeVoice],
      speak: (u) => { window.__heldUtterance = u; },
      cancel: () => {}, pause: () => {}, resume: () => {},
      addEventListener: () => {}, removeEventListener: () => {},
      pending: false, speaking: false, paused: false,
    };
    Object.defineProperty(window, 'speechSynthesis', { value: stub, configurable: true });
  });

  // Teacher page, center state (nothing asked yet).
  await page.goto('http://127.0.0.1:4173/#/teacher-ai', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.waitForFunction(() => window.__classroom && window.__classroom.ready, undefined, { timeout: 20000 });
  await page.screenshot({ path: `${SHOTS}/teacher-center.png` });

  // No rotation, ever: the camera azimuth and her position must not
  // drift on their own. Sample twice, three seconds apart, in idle.
  const poseAt = () => page.evaluate(() => {
    const c = window.__classroom || {};
    return { az: c.cameraAzimuth, x: c.teacherX, turn: c.bodyTurn };
  });
  const pose1 = await poseAt();
  await page.waitForTimeout(3000);
  const pose2 = await poseAt();
  console.log('no-spin pose t0:', JSON.stringify(pose1), 't+3s:', JSON.stringify(pose2));
  if (pose1.az !== pose2.az || pose1.x !== pose2.x || pose1.turn !== pose2.turn) {
    throw new Error('the classroom moved on its own: ' + JSON.stringify([pose1, pose2]));
  }
  // Her arms hang at her sides in idle: the upper arms point down,
  // not out. A hanging arm has a world direction near (0, -1, 0).
  const arms = await page.evaluate(() => window.__classroom && { l: window.__classroom.armLeftDir, r: window.__classroom.armRightDir });
  console.log('idle arm directions:', JSON.stringify(arms));
  if (!arms || !arms.l || !arms.r || arms.l[1] > -0.8 || arms.r[1] > -0.8) {
    throw new Error('arms are not hanging at her sides: ' + JSON.stringify(arms));
  }

  // Open convo floating window and screenshot it.
  await page.click('text=Open convo');
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${SHOTS}/convo-window.png` });

  // Ask the lightning question from a chip inside the window. It matches
  // the thunder board topic, so the green board slides in; the streamed
  // answer lands in the convo log (and as the plain caption).
  await page.click('text=Why do we see lightning before we hear thunder?');
  await page.waitForFunction(
    () => {
      const log = document.querySelector('.convo-log');
      return log && log.innerText.includes('Light travels');
    },
    undefined,
    { timeout: 25000 },
  );
  await page.waitForTimeout(2500);
  const chatText = await page.evaluate(() => document.querySelector('.convo-log').innerText);
  console.log('--- CONVO LOG ---\n' + chatText);
  // The board is a canvas texture inside the 3D classroom now (no DOM
  // SVG): check the live classroom state instead.
  const boardState = await page.evaluate(() => window.__classroom || null);
  console.log('classroom board state:', JSON.stringify(boardState && { mode: boardState.mode, id: boardState.boardId, type: boardState.boardType, labels: boardState.boardLabels }));
  if (!boardState || boardState.mode !== 'board') throw new Error('teacher did not step to the board');
  // Close the floating window so the teacher and board are fully visible,
  // then catch her mid-speech: the head should be nodding (speaking state).
  await page.click('text=Close convo');
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${SHOTS}/teacher-speaking.png` });
  await page.screenshot({ path: `${SHOTS}/teacher-board.png` });

  // The board is a diagram only (no title element): check the canvas
  // board labels in the live classroom state instead. 'why is the sky
  // blue?' must draw a FLOW diagram from the backend spec, not one of
  // the old fixed diagrams.
  await page.fill('.teacher-ask input', 'why is the sky blue?');
  await page.click('.teacher-ask .send-btn');
  await page.waitForFunction(
    () => (window.__classroom?.boardLabels || []).join(' ').includes('Blue scatters'),
    undefined,
    { timeout: 15000 },
  );
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${SHOTS}/teacher-board-sky.png` });

  // Realtime board, bar comparison: a second fresh question must draw
  // BARS from the backend spec (planet size labels on the diagram).
  await page.fill('.teacher-ask input', 'Which planet is bigger, Earth or Jupiter?');
  await page.click('.teacher-ask .send-btn');
  await page.waitForFunction(
    () => (window.__classroom?.boardLabels || []).join(' ').includes('Jupiter'),
    undefined,
    { timeout: 15000 },
  );
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${SHOTS}/teacher-board-bars.png` });

  // Lip-sync: the Ready Player Me teacher moves her mouth with visemes
  // while she speaks (live state on window.__teacherTalk). Fresh load
  // for an idle face close-up first, then ask and sample the visemes
  // live while she speaks. The stubbed voice holds the utterance, so
  // the timer fallback drives the mouth even with no boundary events.
  // The face close-up crops the top of the classroom canvas, where her
  // head is in center mode.
  const faceShot = async (path) => {
    const box = await page.locator('.classroom-canvas').boundingBox();
    await page.screenshot({
      path,
      clip: {
        x: box.x + box.width * 0.32, y: box.y + box.height * 0.02,
        width: box.width * 0.36, height: box.height * 0.5,
      },
    });
  };
  await page.goto('http://127.0.0.1:4173/#/teacher-ai', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await faceShot(`${SHOTS}/teacher-face-idle.png`);
  await page.fill('.teacher-ask input', 'Why is the sky blue?');
  await page.click('.teacher-ask .send-btn');
  await page.waitForFunction(
    () => document.querySelector('.stage-status')?.innerText.includes('Speaking'),
    undefined,
    { timeout: 15000 },
  );
  const visemes = [];
  let maxWeight = 0;
  for (let i = 0; i < 20; i++) {
    const t = await page.evaluate(() => window.__teacherTalk || null);
    if (t) {
      if (t.viseme && t.viseme !== 'viseme_sil') visemes.push(t.viseme);
      if (t.weight) maxWeight = Math.max(maxWeight, t.weight);
    }
    await page.waitForTimeout(150);
  }
  const distinct = [...new Set(visemes)];
  console.log('lip-sync visemes:', distinct.join(','), '| max weight:', maxWeight.toFixed(2));
  if (distinct.length < 3) throw new Error('lip-sync did not move the mouth: ' + distinct.join(','));
  if (maxWeight < 0.3) throw new Error('lip-sync weights too weak: ' + maxWeight.toFixed(2));
  await faceShot(`${SHOTS}/teacher-face-speaking.png`);
  await page.screenshot({ path: `${SHOTS}/teacher-mouth-live.png` });

  // Save this chat from the floating window, then confirm it lands on
  // the student dashboard (via Demo login).
  await page.click('text=Open convo');
  await page.waitForTimeout(800);
  await page.click('text=Save chat');
  await page.waitForFunction(() => document.body.innerText.includes('✓ Saved'), undefined, { timeout: 5000 });
  console.log('save flash: ✓ Saved');

  // Demo login, then the saved chat must show on the dashboard.
  await page.goto('http://127.0.0.1:4173/#/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.click('text=Demo login');
  await page.waitForFunction(
    () => document.body.innerText.includes('WELCOME BACK, DEMO STUDENT'),
    undefined,
    { timeout: 10000 },
  );
  await page.waitForFunction(
    () => document.body.innerText.includes('Why do we see lightning before we hear thunder?'),
    undefined,
    { timeout: 10000 },
  );
  console.log('saved chat on dashboard: YES');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SHOTS}/dashboard-saved-chat.png` });

  // Home hero with the cursor mesh: move the mouse over the hero so the
  // cursor-linked dots light up, then screenshot.
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.mouse.move(760, 320);
  await page.waitForTimeout(600);
  await page.mouse.move(820, 360);
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${SHOTS}/home-cursor.png` });

  // Notes page: generate notes end to end.
  await page.goto('http://127.0.0.1:4173/#/notes-maker', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.click('text=Generate notes →');
  await page.waitForFunction(
    () => document.body.innerText.includes('Photosynthesis'),
    undefined,
    { timeout: 20000 },
  );
  await page.waitForTimeout(1000);
  const notes = await page.evaluate(() => document.body.innerText.slice(0, 600));
  console.log('--- NOTES ---\n' + notes);
  await page.screenshot({ path: '/tmp/jarvis_shots/notes.png' });

  // Quiz: answer first question.
  await page.goto('http://127.0.0.1:4173/#/quiz', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.click('.quiz-opt >> nth=0');
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/jarvis_shots/quiz.png' });

  // ---- Batch checks: Notes rename + Books on Notes page + books flow ----
  await page.goto('http://127.0.0.1:4173/#/notes-maker', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const notesMakerCount = await page.locator('text=Notes Maker').count();
  console.log('"Notes Maker" mentions left:', notesMakerCount);
  if (notesMakerCount > 0) throw new Error('"Notes Maker" still appears somewhere');
  const booksHeading = await page.locator('text=NCERT books, chapter by chapter').count();
  if (!booksHeading) throw new Error('Books section missing from the Notes page');
  // The /notes alias route must show the same page.
  await page.goto('http://127.0.0.1:4173/#/notes', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  if (!(await page.locator('text=Chapter notes in minutes').count())) throw new Error('/notes alias does not show the Notes page');
  // Books flow: Class 10 -> Science -> chapter page.
  await page.click('.ncert-tab >> text=Class 10');
  await page.waitForTimeout(500);
  await page.locator('.ncert-subject-card h3:text-is("Science")').click();
  await page.waitForFunction(() => location.hash.includes('/books/10/Science'), undefined, { timeout: 10000 });
  await page.waitForTimeout(800);
  const ch2 = await page.locator('text=Acids, Bases and Salts').count();
  if (!ch2) throw new Error('Class 10 Science chapter page missing Ch 2');
  // Chapter 1 PDF link must be the real NCERT URL, not a broken one.
  const ch1Href = await page.locator('a:has-text("Open PDF on ncert.nic.in")').first().getAttribute('href');
  console.log('Ch1 PDF href:', ch1Href);
  if (ch1Href !== 'https://ncert.nic.in/ncerts/l/jesc101.pdf') throw new Error('wrong Ch1 PDF URL: ' + ch1Href);
  // In-app reader for the bundled Ch 2.
  await page.locator('text=Read in app').first().click();
  await page.waitForSelector('iframe.ncert-iframe', { timeout: 10000 });
  console.log('in-app Ch2 reader: open');
  await page.screenshot({ path: `${SHOTS}/books-chapter-page.png` });
  // Back to Notes, Books section still there.
  await page.click('text=Back to Notes');
  await page.waitForFunction(() => location.hash.includes('/notes-maker'), undefined, { timeout: 10000 });

  // ---- Batch checks: Coding Lab classes 6-12, progression ----
  await page.goto('http://127.0.0.1:4173/#/coding-lab', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  for (const c of [6, 7, 8, 9, 10, 11, 12]) {
    if (!(await page.locator(`.chip >> text=Class ${c}`).count())) throw new Error('missing Class ' + c + ' tab');
  }
  if (!(await page.locator('text=Class 6: 0 of 8 lessons done').count())) throw new Error('Class 6 progress line wrong');
  await page.click('.chip >> text=Class 12');
  await page.waitForTimeout(500);
  if (!(await page.locator('text=Class 12: 0 of 8 lessons done').count())) throw new Error('Class 12 progress line wrong');
  if (!(await page.locator('text=1. Bubble sort').count())) throw new Error('Class 12 lesson 1 missing');
  await page.click('.chip >> text=Class 6');
  await page.waitForTimeout(500);
  // Run the first lesson (py1) through real Pyodide and expect a pass
  // plus auto-advance to lesson 2.
  await page.click('text=Run + check test');
  await page.waitForFunction(
    () => document.body.innerText.includes('1/1 tests passed'),
    undefined,
    { timeout: 90000 },
  );
  console.log('coding py1: PASS');
  await page.waitForFunction(
    () => document.body.innerText.includes('Print your name'),
    undefined,
    { timeout: 10000 },
  );
  console.log('coding auto-advance to lesson 2: YES');
  await page.screenshot({ path: `${SHOTS}/coding-lab.png` });

  // ---- Batch checks: Face ID panel on the Teacher page ----
  await page.goto('http://127.0.0.1:4173/#/teacher-ai', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  if (!(await page.locator('text=Face ID').count())) throw new Error('Face ID panel missing from Teacher page');
  if (!(await page.locator('text=Register my face').count())) throw new Error('Face ID register button missing');
  if (!(await page.locator('text=Your face never leaves this device').count())) throw new Error('Face ID privacy note missing');
  console.log('face ID panel: present');
  await page.screenshot({ path: `${SHOTS}/teacher-faceid.png` });

  await browser.close();
  console.log('E2E DONE');
})().catch((e) => { console.error('E2E FAILED:', e.message); process.exit(1); });
