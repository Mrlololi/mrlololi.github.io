// Stage 7b «Zeichen und Regeln» (12.11.2026), half 1 «Schranken»: the contrast matrix of design system
// 7.1, the ratchet file (design-debt.json), the home weight ratchet and the kit constants against the
// motion tokens. docs/DESIGN_SYSTEM_v1_2026-11-12.md and docs/PROMPT_Stage7b_Zeichen_Regeln_2026-11-12.md.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
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

test('1f. weight ratchet: home DOM within the ceiling of design-debt.json (1,850 since 7b half 2)', async () => {
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
      // The count is taken with every mascot at rest: a hop on load (joy has more arm and mouth shapes) or a
      // pose crossfade copy is not page weight. The hero rests 3 s in each 7.3 s round (wait at most 10 s).
      await page.waitForFunction(() => !document.querySelector('[data-fading], svg.mascot[data-jumping]') && [...document.querySelectorAll('svg.mascot[data-base]')].every((m) => m.dataset.emo === m.dataset.base), null, { timeout: 10000, polling: 50 }).catch(() => {});
      assert.ok(await page.locator('.hero').count(), `${p}: the home page itself, not 404.html`);
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

// The site root as a native path (the local server compares native paths; forward slashes would serve 404.html).
function fileURLToPathSafe(u) { return fileURLToPath(u).replace(/[\\/]$/, ''); }

/* ---------- Half 2 «Zeichen» ---------- */
import { ICONS, icon, iconSymbols } from '../assets/js/kit/icons.mjs';
import { readdirSync } from 'node:fs';

const built = () => {
  const out = [];
  const walk = (dir) => {
    for (const e of readdirSync(file(dir), { withFileTypes: true })) {
      if (['node_modules', 'src', 'tests', 'assets', '.git'].includes(e.name)) continue;
      const p = `${dir}${e.name}`;
      if (e.isDirectory()) walk(`${p}/`);
      else if (e.name.endsWith('.html')) out.push([p, read(p)]);
    }
  };
  walk('');
  return out;
};

test('3. icon module: the eleven ids of 7b, drawing rules, one fill shape, at most one moving part', () => {
  // + cross (Werkzeug «Ein Kauf», design system 3.6 row updated).
  assert.deepEqual(Object.keys(ICONS).sort(), ['blocks', 'calendar', 'card', 'check', 'cross', 'form', 'key', 'mail-star', 'offer', 'receipt', 'tag', 'unlock'].sort());
  for (const [id, e] of Object.entries(ICONS)) {
    assert.ok(!/<polygon|<polyline/.test(e.body), `${id}: no polygon (never a triangle)`);
    assert.ok((e.body.match(/style="fill: var\(--i-fill, none\)"/g) || []).length <= 1, `${id}: at most one fill shape`);
    assert.ok((e.body.match(/class="m"/g) || []).length <= 1, `${id}: at most one m part`);
    assert.ok(!/class="(?!m")/.test(e.body), `${id}: no class but m`);
    assert.ok(e.tone === null || ['pink', 'blue', 'pist', 'lav', 'peach'].includes(e.tone), id);
  }
  assert.match(icon('unlock', { size: 48 }), /^<svg class="i i--48 tone-pist" aria-hidden="true" focusable="false"><use href="#i-unlock"\/><\/svg>$/);
  assert.match(icon('unlock', { size: 24 }), /^<svg class="i i--24" aria-hidden="true"/);
  assert.match(icon('calendar', { size: 40, inline: true }), /^<svg class="i i--40 tone-pink" data-icon="calendar" viewBox="0 0 24 24" aria-hidden="true" focusable="false">/);
  assert.throws(() => icon('nope'));
  assert.throws(() => iconSymbols(['nope']));
  assert.match(iconSymbols(['form']), /^<svg class="i-defs" width="0" height="0" aria-hidden="true" focusable="false"><symbol id="i-form" viewBox="0 0 24 24">/);
});

test('gate 2. icon lint: every <use> resolves on its page, no unused symbol, icons aria-hidden; templates draw no <svg> of their own', () => {
  for (const [f, h] of built()) {
    const used = new Set([...h.matchAll(/<use href="#i-([\w-]+)"\/>/g)].map((m) => m[1]));
    const defined = new Set([...h.matchAll(/<symbol id="i-([\w-]+)"/g)].map((m) => m[1]));
    assert.deepEqual([...used].filter((id) => !defined.has(id)), [], `${f}: <use> without symbol`);
    assert.deepEqual([...defined].filter((id) => !used.has(id)), [], `${f}: symbol not used`);
    for (const m of h.matchAll(/<svg class="(?:[\w-]+ )?i i--\d+[^"]*"[^>]*>/g)) assert.match(m[0], /aria-hidden="true" focusable="false"/, `${f}: ${m[0]}`);
    if (defined.size) assert.match(h, /<body class="[^"]+">\n<svg class="i-defs"/, `${f}: symbols right after <body>`);
  }
  // runlog.mjs and the process part of sections.mjs: icons from the module or the mascot kit only.
  assert.ok(!/<svg/.test(read('src/templates/runlog.mjs')), 'runlog.mjs: no <svg> literal');
  const s = read('src/templates/sections.mjs');
  const proc = s.slice(s.indexOf('export function processSteps'), s.indexOf('</ol>', s.indexOf('export function processSteps')));
  assert.ok(!/<svg/.test(proc), 'process: no <svg> literal');
});

test('3. contact sheet /_icons/: noindex, not in the sitemap, every id at 20, 24, 48; drawn line 1.5 to 2.4 px', () => {
  const h = read('_icons/index.html');
  assert.match(h, /<meta name="robots" content="noindex">/);
  assert.match(h, /<title>Icons<\/title>/);
  assert.ok(!read('sitemap.xml').includes('_icons'));
  for (const f of built().map(([p]) => p).filter((p) => !p.startsWith('_icons'))) assert.ok(!read(f).includes('/_icons/'), `${f} links the sheet`);
  for (const id of Object.keys(ICONS)) for (const size of [20, 24, 48]) assert.ok(h.includes(icon(id, { size })), `${id} ${size}`);
  const kit = read('assets/css/kit.css');
  for (const size of [20, 24, 48]) {
    const stroke = Number(kit.match(new RegExp(`\\.i--${size} \\{[^}]*--i-stroke: ([\\d.]+)`))[1]);
    const px = (stroke * size) / 24;
    assert.ok(px >= 1.5 && px <= 2.4, `${size}: ${px.toFixed(2)} px`);
  }
});

test('4. kit.css: the card kinds and icon classes, classes only, no literal, inlined between components and main', () => {
  const kit = read('assets/css/kit.css');
  for (const c of ['.card--row', '.card--note', '.card--pic', '.card--frame', '.card__ico', '.card__media', '.card__title', '.card__text', '.card__foot', '.ico-list', '.i-defs', '.i-tile', '.tone-peach']) assert.ok(kit.includes(c), c);
  assert.ok(!/:root|#[0-9a-fA-F]{3,8}\b|rgba?\(/.test(kit.replace(/\/\*[\s\S]*?\*\//g, '')), 'no :root and no colour literal');
  assert.ok(!/transition:[^;]*box-shadow|@keyframes[^}]*box-shadow/.test(kit), 'box-shadow never animates');
  assert.match(read('src/templates/layout.mjs'), /\['components', 'kit', 'main'\]/);
});

test('5/6. kit constants: ENTER = --t-enter, BEAT = --t-beat; motion.js imports neither enter.js nor icons.mjs', () => {
  const t = readTokens();
  assert.equal(`${read('assets/js/kit/enter.js').match(/export const ENTER = (\d+);/)[1]}ms`, t['t-enter']);
  assert.equal(`${read('assets/js/kit/motion.js').match(/export const BEAT = (\d+);/)[1]}ms`, t['t-beat']);
  const m = read('assets/js/kit/motion.js');
  assert.ok(!/^import /m.test(m), 'kit/motion.js imports nothing (offline apps precache only it)');
  for (const f of readdirSync(file('assets/js')).filter((x) => x.endsWith('.js'))) assert.ok(!/icons\.mjs/.test(read(`assets/js/${f}`)), `${f} must not load icons.mjs`);
  assert.ok(!/icons\.mjs/.test(read('index.html')), 'no modulepreload of icons.mjs');
});

test('5. data-enter: never in the hero, never on paragraphs, never on a demo root', () => {
  for (const f of ['index.html', 'en/index.html', 'launch-technik/index.html', 'impressum/index.html', 'datenschutz/index.html']) {
    const h = read(f);
    const hero = h.slice(h.indexOf('<section class="hero'), h.indexOf('</section>', h.indexOf('<section class="hero')));
    if (h.includes('<section class="hero')) assert.ok(!/data-enter/.test(hero), `${f}: hero`);
    assert.ok(!/<p data-enter/.test(h), `${f}: paragraph`);
    assert.ok(!/class="(?:steps-wrap|pkgs-wrap|rl|vtabs|qcards)\b[^"]*"[^>]*data-enter/.test(h), `${f}: demo root`);
  }
  for (const f of ['impressum/index.html', 'datenschutz/index.html']) assert.ok(!/class="doc__head"[^>]*data-enter/.test(read(f)), `${f}: doc head`);
});
