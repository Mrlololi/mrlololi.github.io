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
    // Story: pinned on wide screens, the scroll moves through the three steps.
    const active = () => page.$$eval('.story__panel', (ps) => ps.findIndex((p) => p.classList.contains('is-active')));
    const pinned = await page.$eval('.story', (el) => el.classList.contains('is-pinned'));
    const stStart = await page.$eval('.story', (el) => el.getBoundingClientRect().top + scrollY + el.offsetHeight / 2 - innerHeight / 2);
    const states = [];
    for (const f of [0.1, 0.5, 0.9]) {
      await page.evaluate((y) => window.scrollTo(0, y), stStart + 900 * 1.5 * f);
      await page.waitForTimeout(350);
      states.push(await active());
    }
    check('story: pinned at 1280 and the scroll walks through steps 1, 2, 3', pinned && states.join() === '0,1,2', `pinned ${pinned}, ${states}`);
    await page.waitForTimeout(800);
    const live = await page.$eval('.toasts', (el) => el.classList.contains('is-live'));
    const shownToasts = await page.$$eval('.toast.is-in', (ts) => ts.length);
    check('toasts: stack plays while step 3 is shown', live && shownToasts >= 1, `live ${live}, ${shownToasts} in`);
    await page.click('.toasts .loop-btn');
    const pausedLive = await page.$eval('.toasts', (el) => el.classList.contains('is-live'));
    check('toasts: pause button stops the loop and shows all four', !pausedLive && (await page.$$eval('.toast', (ts) => ts.every((t) => getComputedStyle(t).opacity === '1'))));
    await page.click('.toasts .loop-btn');
    await page.focus('#story-tab-3');
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(350);
    check('story: arrow keys on the tabs move to the previous step', (await active()) === 1 && (await page.evaluate(() => document.activeElement.id)) === 'story-tab-2');
    // KI block: plays once in view, ends finished, «Nochmal» replays; tones by arrow keys.
    await page.$eval('.kidemo', (el) => el.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(1200);
    const mid = await page.$eval('.kidemo', (el) => ({ playing: el.classList.contains('is-playing'), done: el.classList.contains('is-done') }));
    await page.waitForTimeout(4200);
    const end = await page.$eval('.kidemo', (el) => ({ done: el.classList.contains('is-done'), replay: !el.querySelector('.kidemo__replay').hidden, chips: el.querySelectorAll('.chip.is-on').length }));
    check('KI demo: plays once in view and ends with the draft (under 5 s)', mid.playing && !mid.done && end.done && end.replay && end.chips === 4, JSON.stringify({ mid, end }));
    await page.click('.kidemo__replay');
    await page.waitForTimeout(300);
    check('KI demo: «Nochmal» replays it', await page.$eval('.kidemo', (el) => !el.classList.contains('is-done')));
    await page.focus('#tone-tab-1');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    const tone = await page.evaluate(() => ({ focus: document.activeElement.id, shown: document.querySelector('.tone__panel.is-active .tone__text').textContent.slice(0, 9) }));
    check('tone switcher: arrow keys choose «locker»', tone.focus === 'tone-tab-3' && tone.shown === 'Hi Anna! ', JSON.stringify(tone));
    // 6 vs 1: moves while in view, pause button stops it.
    await page.$eval('.speed', (el) => el.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(700);
    const sp1 = await page.$eval('.speed__card--slow', (el) => el.style.getPropertyValue('--p'));
    await page.waitForTimeout(700);
    const sp2 = await page.$eval('.speed__card--slow', (el) => el.style.getPropertyValue('--p'));
    await page.click('.speed .loop-btn');
    const sp3 = await page.$eval('.speed__card--slow', (el) => el.style.getPropertyValue('--p'));
    check('6 vs 1: lines run while in view, the pause button stops them', sp1 !== sp2 && sp3 === '', `${sp1} -> ${sp2} -> "${sp3}"`);
    // Package finder: every answer path ends on the right package; restart clears it.
    const expected = { broken: { yes: 'quick', no: 'check' }, launch: { yes: 'launch', no: 'check' }, website: { yes: 'website', no: 'check' }, inbox: { yes: 'ki', no: 'check' } };
    const wrong = [];
    for (const [topic, byKnows] of Object.entries(expected)) {
      for (const [knows, pkg] of Object.entries(byKnows)) {
        await page.click(`.finder__q[data-q="1"] [data-value="${topic}"]`);
        await page.click(`.finder__q[data-q="2"] [data-value="${knows}"]`);
        await page.click(`.finder__q[data-q="3"] [data-value="${knows === 'yes' ? 'soon' : 'later'}"]`);
        const href = await page.$eval('.finder__result a', (a) => a.getAttribute('href'));
        if (href !== `#pkg-${pkg}`) wrong.push(`${topic}+${knows} -> ${href}`);
      }
    }
    await page.click('.finder__restart');
    const cleared = await page.$eval('.finder__app', (app) => app.querySelector('.finder__result').textContent === '' && app.querySelector('[data-q="2"]').hidden);
    check('finder: all 8 answer paths pick the package from the brief, restart clears', wrong.length === 0 && cleared, wrong.join(', '));
    check('demos: no console errors', errors.length === 0, errors.join(' | '));
    await page.close();
  }

  // Phone: tabs, no pin; resize back to desktop pins again without horizontal scroll.
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(base + '/', { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    await page.$eval('.story', (el) => el.scrollIntoView({ block: 'start' }));
    const pinned = await page.$eval('.story', (el) => el.classList.contains('is-pinned'));
    await page.click('#story-tab-3');
    await page.waitForTimeout(400);
    const third = await page.$eval('#story-panel-3', (p) => p.classList.contains('is-active') && getComputedStyle(p).visibility === 'visible');
    await page.screenshot({ path: path.join(shots, 'story-390.png') });
    check('story 390: tabs, no pin, tab 3 shows step 3', !pinned && third, JSON.stringify({ pinned, third }));
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.waitForTimeout(800);
    const wide = await page.evaluate(() => ({ pinned: document.querySelector('.story').classList.contains('is-pinned'), overflow: document.documentElement.scrollWidth - innerWidth }));
    check('story: resize 390 -> 1280 pins again, no horizontal scroll', wide.pinned && wide.overflow <= 0, JSON.stringify(wide));
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
    const rm = await page.evaluate(() => ({
      pinned: document.querySelector('.story').classList.contains('is-pinned'),
      tabs: document.querySelector('.story').classList.contains('is-tabs'),
      toasts: [...document.querySelectorAll('.toast')].every((t) => getComputedStyle(t).opacity === '1'),
    }));
    check('reduced motion: story uses tabs without pin, all toasts listed', !rm.pinned && rm.tabs && rm.toasts, JSON.stringify(rm));
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
      baBoth: [...document.querySelectorAll('.ba__side')].every((el) => getComputedStyle(el).clipPath === 'none' && el.getBoundingClientRect().height > 100),
      baNoRange: getComputedStyle(document.querySelector('.ba__control')).display === 'none',
      storyStacked: [...document.querySelectorAll('.story__panel')].every((p) => getComputedStyle(p).visibility === 'visible' && p.getBoundingClientRect().height > 50),
      toasts: document.querySelectorAll('.toast').length === 4,
      finderList: getComputedStyle(document.querySelector('.finder__static')).display !== 'none' && getComputedStyle(document.querySelector('.finder__app')).display === 'none',
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
