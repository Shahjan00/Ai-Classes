// End-to-end check: load the built site in the real Chromium, open the
// Open convo window, ask a question from a chip, wait for the streamed
// answer, screenshot the teacher (center + board states) and the home
// page with the cursor mesh, then check Notes and Quiz still work.
// Screenshots for review land in ~/workspace/jarvis-rebuild/.
const { chromium } = require('playwright-core');
const fs = require('fs');

const SHOTS = '/home/hatch/workspace/jarvis-rebuild';
fs.mkdirSync(SHOTS, { recursive: true });

(async () => {
  const browser = await chromium.launch({
    executablePath: '/home/hatch/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell',
    args: ['--no-sandbox', '--disable-gpu'],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1400 } });
  page.on('console', (m) => console.log('[console]', m.type(), m.text()));
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));

  // Teacher page, center state (nothing asked yet).
  await page.goto('http://127.0.0.1:4173/#/teacher-ai', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${SHOTS}/teacher-center.png` });

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
  const boardVisible = await page.evaluate(() => !!document.querySelector('.board'));
  console.log('board visible:', boardVisible);
  // Close the floating window so the teacher and board are fully visible,
  // then catch her mid-speech: the head should be nodding (speaking state).
  await page.click('text=Close convo');
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${SHOTS}/teacher-speaking.png` });
  await page.screenshot({ path: `${SHOTS}/teacher-board.png` });

  // Realtime board, fresh question with no fixed topic: 'why is the sky
  // blue?' must draw a FLOW diagram from the backend spec, not one of
  // the old fixed diagrams.
  await page.fill('.teacher-ask input', 'why is the sky blue?');
  await page.click('.teacher-ask .send-btn');
  await page.waitForFunction(
    () => document.querySelector('.board-title')?.innerText.includes('WHY THE SKY LOOKS BLUE'),
    undefined,
    { timeout: 15000 },
  );
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${SHOTS}/teacher-board-sky.png` });

  // Realtime board, bar comparison: a second fresh question must draw
  // BARS from the backend spec.
  await page.fill('.teacher-ask input', 'Which planet is bigger, Earth or Jupiter?');
  await page.click('.teacher-ask .send-btn');
  await page.waitForFunction(
    () => document.querySelector('.board-title')?.innerText.includes('BIGGEST PLANETS'),
    undefined,
    { timeout: 15000 },
  );
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${SHOTS}/teacher-board-bars.png` });

  // Mouth frames: force the wide-open mouth and the blink frame via the
  // ?mouth= preview hook and screenshot each, plus a tight face close-up
  // (top 42% of the figure) so any line across the face would show.
  // (Hash-only navigation does not remount, so reload to run the mount
  // hook fresh.) A frame swap must not move the body: the closed,
  // open and blink shots share the same figure position.
  const faceShot = async (path) => {
    const box = await page.locator('.teacher-center-figure').boundingBox();
    await page.screenshot({ path, clip: { x: box.x, y: box.y, width: box.width, height: box.height * 0.42 } });
  };
  await page.goto('http://127.0.0.1:4173/#/teacher-ai?mouth=2', { waitUntil: 'networkidle' });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${SHOTS}/teacher-mouth-open.png` });
  await faceShot(`${SHOTS}/teacher-face-open.png`);
  await page.goto('http://127.0.0.1:4173/#/teacher-ai?mouth=3', { waitUntil: 'networkidle' });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${SHOTS}/teacher-blink.png` });
  await faceShot(`${SHOTS}/teacher-face-blink.png`);
  await page.goto('http://127.0.0.1:4173/#/teacher-ai', { waitUntil: 'networkidle' });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await faceShot(`${SHOTS}/teacher-face-closed.png`);

  // Timer-driven mouth: ?mouth=auto starts the speaking state with the
  // mouth interval running (no real voice needed). Sample data-mouth
  // over ~1.2s; the cycle 0,1,2,1 must show at least 3 distinct values,
  // proving the timer flips frames live while she speaks.
  await page.goto('http://127.0.0.1:4173/#/teacher-ai?mouth=auto', { waitUntil: 'networkidle' });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const mouthSeq = [];
  for (let i = 0; i < 7; i++) {
    mouthSeq.push(await page.evaluate(() => document.querySelector('.teacher-figure')?.dataset.mouth));
    await page.waitForTimeout(180);
  }
  console.log('mouth timer sequence:', mouthSeq.join(','));
  if (new Set(mouthSeq).size < 3) throw new Error('mouth timer did not cycle frames: ' + mouthSeq.join(','));
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
