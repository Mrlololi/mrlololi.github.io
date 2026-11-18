// Gate «glatt» (design system 5.1 rule 7, 18.11.2026): the probe itself. A planted jump fails, the same
// move eased over 400 ms passes, a part that jumps while its picture is invisible is not seen. The gate over
// all pages of both sites runs in node src/qa/gates.mjs (gate 8).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chromium } from '../src/qa/browsers.mjs';
import { GLATT_PROBE, GLATT_SELECTOR, GLATT_LIMITS } from '../src/qa/glatt.mjs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('limits and samples of rule 7', () => {
  assert.deepEqual(GLATT_LIMITS, { translate: 8, rotate: 6, scale: 0.04, opacity: 0.25 });
  for (const s of ['svg.mascot', '[data-part]', '.rl__dot', '[data-enter]']) assert.ok(GLATT_SELECTOR.includes(s), s);
  assert.match(read('src/qa/gates.mjs'), /glattGate\(browser, server\.url, pages\)/);
});

test('the probe: a planted jump fails, an eased move passes, an unseen jump does not count', { timeout: 120000 }, async () => {
  const browser = await chromium.launch();
  try {
    const run = async (script) => {
      const ctx = await browser.newContext({ viewport: { width: 800, height: 600 } });
      await ctx.addInitScript(GLATT_PROBE, { sel: GLATT_SELECTOR, limits: GLATT_LIMITS });
      const page = await ctx.newPage();
      await page.setContent('<div id="pic"><div data-enter id="a" style="width:100px;height:100px;background:#ccc"></div></div>');
      await page.evaluate(() => { window.__glatt.on = true; });
      await page.waitForTimeout(200);
      await page.evaluate(script);
      await page.waitForTimeout(700);
      const r = await page.evaluate(() => window.__glatt);
      await ctx.close();
      return r.fails.map((f) => f.kind);
    };
    assert.ok((await run(() => { document.getElementById('a').style.transform = 'translateX(20px)'; })).includes('translate'), 'a 20 px jump');
    assert.ok((await run(() => { document.getElementById('a').style.opacity = '0'; })).includes('opacity'), 'vanishing at once');
    assert.ok((await run(() => { document.getElementById('a').style.transform = 'scale(1.1)'; })).includes('scale'), 'an instant squash');
    assert.deepEqual(await run(() => { document.getElementById('a').animate([{ transform: 'none' }, { transform: 'translateX(20px) rotate(10deg) scale(1.1)' }], { duration: 400, easing: 'ease-in-out', fill: 'forwards' }); }), [], 'eased over 400 ms');
    assert.deepEqual(await run(() => { const p = document.getElementById('pic'); p.style.opacity = '0'; requestAnimationFrame(() => requestAnimationFrame(() => { document.getElementById('a').style.transform = 'translateX(40px)'; })); }), ['opacity'], 'the picture vanishing is a step, the jump behind it is not seen');
  } finally {
    await browser.close();
  }
});

test('the fixes of 18.11.2026 stay in the code', () => {
  const kit = read('assets/js/kit/mascot-react.js');
  assert.match(kit, /commitStyles\(\)/, 'an interrupted reaction keeps its pose');
  assert.match(kit, /data-pose-in/, 'a pose change crossfades inside the part');
  assert.match(kit, /\{ transform: from\(svg\), easing: 'ease-in-out' \}/, 'the hop starts from the current pose');
  assert.match(kit, /duration: 1800, easing: 'ease-in-out'/, 'the wrench turns slowly enough');
  assert.match(read('assets/js/kit/motion.js'), /\[data-poke\]'\)\) return;/, 'a click on a mascot never pauses the picture');
  assert.match(read('assets/js/kit/motion.js'), /if \(d\.phase !== 'end'\) \{ cycle\(d\); return; \}/, 'a finished frame always fades before a new round');
  assert.match(read('assets/css/main.css'), /\.demo\.is-fading, \[data-demo\]\.is-fading \{ filter: grayscale\(1\); opacity: 0; \}/);
  assert.match(read('assets/js/notfound.js'), /duration: 3000/);
  assert.match(read('assets/js/mascots.js'), /duration: 0\.11, yoyo: true, repeat: 1, ease: 'sine\.inOut'/);
});
