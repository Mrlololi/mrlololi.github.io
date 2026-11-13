// Stage 7b «Zeichen und Regeln» (12.11.2026), half 1 «Schranken»: the contrast matrix of design system
// 7.1, the ratchet file (design-debt.json), the home weight ratchet and the kit constants against the
// motion tokens. docs/DESIGN_SYSTEM_v1_2026-11-12.md and docs/PROMPT_Stage7b_Zeichen_Regeln_2026-11-12.md.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { pairs, failing, readTokens } from '../src/qa/contrast-matrix.mjs';
import { countDebt, baseline, risen } from '../src/qa/design-debt.mjs';

const file = (p) => new URL(`../${p}`, import.meta.url);
const read = (p) => readFileSync(file(p), 'utf8');

test('1c. contrast matrix: every pair of design system 7.1 on the right side of its threshold', () => {
  const list = pairs();
  assert.ok(list.length > 150, `${list.length} pairs`);
  const bad = failing(list).map((p) => `${p.kind} ${p.fg} on ${p.bg}: ${p.ratio.toFixed(2)} (min ${p.min})`);
  assert.deepEqual(bad, []);
  // The negative cases are really there (nobody may «fix» them into use by accident).
  assert.ok(list.filter((p) => p.kind === 'deny').length >= 15);
});

test('2. tokens: the three new inks, the new tokens, no accent ink literal outside :root', () => {
  const t = readTokens();
  assert.equal(t['pink-ink'], '#8E3650');
  assert.equal(t['blue-ink'], '#285B88');
  assert.equal(t.done, '#3F7531');
  for (const [k, v] of Object.entries({ peach: '#F7DCC8', 'peach-tint': '#FDF6F1', 'peach-ink': '#7A4E2D', error: '#8A2F45', muted: '#6E6A78', card: '#FFFFFF', 'sec-paper': '#FDF9F6', 'radius-tag': '6px', 't-press': '120ms', 't-ui': '200ms', 't-enter': '500ms', 't-beat': '1800ms', 't-fade': '450ms', 'ease-io': 'cubic-bezier(0.45, 0, 0.55, 1)' })) assert.equal(t[k], v, k);
  assert.match(t['shadow-raised'], /^0 2px 4px rgb\(43 42 51 \/ \.06\), 0 22px 44px -18px rgb\(43 42 51 \/ \.26\)$/);
  // Accent inks live only in the token block.
  const css = ['components', 'main'].map((f) => read(`assets/css/${f}.css`)).join('\n');
  const outside = css.replace(/:root \{[\s\S]*?\n\}/, '');
  for (const hex of ['#285B88', '#8E3650', '#7A4E2D']) assert.ok(!outside.toUpperCase().includes(hex), hex);
  // The hand patches are gone, the labels read the tokens.
  assert.ok(!/\.about__line \.tl-blue \{ color:/.test(css));
  assert.match(css, /\.label--blue \{ background: #E3EEF8; color: var\(--blue-ink\); \}/);
  assert.match(css, /\.label--peach \{ background: #FBEDE3; color: var\(--peach-ink\); \}/);
});

test('1e. ratchet: no design-debt number above src/qa/design-debt.json', () => {
  const now = countDebt();
  assert.deepEqual(risen(now), [], JSON.stringify(now));
  const base = baseline();
  for (const k of ['hex', 'rgb', 'radius', 'shadow', 'durations', 'mediaWidths', 'svgTemplates']) {
    assert.equal(typeof base.max[k], 'number', k);
    assert.ok(base.rules[k], `counting rule for ${k}`);
  }
});

test('1f. weight ratchet: home HTML <= 50 KB gzip', () => {
  const { weight } = baseline();
  for (const f of ['index.html', 'en/index.html']) {
    const kb = gzipSync(readFileSync(file(f)), { level: 9 }).length / 1024;
    assert.ok(kb <= weight.homeHtmlGzKb, `${f}: ${kb.toFixed(1)} KB`);
  }
});

test('1f. weight ratchet: home DOM <= 1,800 elements', async () => {
  const { weight } = baseline();
  const { chromium } = await import('../src/qa/browsers.mjs');
  const { startServer } = await import('../src/qa/serve.mjs');
  const server = await startServer({ root: fileURLToPathSafe(file('')) });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    for (const p of ['/', '/en/']) {
      await page.goto(server.url + p, { waitUntil: 'load' });
      await page.waitForTimeout(1500);
      const n = await page.evaluate(() => document.querySelectorAll('*').length);
      assert.ok(n <= weight.homeDom, `${p}: ${n} elements`);
    }
  } finally {
    await browser.close();
    await server.close();
  }
});

test('h. the main site declares its light scheme', () => {
  for (const f of ['index.html', 'impressum/index.html', 'launch-technik/index.html']) assert.match(read(f), /<meta name="viewport" content="width=device-width, initial-scale=1">\n<meta name="color-scheme" content="light">/, f);
});

test('kit constants equal the motion tokens (FADE = --t-fade)', () => {
  const t = readTokens();
  const motion = read('assets/js/kit/motion.js');
  assert.equal(`${motion.match(/const FADE = (\d+);/)[1]}ms`, t['t-fade']);
  assert.match(motion, /const MIN_REST = 2500;/);
});

function fileURLToPathSafe(u) { return decodeURIComponent(u.pathname.replace(/^\/([A-Za-z]:)/, '$1')).replace(/\/$/, ''); }
