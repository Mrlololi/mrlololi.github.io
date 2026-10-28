// Identity 21.10.2026: logo system, favicon set, tagline, mascots.
// The last two tests drive Chromium (reduced motion, off-screen pause); see also src/qa/identity.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { pages } from '../src/build.mjs';
import config from '../src/config.json' with { type: 'json' };

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = (p) => path.join(root, p);
const all = pages(config);
const html = (f) => all.find((p) => p.file === f).html;
const de = html('index.html');
const en = html('en/index.html');
const others = all.filter((p) => !['index.html', 'en/index.html'].includes(p.file));
const css = readFileSync(file('assets/css/main.css'), 'utf8');

const BRAND = ['icon.svg', 'icon-16.svg', 'logo-header.svg', 'logo-full-de.svg', 'logo-full-en.svg', 'logo-dark-de.svg', 'logo-dark-en.svg', 'favicon.svg', 'favicon.ico', 'apple-touch-icon.png'];

test('brand files exist in assets/brand; the old check-mark icons are gone', () => {
  for (const f of BRAND) assert.ok(existsSync(file(`assets/brand/${f}`)), f);
  assert.ok(!existsSync(file('assets/icons')));
  assert.deepEqual(readFileSync(file('favicon.ico')), readFileSync(file('assets/brand/favicon.ico')), 'root favicon.ico is the brand one');
});

test('favicon.ico holds 16, 32 and 48 px; the touch icon is 180 x 180', () => {
  const ico = readFileSync(file('assets/brand/favicon.ico'));
  const count = ico.readUInt16LE(4);
  assert.deepEqual([...Array(count)].map((_, i) => ico.readUInt8(6 + 16 * i)), [16, 32, 48]);
  const png = readFileSync(file('assets/brand/apple-touch-icon.png'));
  assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [180, 180]);
});

test('every page links the new favicon set', () => {
  for (const { file: f, html: h } of all) {
    assert.ok(h.includes('<link rel="icon" href="/assets/brand/favicon.ico" sizes="16x16 32x32 48x48">'), f);
    assert.ok(h.includes('<link rel="icon" href="/assets/brand/favicon.svg" type="image/svg+xml">'), f);
    assert.ok(h.includes('<link rel="apple-touch-icon" href="/assets/brand/apple-touch-icon.png">'), f);
    assert.ok(!h.includes('/assets/icons/'), f);
  }
  const manifest = JSON.parse(readFileSync(file('site.webmanifest'), 'utf8'));
  assert.ok(manifest.icons.every((i) => i.src.startsWith('/assets/brand/')));
});

test('icon: three solid circles in a row, blue last (on top), no transparency', () => {
  for (const f of ['icon.svg', 'icon-16.svg', 'favicon.svg']) {
    const s = readFileSync(file(`assets/brand/${f}`), 'utf8');
    const circles = [...s.matchAll(/<circle cx="(\d+)" cy="(\d+)" r="(\d+)" fill="(#\w+)"/g)].map((m) => [+m[1], +m[2], m[4]]);
    assert.deepEqual(circles.map((c) => c[2]), ['#F4C9D3', '#CFE3C2', '#BFD8EE'], f);
    assert.ok(circles.every((c) => c[1] === 32), `${f}: one horizontal chain, never a triangle`);
    assert.ok(!/opacity/.test(s), f);
  }
  assert.match(readFileSync(file('assets/brand/icon.svg'), 'utf8'), /stroke-width="3"><circle cx="20" cy="32" r="13"/);
  assert.match(readFileSync(file('assets/brand/icon-16.svg'), 'utf8'), /stroke-width="5"><circle cx="18" cy="32" r="14"/);
});

test('logo files are outlines: no <text>, no font reference; the word is one colour', () => {
  for (const f of BRAND.filter((x) => x.startsWith('logo-'))) {
    const s = readFileSync(file(`assets/brand/${f}`), 'utf8');
    assert.ok(!/<text|font-family|@font-face|googleapis/.test(s), f);
    assert.match(s, /<title>mrlololi/, f);
    // The i-dot: a pistachio ball with a ring.
    assert.match(s, /<circle cx="\d+" cy="-720" r="120" fill="#CFE3C2" stroke="#(2B2A33|FFFFFF)" stroke-width="60"\/>/, f);
  }
  assert.match(readFileSync(file('assets/brand/logo-dark-de.svg'), 'utf8'), /<rect [^>]*fill="#2B2A33"\/>/);
});

