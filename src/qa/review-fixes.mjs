// Checks for the final-review findings (2026-10-15). Each was written to fail first.
// Usage: node src/qa/review-fixes.mjs   (exit code 1 on failure)
import { pathToFileURL } from 'node:url';
import { chromium, repoRoot } from './browsers.mjs';
import { startServer } from './serve.mjs';

// Samples run-log state every animation frame inside the page.
const SAMPLER = () => {
  window.__samples = [];
  const steps = [...document.querySelectorAll('.run__step')];
  const tick = () => {
    window.__samples.push({
      t: performance.now(),
      wait: steps.map((li) => Number(getComputedStyle(li.querySelector('.run__wait')).opacity)),
      done: steps.map((li) => Number(getComputedStyle(li.querySelector('.run__done')).opacity)),
      link: steps.map((li) => { const p = li.querySelector('.run__link path'); return p ? parseFloat(getComputedStyle(p).strokeDashoffset) : 0; }),
      summary: Number(getComputedStyle(document.querySelector('.run__summary')).opacity),
      stepsVisible: getComputedStyle(document.querySelector('.run__steps')).visibility,
    });
    if (window.__samples.length < 600) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

export async function checkReviewFixes(browser, base) {
  const results = [];
  const check = (name, pass, details = '') => results.push({ name, pass: Boolean(pass), details });

  // R0: main.js never arrives (blocked): the phone header offers a "Menü" link to the footer
  // navigation, which lists every section and the legal pages.
  for (const reducedMotion of ['no-preference', 'reduce']) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion });
    await page.route('**/assets/js/main.js', (route) => route.abort());
    await page.goto(base + '/', { waitUntil: 'load' });
    await page.waitForTimeout(500);
    const nav = await page.evaluate(() => {
      const jump = document.querySelector('.site-nav__jump');
      const r = jump?.getBoundingClientRect();
      const target = jump && document.querySelector(jump.getAttribute('href'));
      return {
        jumpVisible: Boolean(r && r.width >= 44 && r.height >= 44),
        footerLinks: target ? [...target.querySelectorAll('a')].map((a) => a.getAttribute('href')) : [],
      };
    });
    const needed = ['#services', '#pricing', '#references', '#about', '#contact', '/impressum/', '/datenschutz/'];
    check(`R0 main.js blocked (${reducedMotion}): "Menü" link reaches a footer nav with all sections`,
      nav.jumpVisible && needed.every((h) => nav.footerLinks.includes(h)), JSON.stringify(nav));
    await page.close();
  }

  // R0b: with main.js, the jump link is replaced by the toggle button without moving anything.
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(base + '/', { waitUntil: 'load' });
    await page.waitForTimeout(300);
    const s = await page.evaluate(() => ({
      jump: getComputedStyle(document.querySelector('.site-nav__jump')).display,
      button: !document.querySelector('.site-nav__toggle').hidden,
    }));
    check('R0b with main.js: toggle button shown, jump link hidden', s.jump === 'none' && s.button, JSON.stringify(s));
    await page.close();
  }

  // R1: reduced motion on a phone: the menu never unfolds on load, the header keeps its height.
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    // A slow phone: main.js arrives 1 s after the first paint.
    await page.route('**/assets/js/main.js', async (route) => { await new Promise((r) => setTimeout(r, 1000)); await route.continue(); });
    await page.addInitScript(() => {
      window.__nav = [];
      const poll = () => {
        const list = document.querySelector('.site-nav__list');
        const header = document.querySelector('.site-header');
        if (list && header) window.__nav.push({ display: getComputedStyle(list).display, h: header.offsetHeight });
        if (window.__nav.length < 120) requestAnimationFrame(poll);
      };
      requestAnimationFrame(poll);
    });
    await page.goto(base + '/', { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    const nav = await page.evaluate(() => window.__nav);
    const unfolded = nav.filter((n) => n.display !== 'none').length;
    const heights = [...new Set(nav.map((n) => n.h))];
    check('R1 reduced motion 390: menu stays collapsed during load', unfolded === 0, `${unfolded} frames unfolded`);
    check('R1 reduced motion 390: header height constant', heights.length === 1, heights.join(','));
    await page.close();
  }

  // R2-R6 (the Stage 2 run log: failsafe, late GSAP, wait below the fold) are replaced by the Stage 4
  // story, which restarts on every entry; see stage4.mjs.

  // R7: small print under the prices stays under 80 characters per line.
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(base + '/', { waitUntil: 'load' });
    const r = await page.$eval('.tariff__notes .small', (el) => {
      const cs = getComputedStyle(el);
      const ctx = document.createElement('canvas').getContext('2d');
      ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const avg = ctx.measureText('abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ').width / 53;
      return Math.round(el.clientWidth / avg);
    });
    check('R7 small print line length <= 80 characters', r <= 80, `${r} characters`);
    await page.close();
  }
  return results;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = await startServer({ root: repoRoot });
  const browser = await chromium.launch();
  const results = await checkReviewFixes(browser, server.url);
  await browser.close();
  await server.close();
  for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.pass ? '' : `  -> ${r.details}`}`);
  process.exit(results.every((r) => r.pass) ? 0 : 1);
}
