// R6 «Handy-Fixes» (docs/PROMPT_R6_Handy_Fixes_2026-11-25.md):
// portraits circular/undistorted, no fade <800px, Mein Weg hidden <800px, Ein Kauf 1-screen + clickable icons,
// /website-one-pager/ WordPress, /qualitaet/ exit button preselects Technik-Check.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import config from '../src/config.json' with { type: 'json' };
import { pages } from '../src/build.mjs';
import { chromium } from '../src/qa/browsers.mjs';
import { startServer } from '../src/qa/serve.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const by = Object.fromEntries(pages(config, { articles: [] }).map((p) => [p.file, p.html]));

test('R6 #6 /website-one-pager/ DE & EN name Leadpages, Wix, WordPress or custom HTML', () => {
  assert.ok(by['website-one-pager/index.html'].includes('Website als One-Pager mit Leadpages, Wix, WordPress oder eigenem HTML'));
  assert.ok(by['en/one-page-website/index.html'].includes('One-page website with Leadpages, Wix, WordPress or custom HTML'));
});

test('R6 #7 /qualitaet/ exit button links to /?paket=check&quelle=qualitaet#contact', () => {
  assert.ok(by['qualitaet/index.html'].includes('href="/?paket=check&amp;quelle=qualitaet#contact"'));
});

test('R6 browser checks at 360/390px: circular portraits, zero fade, Mein Weg hidden, Ein Kauf clickable rail icons & 1-screen height, qualitaet exit preselects check', async () => {
  const srv = await startServer({ root });
  const br = await chromium.launch();
  try {
    const p390 = await br.newPage({ viewport: { width: 390, height: 844 } });
    await p390.goto(srv.url + '/', { waitUntil: 'load' });
    await p390.waitForTimeout(400);

    // #3 Mein Weg hidden < 800px
    const pathDisp = await p390.evaluate(() => getComputedStyle(document.querySelector('.path')).display);
    assert.equal(pathDisp, 'none', 'Mein Weg hidden on phone');

    // #2 zero opacity < 1 while scrolling at 390px
    const h = await p390.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    const faded = [];
    for (let y = 0; y <= h; y += 350) {
      await p390.evaluate((v) => scrollTo(0, v), y);
      await p390.waitForTimeout(60);
      const bad = await p390.evaluate(() => [...document.querySelectorAll('[data-enter], [data-enter="stagger"] > *')].filter((el) => {
        const b = el.getBoundingClientRect();
        return b.height > 0 && b.bottom > 0 && b.top < innerHeight && Number(getComputedStyle(el).opacity) < 0.99;
      }).length);
      if (bad) faded.push(y);
    }
    assert.deepEqual(faded, [], 'zero faded blocks at 390px');

    // #1 portraits circular/undistorted at 360px and 390px
    for (const w of [360, 390]) {
      await p390.setViewportSize({ width: w, height: 844 });
      await p390.waitForTimeout(150);
      const imgs = await p390.evaluate(() => [...document.querySelectorAll('img')].filter((i) => /avatar-|claudia-photo/.test(i.src)).map((i) => {
        const r = i.getBoundingClientRect();
        return { src: i.src.split('/').pop(), rw: Math.round(r.width), rh: Math.round(r.height) };
      }));
      for (const im of imgs) assert.ok(Math.abs(im.rw - im.rh) <= 1, `${w}px ${im.src}: ${im.rw}x${im.rh}`);
    }

    // #4 Ein Kauf: compact height + clickable rail icons toggle step
    await p390.setViewportSize({ width: 390, height: 844 });
    await p390.goto(srv.url + '/werkzeuge/ein-kauf/', { waitUntil: 'load' });
    await p390.waitForSelector('.ek-ready', { timeout: 8000 });
    const ekMetrics = await p390.evaluate(() => {
      const log = document.querySelector('.ek-log').getBoundingClientRect();
      const btns = [...document.querySelectorAll('.rl__nodebtn')].map((b) => ({ step: b.dataset.step, w: Math.round(b.getBoundingClientRect().width), h: Math.round(b.getBoundingClientRect().height) }));
      return { logH: Math.round(log.height), btns };
    });
    assert.ok(ekMetrics.logH <= 640, `Ein Kauf .ek-log fits in one screen: ${ekMetrics.logH}px`);
    assert.equal(ekMetrics.btns.length, 6);
    for (const b of ekMetrics.btns) assert.ok(b.w >= 44 && b.h >= 44, `rail btn ${b.step} >= 44px: ${b.w}x${b.h}`);
    await p390.click('.rl__nodebtn[data-step="zahlung"]');
    const afterRail = await p390.evaluate(() => ({
      off: document.querySelector('.rl--kauf').dataset.off,
      swPressed: document.querySelector('.ek-switch[data-step="zahlung"]').getAttribute('aria-pressed'),
      nodePressed: document.querySelector('.rl__nodebtn[data-step="zahlung"]').getAttribute('aria-pressed'),
    }));
    assert.deepEqual(afterRail, { off: 'zahlung', swPressed: 'true', nodePressed: 'true' });

    // #7 /qualitaet/ exit button preselects Technik-Check
    await p390.goto(srv.url + '/qualitaet/', { waitUntil: 'load' });
    await p390.click('.q-exit a.btn');
    await p390.waitForFunction(() => window.__cfReady === true, null, { timeout: 10000 });
    const qExit = await p390.evaluate(() => ({
      paket: document.querySelector('#cf-paket').value,
      quelle: document.querySelector('#contact-form').elements.quelle.value,
      open: document.querySelector('.cf-more').open,
    }));
    assert.deepEqual(qExit, { paket: 'check', quelle: 'qualitaet', open: true });

    // Desktop check: Mein Weg visible >= 800px
    const p1280 = await br.newPage({ viewport: { width: 1280, height: 900 } });
    await p1280.goto(srv.url + '/', { waitUntil: 'load' });
    assert.notEqual(await p1280.evaluate(() => getComputedStyle(document.querySelector('.path')).display), 'none');
    await p1280.close();
    await p390.close();
  } finally {
    await br.close();
    await srv.close();
  }
});
