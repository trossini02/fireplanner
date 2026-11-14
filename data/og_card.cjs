// Renders og.png, the 1200x630 social preview card, from the site's own tokens and fonts.
// Usage (needs Playwright with Chromium and network access to Google Fonts):
//   node data/og_card.cjs [out.png]
const path = require('path');
const { chromium } = require('playwright');

const out = process.argv[2] || path.join(__dirname, '..', 'og.png');

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap">
<style>
  html, body { margin: 0; width: 1200px; height: 630px; background: #0f1113; }
  body { box-sizing: border-box; padding: 40px; font-family: "Geist", ui-sans-serif, system-ui, sans-serif; color: #e3e6e9; }
  .frame { box-sizing: border-box; height: 100%; border-radius: 8px; overflow: hidden;
           display: grid; grid-template-rows: auto 1fr auto; gap: 1px; background: #2a2f35; border: 1px solid #2a2f35; }
  .frame > div { background: #16191c; padding: 36px 48px; }
  .top { display: flex; align-items: center; gap: 20px; }
  .top svg { width: 56px; height: 56px; flex: none; }
  .name { font-weight: 600; font-size: 40px; letter-spacing: -0.01em; }
  .mid { display: flex; flex-direction: column; justify-content: center; gap: 22px; }
  .promise { font-weight: 600; font-size: 52px; line-height: 1.12; letter-spacing: -0.02em; max-width: 34ch; margin: 0; text-wrap: balance; }
  .how { font-size: 26px; line-height: 1.4; color: #a1aab3; margin: 0; max-width: 52ch; }
  .foot { display: flex; justify-content: space-between; align-items: center; gap: 24px; white-space: nowrap;
          font-size: 22px; color: #828c96; padding-top: 24px; padding-bottom: 24px; }
</style></head>
<body><div class="frame">
  <div class="top">
    <svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" fill="#0f1113"/><path d="M7 23l6-6 4 3 8-9" fill="none" stroke="#8ab4f8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <span class="name">PAC FIRE Planner</span>
  </div>
  <div class="mid">
    <p class="promise">How much you need to retire early, and how much to invest every month to get there.</p>
    <p class="how">Each answer is computed twice: Monte Carlo, and block Monte Carlo on real market history since 1990.</p>
  </div>
  <div class="foot"><span>Runs in your browser. Nothing is sent anywhere.</span><span>trossini02.github.io/fireplanner</span></div>
</div></body></html>`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const ok = await page.evaluate(() => document.fonts.check('600 40px Geist') && document.fonts.check('400 22px Geist'));
  if (!ok) console.warn('warning: Geist fonts did not load; the card uses fallback fonts');
  await page.screenshot({ path: out, type: 'png' });
  await browser.close();
  console.log('wrote', out);
})();
