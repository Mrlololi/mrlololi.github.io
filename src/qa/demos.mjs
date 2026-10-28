// Behaviour checks for the Stage 2 demos that stay (ribbon, marquee, before/after range, 6 vs 1, flow
// nodes, slow fonts, reduced motion, no JS). The Stage 4 demos are checked in stage4.mjs.
// Usage: node src/qa/demos.mjs   (exit code 1 on failure; screenshots in qa/shots/demos)
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium, repoRoot, qaDir } from './browsers.mjs';
import { startServer } from './serve.mjs';

const shots = path.join(qaDir, 'shots', 'demos');
const ribbonOffset = (page) => page.$eval('.ribbon textPath', (tp) => tp.startOffset.animVal.value);
const marqueeX = (page) => page.$eval('.marquee__track', (el) => new DOMMatrix(getComputedStyle(el).transform).m41);

export async function checkDemos(browser, base) {
  await mkdir(shots, { recursive: true });
  const results = [];
  const check = (name, pass, details = '') => results.push({ name, pass: Boolean(pass), details });

  // Motion allowed, desktop.
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto(base + '/', { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    const r1 = await ribbonOffset(page);
    await page.waitForTimeout(1200);
    const r2 = await ribbonOffset(page);
    check('ribbon: text flows along the curve', r1 !== r2, `${r1} -> ${r2}`);
    await page.click('.hero .loop-btn');
    const p1 = await ribbonOffset(page);
    await page.waitForTimeout(800);
    const p2 = await ribbonOffset(page);
    const label = await page.$eval('.hero .loop-btn', (b) => b.textContent);
    check('ribbon: pause button stops it and offers «fortsetzen»', p1 === p2 && label === 'Animation fortsetzen', `${p1} -> ${p2}, "${label}"`);
    await page.click('.hero .loop-btn');

    await page.$eval('.tools', (el) => el.scrollIntoView({ block: 'center' }));
    await page.mouse.move(5, 5);
    const m1 = await marqueeX(page);
    await page.waitForTimeout(1000);
    const m2 = await marqueeX(page);
    check('marquee: moves while in view', m1 !== m2, `${m1} -> ${m2}`);
    await page.hover('.marquee');
    const h1 = await marqueeX(page);
    await page.waitForTimeout(600);
    const h2 = await marqueeX(page);
    check('marquee: hover pauses it', h1 === h2, `${h1} -> ${h2}`);
    await page.mouse.move(5, 5);
    await page.$eval('#faq', (el) => el.scrollIntoView());
    await page.waitForTimeout(400);
    const off = await page.$eval('.marquee', (el) => el.classList.contains('is-running'));
    check('marquee: stops off-screen', !off);
    await page.$eval('.ba', (el) => el.scrollIntoView({ block: 'start' }));
    await page.evaluate(() => scrollBy(0, -innerHeight)); // above the pin, so the scroll does not move the divider
    await page.waitForTimeout(300);
    await page.$eval('.ba__range', (r) => { r.value = '50'; r.dispatchEvent(new Event('input')); });
    await page.focus('.ba__range');
    await page.waitForTimeout(1500); // focusing scrolls; let the scrubbed wipe settle
    await page.$eval('.ba__range', (r) => { r.value = '50'; r.dispatchEvent(new Event('input')); });
    for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowRight');
    const ba = await page.evaluate(() => ({ v: document.querySelector('.ba__range').value, mask: document.querySelector('.ba__mask').style.transform, text: document.querySelector('.ba__range').getAttribute('aria-valuetext') }));
    check('before/after: arrow keys move the divider and the mask (transforms)', ba.v === '60' && ba.mask === 'translateX(-40%)' && ba.text === 'Vorher 40 %', JSON.stringify(ba));
    // 6 vs 1: moves while in view, pause button stops it.
    await page.$eval('.speed', (el) => el.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(700);
    const sp1 = await page.$eval('.speed__card--slow', (el) => el.style.getPropertyValue('--p'));
    await page.waitForTimeout(700);
    const sp2 = await page.$eval('.speed__card--slow', (el) => el.style.getPropertyValue('--p'));
    await page.click('.speed .loop-btn');
    const sp3 = await page.$eval('.speed__card--slow', (el) => el.style.getPropertyValue('--p'));
    check('6 vs 1: lines run while in view, the pause button stops them', sp1 !== sp2 && sp3 === '', `${sp1} -> ${sp2} -> "${sp3}"`);
    check('demos: no console errors', errors.length === 0, errors.join(' | '));
    await page.close();
  }

  // Flow nodes: one line at a time (desktop and phone).
  for (const width of [1280, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(base + '/', { waitUntil: 'load' });
    await page.waitForTimeout(1600);
    await page.click('.hf__btn--3');
    const flow = await page.evaluate(() => ({
      expanded: [...document.querySelectorAll('.hf__btn')].map((b) => b.getAttribute('aria-expanded')).join(),
      line: [...document.querySelectorAll('.hf__lines li')].filter((li) => getComputedStyle(li).display !== 'none').map((li) => li.textContent),
    }));
    check(`${width}: flow node «Zahlung» shows its one line`, flow.expanded === 'false,false,true,false' && flow.line.length === 1 && flow.line[0].startsWith('Zahlung oder Rate'), JSON.stringify(flow));
    await page.close();
  }

  // Slow web fonts (1.5 s): the hero must not reflow when they arrive.
  for (const p of ['/', '/en/']) {
    const page = await browser.newPage({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 2 });
    await page.addInitScript(() => {
      window.__cls = 0;
      new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__cls += e.value; })).observe({ type: 'layout-shift', buffered: true });
    });
    await page.route('**/*.woff2', async (route) => { await new Promise((r) => setTimeout(r, 1500)); await route.continue(); });
    await page.goto(base + p, { waitUntil: 'load' });
    await page.waitForTimeout(2500);
    const cls = await page.evaluate(() => window.__cls);
    check(`slow fonts ${p}: CLS under 0.05 while fonts arrive late (${cls.toFixed(3)})`, cls < 0.05, cls.toFixed(3));
    await page.close();
  }

  // Reduced motion: nothing loops, no pause buttons needed.
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    await page.goto(base + '/', { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    const r = await ribbonOffset(page);
    const wrapped = await page.$eval('.marquee__list[aria-hidden="true"]', (el) => getComputedStyle(el).display === 'none');
    const buttons = await page.$$eval('.loop-btn', (bs) => bs.every((b) => b.hidden));
    check('reduced motion: ribbon rests, marquee is a static list, no pause buttons', r === 0 && wrapped && buttons, JSON.stringify({ r, wrapped, buttons }));
    await page.$eval('.kidemo', (el) => el.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(600);
    const kr = await page.evaluate(() => ({
      playing: document.querySelector('.kidemo').classList.contains('is-playing'),
      draft: getComputedStyle(document.querySelector('.tone')).opacity === '1',
      speed: getComputedStyle(document.querySelector('.speed__text')).whiteSpace !== 'nowrap',
    }));
    check('reduced motion: KI demo shows the finished draft, 6 vs 1 shows full text', !kr.playing && kr.draft && kr.speed, JSON.stringify(kr));
    await page.close();
  }

  // No JS: final states, static lists.
  {
    const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto(base + '/', { waitUntil: 'load' });
    await page.waitForTimeout(1200);
    const r = await ribbonOffset(page);
    const s = await page.evaluate(() => ({
      copyHidden: getComputedStyle(document.querySelector('.marquee__list[aria-hidden="true"]')).display === 'none',
      wraps: getComputedStyle(document.querySelector('.marquee__list')).flexWrap === 'wrap',
      buttons: [...document.querySelectorAll('.loop-btn')].every((b) => getComputedStyle(b).display === 'none'),
      baBoth: [...document.querySelectorAll('.ba__side')].every((el) => el.getBoundingClientRect().height > 100),
      baNoRange: getComputedStyle(document.querySelector('.ba__control')).display === 'none',
      storyPanes: [...document.querySelectorAll('.pane')].every((p) => getComputedStyle(p).display !== 'none' && p.getBoundingClientRect().height > 50),
      toasts: document.querySelectorAll('.toast').length === 4,
      finderList: getComputedStyle(document.querySelector('.finder__static')).display !== 'none' && getComputedStyle(document.querySelector('.chat')).display === 'none',
      tones: [...document.querySelectorAll('.tone__panel')].filter((p) => getComputedStyle(p).visibility === 'visible').length === 3,
      marks: getComputedStyle(document.querySelector('.hl')).backgroundColor !== 'rgba(0, 0, 0, 0)',
    }));
    check('no JS: ribbon rests, tools wrap, no pause buttons, before/after side by side, story stacked, all tones and marks shown, finder as a list', r === 0 && Object.values(s).every(Boolean), JSON.stringify({ r, ...s }));
    await page.screenshot({ path: path.join(shots, 'nojs-390.png'), fullPage: true });
    await ctx.close();
  }
  return results;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = await startServer({ root: repoRoot });
  const browser = await chromium.launch();
  const results = await checkDemos(browser, server.url);
  await browser.close();
  await server.close();
  for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.pass ? '' : `  -> ${r.details}`}`);
  process.exit(results.every((r) => r.pass) ? 0 : 1);
}