test('header lockup (outlined SVG) on every page, footer dark lockup only on the home pages', () => {
  for (const { file: f, html: h } of all) {
    const a = h.match(/<a class="wordmark" href="\/(en\/)?">([\s\S]*?)<\/a>/);
    assert.ok(a, f);
    assert.match(a[2], /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="[^"]+" aria-hidden="true" focusable="false" class="logo">/, f);
    assert.ok(!a[2].includes('<text'), `${f}: renders without a web font`);
    assert.match(a[2], /<span class="sr-only">mrlololi (Iva Tsatskrialashvili, Startseite|Iva Tsatskrialashvili, home)<\/span>$/, f);
  }
  for (const h of [de, en]) {
    assert.match(h, /<div class="site-footer__brand">\n<div class="brand-lockup"><svg [^>]*class="brand-lockup__icon">/);
    // The footer word reuses the header's outlines (no second copy of the letters).
    assert.match(h, /<g fill="#2B2A33"><path id="mrl-word" d="M/);
    assert.match(h, /class="brand-lockup__word"><use href="#mrl-word" fill="#FFFFFF"\/>/);
    assert.match(h, /<span class="footer-mascots" aria-hidden="true">(<svg [^>]*class="mascot mascot--on-dark"[^>]*data-emo="wave"|<svg viewBox="-8 -8 120 124" data-mascot="0" data-emo="wave")/);
  }
  for (const { file: f, html: h } of others) {
    assert.ok(!h.includes('<div class="site-footer__brand">') && !/<(svg|span|button)[^>]*class="mascot/.test(h), `${f}: no footer lockup, no mascots`);
  }
});

test('tagline: Lo / Lö / Li (DE) and Lo / Lo / Li (EN) coloured, the rest ink', () => {
  assert.ok(de.includes('<p class="tagline tagline--dark"><span class="tl-pink">Lo</span>gik, <span class="tl-blue">Lö</span>sung, <span class="tl-pist">Li</span>ve.</p>'));
  assert.ok(en.includes('<p class="tagline tagline--dark"><span class="tl-pink">Lo</span>gic, <span class="tl-blue">Lo</span>op, <span class="tl-pist">Li</span>ve.</p>'));
  assert.match(css, /\.tl-pink \{ color: var\(--pink-ink\); \}/);
  assert.match(css, /\.tagline--dark \.tl-pist \{ color: var\(--pist\); \}/);
  assert.match(css, /\.tagline \{[^}]*font-family: var\(--font-accent\); font-style: italic;/);
  // The outlined taglines in the large lockups carry the same colours.
  const full = readFileSync(file('assets/brand/logo-full-de.svg'), 'utf8');
  assert.deepEqual([...new Set([...full.matchAll(/<path fill="(#\w+)"/g)].map((m) => m[1]))], ['#2B2A33', '#9C3F58', '#2F6A9E', '#3F6B31']);
  const dark = readFileSync(file('assets/brand/logo-dark-en.svg'), 'utf8');
  assert.deepEqual([...new Set([...dark.matchAll(/<path fill="(#\w+)"/g)].map((m) => m[1]))], ['#FFFFFF', '#F4C9D3', '#BFD8EE', '#CFE3C2']);
});

test('hero: Logik at Formular, Lösung at ActiveCampaign, Live at Kurs offen, as labelled buttons', () => {
  const btns = [...de.matchAll(/<span class="mascot-spot mascot-spot--(\w+)" data-node="(\d)" data-scene="hero"><svg viewBox="-8 -8 120 124" data-mascot="\d" data-emo="(\w+)" class="mascot" data-base="\3" aria-hidden="true" focusable="false">[\s\S]*?<\/svg><button class="mascot-btn" type="button" aria-label="([^"]+)"><\/button><\/span>/g)]
    .map((m) => [m[1], m[2], m[4]]);
  // Like the node buttons: without JS there is no button that could do nothing.
  assert.match(css, /html:not\(\.js\) \.mascot-btn \{ display: none; \}/);
  assert.deepEqual(btns, [['logik', '1', 'Logik springt'], ['loesung', '2', 'Lösung springt'], ['live', '4', 'Live springt']]);
  assert.match(en, /aria-label="Lösung jumps"/);
  for (const part of ['shadow', 'rig', 'legs', 'body', 'belly', 'eyes', 'mouth', 'accessory', 'arms']) assert.ok(de.includes(`data-part="${part}"`), part);
  // Logik wears the glasses, Lösung holds the wrench, Live has the peach star.
  assert.match(de, /data-mascot="0"[\s\S]*?<g class="m-glasses"/);
  assert.match(de, /data-mascot="1"[\s\S]*?<rect x="-2.4" y="-18" width="4.8" height="22" rx="2.4"\/>/);
  assert.match(de, /data-mascot="2"[\s\S]*?fill="#F7DCC8"/);
});

test('mascots v2: hexagon, ball, teardrop; two-tone belly clipped to the body; glasses in every emotion', async () => {
  const { MASCOTS, EMOTIONS, mascotSvg } = await import('../assets/js/mascot-art.js');
  assert.deepEqual(MASCOTS.map((m) => [m.fill, m.belly]), [['#F4C9D3', '#FBE6EC'], ['#BFD8EE', '#E4F0FA'], ['#CFE3C2', '#EAF4E3']]);
  for (const [i] of MASCOTS.entries()) {
    for (const e of EMOTIONS) {
      const s = mascotSvg(i, e);
      const id = s.match(/<clipPath id="([\w-]+)">/)[1];
      assert.match(s, new RegExp(`<g data-part="belly"><ellipse clip-path="url\\(#${id}\\)"`), `${i} ${e}`);
      if (i === 0) assert.ok(s.includes('class="m-glasses"'), `Logik ${e}: glasses`);
      if (e === 'wave') assert.match(s, /<g class="m-wave" data-origin="[\d.]+ [\d.]+">/);
    }
  }
  // Every SVG gets its own clipPath id (hero, footer and the Stage 4 scenes on one page).
  const ids = [...de.matchAll(/<clipPath id="([\w-]+)">/g)].map((m) => m[1]);
  assert.ok(ids.length > 6);
  assert.equal(new Set(ids).size, ids.length);
});

test('mascot weight: three SVGs plus the mascot JS stay within 15 KB gzip; no Lottie, Rive or three.js', () => {
  const svgs = [...de.matchAll(/<span class="mascot-spot[\s\S]*?<\/button><\/span>/g)].map((m) => m[0]).join('');
  assert.equal((svgs.match(/<svg /g) || []).length, 3);
  const js = ['mascot-art.js', 'mascots.js'].map((f) => readFileSync(file(`assets/js/${f}`), 'utf8')).join('');
  const kb = gzipSync(svgs + js, { level: 9 }).length / 1024;
  assert.ok(kb <= 15, `${kb.toFixed(1)} KB`);
  const vendor = readdirSync(file('assets/vendor'));
  assert.ok(!vendor.some((f) => /lottie|rive|three/i.test(f)), vendor.join(', '));
  assert.ok(!/MotionPathPlugin/.test(de), 'MotionPath only where it is used (not yet)');
});

// ---------- in the browser ----------
async function withPage(opts, fn) {
  const { chromium } = await import('../src/qa/browsers.mjs');
  const { startServer } = await import('../src/qa/serve.mjs');
  const server = await startServer({ root });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, ...opts });
    await page.goto(`${server.url}/`, { waitUntil: 'load' });
    await fn(page);
  } finally {
    await browser.close();
    await server.close();
  }
}
// Transforms of every mascot part GSAP or WAAPI could move.
const SNAP = () => [...document.querySelectorAll('.mascot')].map((s) => [s, s.querySelector('[data-part="rig"]'), s.querySelector('[data-part="eyes"]'), s.querySelector('.m-wave')]
  .filter(Boolean).map((el) => `${getComputedStyle(el).transform}|${el.getAttribute('transform') || ''}|${el.style.transform}`).join(';')).join('\n');

test('reduced motion: mascots stay still in their pose; a click only swaps the face', { timeout: 60000 }, async () => {
  await withPage({ reducedMotion: 'reduce' }, async (page) => {
    await page.waitForTimeout(2500); // main.js, mascots.js and (would-be) GSAP have had their chance
    const a = await page.evaluate(SNAP);
    await page.waitForTimeout(1200);
    assert.equal(await page.evaluate(SNAP), a, 'nothing moved');
    assert.equal(await page.evaluate(() => document.querySelectorAll('.mascot[data-moving="true"]').length), 0);
    const after = await page.evaluate(async () => {
      const spot = document.querySelector('.mascot-spot--live');
      spot.querySelector('.mascot-btn').click();
      await new Promise((r) => setTimeout(r, 50));
      const svg = spot.querySelector('.mascot');
      return { emo: svg.dataset.emo, anims: svg.getAnimations({ subtree: true }).length };
    });
    assert.deepEqual(after, { emo: 'joy', anims: 0 });
  });
});

test('motion: hero mascots bob while on screen and pause off-screen; the footer waves once in view', { timeout: 60000 }, async () => {
  await withPage({}, async (page) => {
    await page.waitForFunction(() => document.querySelectorAll('.mascot-spot .mascot[data-moving="true"]').length === 3, null, { timeout: 15000 });
    const a = await page.evaluate(SNAP);
    await page.waitForTimeout(300);
    assert.notEqual(await page.evaluate(SNAP), a, 'they move on screen');
    await page.evaluate(() => document.querySelector('#pricing').scrollIntoView());
    await page.waitForFunction(() => document.querySelectorAll('.mascot[data-moving="true"]').length === 0, null, { timeout: 5000 });
    await page.waitForTimeout(600); // a blink or the eyes' way back may still be finishing
    const b = await page.evaluate(SNAP);
    await page.waitForTimeout(500);
    assert.equal(await page.evaluate(SNAP), b, 'paused off-screen');
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
    await page.waitForFunction(() => document.querySelectorAll('.footer-mascots .mascot[data-moving="true"]').length === 3, null, { timeout: 5000 });
    // Three waves, then rest (no endless motion in the footer).
    await page.waitForFunction(() => document.querySelectorAll('.footer-mascots .mascot[data-moving="true"]').length === 0, null, { timeout: 5000 });
  });
});
