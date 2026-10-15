// Behaviour checks for the interactive parts (run log, problems, details, calculator).
// Usage: node src/qa/behaviour.mjs   (exit code 1 on failure; screenshots in qa/shots/behaviour)
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium, repoRoot, qaDir } from './browsers.mjs';
import { startServer } from './serve.mjs';
import { calcSavings, formatResult } from '../../assets/js/calc.js';

const shots = path.join(qaDir, 'shots', 'behaviour');

const runState = (page) => page.evaluate(() =>
  [...document.querySelectorAll('.run__step')].map((li) => ({
    done: Number(getComputedStyle(li.querySelector('.run__done')).opacity),
    check: Number(getComputedStyle(li.querySelector('.run__check')).strokeDashoffset.replace('px', '')),
    time: li.querySelector('.run__time').textContent,
  }))
);
const allDone = (s) => s.every((x) => x.done === 1 && x.check === 0);

async function nodeStates(page, sel) {
  return page.$$eval(sel, (nodes) => nodes.map((n) => Number(getComputedStyle(n.querySelector('.node__fixed')).opacity)));
}

export async function checkBehaviour(browser, base) {
  await mkdir(shots, { recursive: true });
  const results = [];
  const check = (name, pass, details = '') => results.push({ name, pass: Boolean(pass), details });

  // 1. Desktop load: mid-run and end state, no console errors.
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(base + '/', { waitUntil: 'load' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(shots, 'hero-mid-1280.png') });
    const mid = await runState(page);
    await page.waitForTimeout(2600);
    await page.screenshot({ path: path.join(shots, 'hero-end-1280.png') });
    const end = await runState(page);
    check('desktop: run is mid-way at 1.0 s', !allDone(mid), JSON.stringify(mid.map((x) => x.done)));
    check('desktop: all six steps done by 3.6 s', allDone(end), JSON.stringify(end));
    check('desktop: times count up to their final values', end.map((x) => x.time).join('|') === '0,2 s|0,6 s|0,9 s|1,4 s|1,9 s|2,3 s', end.map((x) => x.time).join('|'));
    const h1Visible = await page.$eval('.hero h1', (h) => getComputedStyle(h).visibility === 'visible' && h.getBoundingClientRect().height > 0);
    check('desktop: H1 visible after the reveal', h1Visible);
    const splitGone = await page.$eval('.hero h1', (h) => !h.querySelector('div'));
    check('desktop: SplitText reverted after the reveal', splitGone);

    // 2. Replay: double click mid-run must not leave half states.
    await page.click('.run__replay');
    await page.waitForTimeout(250);
    await page.click('.run__replay');
    await page.dblclick('.run__replay');
    await page.waitForTimeout(3000);
    check('replay: rapid clicks end with all steps done', allDone(await runState(page)));
    const status = await page.$eval('#run-status', (s) => s.textContent);
    check('replay: result announced in the live region', status.includes('6 Schritte'), status);

    // 3. Problems: scrubbed repair while scrolling.
    await page.$eval('.pairs', (el) => el.scrollIntoView({ block: 'start' }));
    await page.evaluate(() => scrollBy(0, -innerHeight / 2 + 10));
    await page.waitForTimeout(400);
    const before = await nodeStates(page, '.flow__node');
    await page.screenshot({ path: path.join(shots, 'problems-start-1280.png') });
    await page.$eval('.pair[data-i="1"]', (el) => el.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(400);
    const middle = await nodeStates(page, '.flow__node');
    await page.screenshot({ path: path.join(shots, 'problems-middle-1280.png') });
    await page.$eval('.pairs', (el) => el.scrollIntoView({ block: 'end' }));
    await page.evaluate(() => scrollBy(0, innerHeight / 2));
    await page.waitForTimeout(400);
    const after = await nodeStates(page, '.flow__node');
    check('problems: all nodes broken before the list', before.every((v) => v === 0), JSON.stringify(before));
    check('problems: first nodes repaired mid-way, last still broken', middle[0] === 1 && middle[3] === 0, JSON.stringify(middle));
    check('problems: all nodes repaired after the list', after.every((v) => v === 1), JSON.stringify(after));

    // 4. Resize across the breakpoint and back keeps a consistent state.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1500); // let the one-shot repairs of pairs already passed finish
    const phoneInline = await nodeStates(page, '.pair__node');
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.waitForTimeout(800);
    // Scroll anchoring may move the page during the reflows, so scroll past the list again.
    await page.$eval('.pairs', (el) => el.scrollIntoView({ block: 'end' }));
    await page.evaluate(() => scrollBy(0, innerHeight / 2));
    await page.waitForTimeout(500);
    const resized = await nodeStates(page, '.flow__node');
    check('resize 1280 -> 390: inline nodes have a defined state', phoneInline.every((v) => v === 0 || v === 1), JSON.stringify(phoneInline));
    check('resize 390 -> 1280: nodes repaired after scrolling past', resized.every((v) => v === 1), JSON.stringify(resized));
    await page.$eval('.pairs', (el) => el.scrollIntoView({ block: 'start' }));
    await page.evaluate(() => scrollBy(0, -innerHeight / 2 + 10));
    await page.waitForTimeout(500);
    const back = await nodeStates(page, '.flow__node');
    check('resize 390 -> 1280: nodes broken again above the list (scrub)', back.every((v) => v === 0), JSON.stringify(back));
    check('desktop: no console errors', errors.length === 0, errors.join(' | '));

    // 5. Price details open and close with keyboard.
    await page.focus('.price-details summary');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(450);
    const opened = await page.$eval('.price-details', (d) => d.open && d.querySelector('.price-details__body').offsetHeight > 10);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(450);
    const closed = await page.$eval('.price-details', (d) => !d.open);
    check('details: Enter opens and closes', opened && closed);

    // 6. Calculator: new values, cleared field, live region.
    await page.fill('#calc-emails', '200');
    await page.waitForTimeout(700);
    const exp = formatResult(calcSavings({ emailsPerWeek: 200, minutesPerReply: 6, sharePercent: 60, hourlyRate: 25 }), 'de-AT');
    const got = await page.$$eval('[data-out]', (els) => els.map((e) => e.textContent));
    check('calculator: 200 e-mails give the formula result', JSON.stringify(got) === JSON.stringify([exp.h, exp.savedH, exp.savedEur]), `${got} vs ${Object.values(exp)}`);
    const live = await page.$eval('#calc-live', (e) => e.textContent);
    check('calculator: one final sentence in the live region', live.includes(exp.savedEur) && live.startsWith('Standardantworten'), live);
    await page.fill('#calc-minutes', '');
    await page.waitForTimeout(700);
    const cleared = await page.$$eval('[data-out]', (els) => els.map((e) => e.textContent));
    check('calculator: cleared field shows 0, never NaN', cleared.every((v) => v === '0'), cleared.join(','));
    await page.close();
  }

  // 7. Reduced motion: final states immediately, no scroll animation.
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    await page.goto(base + '/', { waitUntil: 'load' });
    await page.waitForTimeout(150);
    check('reduced motion: run complete at load', allDone(await runState(page)));
    await page.$eval('.pairs', (el) => el.scrollIntoView({ block: 'start' }));
    await page.waitForTimeout(300);
    const nodes = await nodeStates(page, '.flow__node');
    check('reduced motion: problems already repaired', nodes.every((v) => v === 1), JSON.stringify(nodes));
    await page.click('.run__replay');
    await page.waitForTimeout(200);
    const status = await page.$eval('#run-status', (s) => s.textContent);
    check('reduced motion: replay announces the result', status.includes('6 Schritte'), status);
    await page.screenshot({ path: path.join(shots, 'reduced-1280.png') });
    await page.close();
  }

  // 8. Phone: run starts when scrolled into view, inline nodes repair on enter.
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(base + '/', { waitUntil: 'load' });
    await page.waitForTimeout(400);
    const waiting = await runState(page);
    await page.$eval('.run', (el) => el.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(3200);
    const done = await runState(page);
    check('phone: run waits below the fold, then completes', !allDone(waiting) && allDone(done));
    await page.$eval('.pair[data-i="0"]', (el) => el.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(900);
    const inline = await nodeStates(page, '.pair__node');
    check('phone: first inline node repaired on enter, last still broken', inline[0] === 1 && inline[3] === 0, JSON.stringify(inline));
    await page.screenshot({ path: path.join(shots, 'problems-390.png') });
    await page.close();
  }

  // 9. JavaScript disabled: content and navigation usable.
  {
    const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto(base + '/', { waitUntil: 'load' });
    const ok = await page.evaluate(() => ({
      nav: getComputedStyle(document.querySelector('.site-nav__list')).display !== 'none',
      h1: getComputedStyle(document.querySelector('.hero h1')).visibility === 'visible',
      run: getComputedStyle(document.querySelector('.run__done')).opacity === '1',
      faq: document.querySelectorAll('details.faq__item').length === 6,
      mail: Boolean(document.querySelector('a[href^="mailto:"]')),
    }));
    check('no JS: nav, H1, finished run, FAQ and mail link usable', Object.values(ok).every(Boolean), JSON.stringify(ok));
    await page.screenshot({ path: path.join(shots, 'nojs-390.png'), fullPage: true });
    await ctx.close();
  }
  return results;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = await startServer({ root: repoRoot });
  const browser = await chromium.launch();
  const results = await checkBehaviour(browser, server.url);
  await browser.close();
  await server.close();
  for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.pass ? '' : `  -> ${r.details}`}`);
  process.exit(results.every((r) => r.pass) ? 0 : 1);
}
