// Behaviour checks for the Stage 2 demos: motion, reduced motion, no JS, keyboard, mobile.
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
    await page.focus('.ba__range');
    for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowRight');
    const pos = await page.$eval('.ba__stage', (el) => el.style.getPropertyValue('--pos'));
    const clip = await page.$eval('.ba__side--after', (el) => getComputedStyle(el).clipPath);
    check('before/after: arrow keys move the divider and the clip', pos === '60%' && clip.includes('60%'), `${pos} | ${clip}`);
    check('demos: no console errors', errors.length === 0, errors.join(' | '));
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
      baBoth: [...document.querySelectorAll('.ba__side')].every((el) => getComputedStyle(el).clipPath === 'none' && el.getBoundingClientRect().height > 100),
      baNoRange: getComputedStyle(document.querySelector('.ba__control')).display === 'none',
    }));
    check('no JS: ribbon rests, tool list wraps, no pause buttons, before and after both shown', r === 0 && Object.values(s).every(Boolean), JSON.stringify({ r, ...s }));
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
