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

  await browser.close();
  console.log('E2E DONE');
})().catch((e) => { console.error('E2E FAILED:', e.message); process.exit(1); });
