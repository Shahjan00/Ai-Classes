// End-to-end check: load the built site in the real Chromium, click a
// preset chip on the AI Teacher page, wait for the streamed answer,
// screenshot the result and dump the chat text.
const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/home/hatch/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell',
    args: ['--no-sandbox', '--disable-gpu'],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1400 } });
  page.on('console', (m) => console.log('[console]', m.type(), m.text()));
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));

  await page.goto('http://127.0.0.1:4173/#/teacher-ai', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/jarvis_shots/teacher2.png' });

  // Click the lightning chip and wait for the streamed answer to finish.
  await page.click('text=Why do we see lightning before we hear thunder?');
  await page.waitForFunction(
    () => {
      const log = document.querySelector('.chat-log');
      return log && log.innerText.includes('Light travels');
    },
    { timeout: 20000 },
  );
  await page.waitForTimeout(2500);
  const text = await page.evaluate(() => document.querySelector('.chat-log').innerText);
  console.log('--- CHAT LOG ---\n' + text);
  await page.screenshot({ path: '/tmp/jarvis_shots/teacher_chat.png' });

  // Home hero screenshot.
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/jarvis_shots/home2.png' });

  // Notes page: generate notes end to end.
  await page.goto('http://127.0.0.1:4173/#/notes-maker', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.click('text=Generate notes →');
  await page.waitForFunction(
    () => document.body.innerText.includes('Photosynthesis'),
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
