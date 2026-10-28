// Browser checks for the fixes of 21.10.2026 (docs/PROMPT_Fixes_2026-10-21.md, A1-A5).
// Each one failed on the live site before the fix.
// Usage: node src/qa/fixes.mjs [--base https://mrlololi.com]   (exit code 1 on failure)
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium, repoRoot, qaDir } from './browsers.mjs';
import { startServer } from './serve.mjs';
import { warm } from './warm.mjs';

const SHORT = ['/impressum/', '/datenschutz/', '/en/legal-notice/', '/en/privacy/', '/404.html'];

export async function checkFixes(browser, base) {
  const results = [];
  const check = (name, pass, details = '') => results.push({ name, pass: Boolean(pass), details });
  const open = async (p, viewport, opts = {}) => {
    const page = await browser.newPage({ viewport, reducedMotion: 'no-preference', ...opts });
    await page.goto(base + p, { waitUntil: 'load' });
    return page;
  };

  // A4: the dark footer ends at the bottom of the page, also when the page is shorter than the window.
  const shots = path.join(qaDir, 'shots', 'fixes');
  await mkdir(shots, { recursive: true });
  for (const height of [1000, 2000]) {
    const bad = [];
    for (const p of SHORT) {
      const page = await open(p, { width: 1440, height });
      const r = await page.evaluate(() => {
        const f = document.querySelector('.site-footer').getBoundingClientRect();
        return { bottom: Math.round(f.bottom + scrollY), doc: document.documentElement.scrollHeight, vh: innerHeight };
      });
      if (height === 1000) await page.screenshot({ path: path.join(shots, `footer-${p.replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'home'}-1440x1000.png`), fullPage: true });
      if (Math.abs(r.bottom - r.doc) > 1 || r.doc < r.vh) bad.push(`${p}: footer ends at ${r.bottom}, page ${r.doc}, window ${r.vh}`);
      await page.close();
    }
    check(`short pages: footer ends at the bottom (1440x${height})`, !bad.length, bad.join('\n'));
  }

  // A4: DE and EN footers follow the same layout rule (row or stacked); the brief asks for 1280 and 390.
  for (const width of [1440, 1280, 1024, 390]) {
    const layouts = {};
    for (const p of ['/', '/en/', '/impressum/', '/en/legal-notice/']) {
      const page = await open(p, { width, height: 900 });
      layouts[p] = await page.evaluate(() => {
        const copy = document.querySelector('.site-footer__copy').getBoundingClientRect();
        const nav = document.querySelector('#footer-nav').getBoundingClientRect();
        return { stacked: nav.top >= copy.bottom - 1, copyLines: Math.round(copy.height / parseFloat(getComputedStyle(document.querySelector('.site-footer__copy')).lineHeight || '24')) };
      });
      await page.close();
    }
    const same = (a, b) => layouts[a].stacked === layouts[b].stacked;
    check(`footer: DE and EN share the layout at ${width} px`, same('/', '/en/') && same('/impressum/', '/en/legal-notice/') && same('/', '/impressum/'), JSON.stringify(layouts));
  }

  // A1 is in overflow.mjs. A2: typing while the count-up runs keeps the reader's numbers.
  {
    const page = await open('/', { width: 1280, height: 900 });
    await page.waitForFunction(() => window.gsap && window.ScrollTrigger, null, { timeout: 8000 });
    await page.waitForTimeout(300);
    const before = await page.$eval('[data-out="savedEur"]', (el) => el.textContent);
    await page.evaluate(() => document.getElementById('ki-rechner').scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(250);
    const during = await page.$eval('[data-out="savedEur"]', (el) => el.textContent);
    await page.fill('#calc-emails', '200');
    await page.waitForTimeout(1800);
    const r = await page.evaluate(async () => {
      const { calcSavings, formatResult } = await import('/assets/js/calc.js');
      const form = document.getElementById('ki-rechner');
      const v = (n) => Number(form.elements[n].value);
      const f = formatResult(calcSavings({ emailsPerWeek: v('emails'), minutesPerReply: v('minutes'), sharePercent: v('share'), hourlyRate: v('rate') }), form.dataset.locale || 'de-AT');
      const shown = ['h', 'savedH', 'savedEur'].map((k) => form.querySelector(`[data-out="${k}"]`).textContent);
      return { want: [f.h, f.savedH, f.savedEur], shown, live: document.getElementById('calc-live').textContent };
    });
    check('calculator: typing during the count-up keeps the typed numbers', before !== during && r.want.join() === r.shown.join() && r.live.includes(r.want[2]),
      `count-up running: ${before !== during} (${before} -> ${during}); want ${r.want.join(' | ')}; shown ${r.shown.join(' | ')}; live "${r.live}"`);
    await page.close();
  }

  // A5: loop-button tooltips stay inside the window at 360 px.
  for (const p of ['/', '/en/']) {
    const page = await open(p, { width: 360, height: 800 });
    await page.waitForSelector('.loop-btn:not([hidden])', { timeout: 8000 });
    // The tooltip's place does not depend on hover, so every shown button is measured as it sits.
    const tips = await page.evaluate(() => [...document.querySelectorAll('.loop-btn:not([hidden])')]
      .filter((el) => el.checkVisibility())
      .map((el) => { const t = el.querySelector('.loop-btn__tip').getBoundingClientRect(); return { l: Math.round(t.left), r: Math.round(t.right), in: el.parentElement.className }; }));
    const vw = await page.evaluate(() => document.documentElement.clientWidth);
    const bad = tips.filter((t) => t.l < 0 || t.r > vw).map((t) => `${t.in}: tooltip ${t.l}..${t.r}, window ${vw}`);
    check(`loop tooltips inside the window at 360 px (${p}, ${tips.length} buttons)`, tips.length >= 3 && !bad.length, bad.join('\n'));
    await page.close();
  }

  // A5: turning on reduced motion while the page is open stops the loops and hides their buttons.
  {
    const page = await open('/', { width: 1280, height: 900 });
    await page.evaluate(() => document.querySelector('.marquee').scrollIntoView({ block: 'center' }));
    await page.waitForSelector('.marquee.is-running', { timeout: 8000 }).catch(() => {});
    const on = await page.evaluate(() => document.querySelector('.marquee').classList.contains('is-running'));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(200);
    const off = await page.evaluate(() => ({ running: document.querySelector('.marquee').classList.contains('is-running'), hidden: document.querySelector('.tools .loop-btn').hidden }));
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForTimeout(300);
    // GSAP's matchMedia rebuild scrolls to the top when motion comes back (known, also live before these fixes).
    await page.evaluate(() => document.querySelector('.marquee').scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(300);
    const back = await page.evaluate(() => document.querySelector('.marquee').classList.contains('is-running'));
    check('reduced motion switched on later: loops stop, buttons hide, and come back', on && !off.running && off.hidden && back, JSON.stringify({ on, off, back }));
    await page.close();
  }

  // A5: tone tabs know Home and End; the before/after range speaks «Vorher 51 %».
  for (const [p, want] of [['/', 'Vorher 51 %'], ['/en/', 'Before 51 %']]) {
    const page = await open(p, { width: 1280, height: 900 });
    await warm(page);
    await page.focus('.tone__tab');
    await page.keyboard.press('End');
    const end = await page.evaluate(() => { const t = [...document.querySelectorAll('.tone__tab')]; return t.at(-1).getAttribute('aria-selected') === 'true' && document.activeElement === t.at(-1); });
    await page.keyboard.press('Home');
    const home = await page.evaluate(() => { const t = [...document.querySelectorAll('.tone__tab')]; return t[0].getAttribute('aria-selected') === 'true' && document.activeElement === t[0]; });
    await page.focus('.ba__range');
    await page.waitForTimeout(1500); // focusing scrolls into the pinned wipe; let it settle
    await page.$eval('.ba__range', (r) => { r.value = '50'; r.dispatchEvent(new Event('input')); });
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(100);
    const text = await page.$eval('.ba__range', (el) => el.getAttribute('aria-valuetext'));
    check(`tone tabs Home/End and range value text (${p})`, end && home && text === want, JSON.stringify({ end, home, text }));
    await page.close();
  }
  return results;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const i = process.argv.indexOf('--base');
  const server = i > 0 ? null : await startServer({ root: repoRoot });
  const base = i > 0 ? process.argv[i + 1] : server.url;
  const browser = await chromium.launch();
  const results = await checkFixes(browser, base);
  await browser.close();
  await server?.close();
  for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.pass ? '' : `\n      ${r.details.replace(/\n/g, '\n      ')}`}`);
  process.exit(results.every((r) => r.pass) ? 0 : 1);
}
