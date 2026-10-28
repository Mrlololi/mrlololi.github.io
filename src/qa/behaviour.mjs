// Behaviour checks for the interactive parts (hero flow, details, calculator, reduced motion, no JS).
// The Stage 4 demos (problem cards, story, KI, chat, FAQ, contact, replay on re-entry) are in stage4.mjs.
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

// Hero flow: opacity of each node's check.
const flowChecks = (page) => page.$$eval('.hf__check', (els) => els.map((e) => Number(getComputedStyle(e).opacity)));
export async function checkBehaviour(browser, base) {
  await mkdir(shots, { recursive: true });
  const results = [];
  const check = (name, pass, details = '') => results.push({ name, pass: Boolean(pass), details });

  // 1. Desktop load: the hero flow plays once; the run log waits below the fold, then plays.
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(base + '/', { waitUntil: 'load' });
    await page.waitForTimeout(1000);
    const flowMid = await flowChecks(page);
    await page.screenshot({ path: path.join(shots, 'hero-mid-1280.png') });
    await page.waitForTimeout(3600);
    const flowEnd = await flowChecks(page);
    await page.screenshot({ path: path.join(shots, 'hero-end-1280.png') });
    check('hero flow: first node lit at 1.0 s, last not yet', flowMid[0] === 1 && flowMid[3] < 1, JSON.stringify(flowMid));
    check('hero flow: all nodes lit by 4.6 s (plays once, under 5 s)', flowEnd.every((v) => v === 1), JSON.stringify(flowEnd));
    check('desktop: no console errors', errors.length === 0, errors.join(' | '));

    // 6. Price details open and close with keyboard.
    await page.focus('.price-details summary');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(450);
    const opened = await page.$eval('.price-details', (d) => d.open && d.querySelector('.price-details__body').offsetHeight > 10);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(450);
    const closed = await page.$eval('.price-details', (d) => !d.open);
    check('details: Enter opens and closes', opened && closed);

    // 7. Calculator: counts up in view, then new values, cleared field, live region.
    await page.$eval('#ki-rechner', (el) => el.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(1600);
    const shown = await page.$$eval('[data-out]', (els) => els.map((e) => e.textContent));
    check('calculator: example numbers end at the default result after counting up', shown.join('|') === '31,2|21,8|546', shown.join('|'));
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

  // 8. Reduced motion: every final state at once, nothing moves.
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    await page.goto(base + '/', { waitUntil: 'load' });
    await page.waitForTimeout(150);
    check('reduced motion: hero flow lit at load', (await flowChecks(page)).every((v) => v === 1));
    check('reduced motion: run complete at load', allDone(await runState(page)));
    await page.$eval('.screen', (el) => el.scrollIntoView({ block: 'center' }));
    await page.waitForSelector('.run__replay:not([hidden])', { timeout: 8000 });
    await page.click('.run__replay');
    await page.waitForTimeout(200);
    const status = await page.$eval('#run-status', (s) => s.textContent);
    check('reduced motion: «Nochmal abspielen» announces the result', status.includes('6 Schritte'), status);
    await page.screenshot({ path: path.join(shots, 'reduced-1280.png') });
    await page.close();
  }

  // 10. JavaScript disabled: content and navigation usable, every final state shown.
  {
    const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto(base + '/', { waitUntil: 'load' });
    await page.waitForTimeout(4500); // the CSS-only hero flow has finished
    const ok = await page.evaluate(() => ({
      nav: getComputedStyle(document.querySelector('.site-nav__list')).display !== 'none',
      h1: getComputedStyle(document.querySelector('.hero h1')).visibility === 'visible',
      run: getComputedStyle(document.querySelector('.run__done')).opacity === '1',
      fixes: [...document.querySelectorAll('.pc__fix')].every((e) => getComputedStyle(e).transform === 'none'),
      flow: [...document.querySelectorAll('.hf__check')].every((e) => getComputedStyle(e).opacity === '1'),
      faq: document.querySelectorAll('details.faq__item').length === 7,
      mail: Boolean(document.querySelector('a[href^="mailto:"]')),
    }));
    check('no JS: nav, H1, flow, finished run, solutions, FAQ and mail link usable', Object.values(ok).every(Boolean), JSON.stringify(ok));
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
