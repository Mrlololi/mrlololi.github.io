// Captures the top of https://alexandrafry.ch (1440x900) as the source image for case 1.
// Cookie banners are hidden with injected CSS, never clicked (no consent is given).
// Usage: node src/tools/capture-case.mjs [--probe | --long]
//   --long (Stage 4): 1440 x 2400 from the top, for the screenshot that scrolls inside the browser frame.
//   --probe: also writes a raw screenshot and lists fixed/sticky overlays to qa/ for inspection.
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium, repoRoot, qaDir } from '../qa/browsers.mjs';

const URL = 'https://alexandrafry.ch';
const probe = process.argv.includes('--probe');
// Selectors found with --probe; keep in sync if the site changes its banner.
const long = process.argv.includes('--long');
const HIDE = process.env.HIDE_SELECTORS || (long ? '.cky-consent-container, .cky-modal, .cky-overlay, .cky-btn-revisit-wrapper, #toTop' : '');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, locale: 'de-CH' });
await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(2500);

if (probe) {
  await mkdir(qaDir, { recursive: true });
  await page.screenshot({ path: path.join(qaDir, 'case-probe.png') });
  const overlays = await page.evaluate(() =>
    [...document.querySelectorAll('body *')]
      .filter((el) => ['fixed', 'sticky'].includes(getComputedStyle(el).position) && el.getBoundingClientRect().height > 30)
      .map((el) => ({ tag: el.tagName, id: el.id, cls: String(el.className).slice(0, 80), text: el.innerText.slice(0, 80).replace(/\s+/g, ' ') }))
  );
  console.log(JSON.stringify(overlays, null, 1));
} else {
  if (HIDE) await page.addStyleTag({ content: `${HIDE} { display: none !important; }` });
  // Scroll through first, so elements that fade in on scroll are there in the long shot.
  if (long) for (let y = 0; y < 2600; y += 300) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(250); }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);
  const out = path.join(repoRoot, long ? 'src/images/case-alexandrafry-long.png' : 'src/images/case-alexandrafry.png');
  await mkdir(path.dirname(out), { recursive: true });
  await page.screenshot({ path: out, fullPage: long, clip: { x: 0, y: 0, width: 1440, height: long ? 2400 : 900 } });
  console.log(out);
}
await browser.close();
