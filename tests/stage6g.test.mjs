// Stage 6g (docs/PROMPT_Stage6g_Fotos_Fixes_2026-11-04.md): static checks. Rotation, overlaps and the
// mascot reactions run in the browser (src/qa/stage6.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import sharp from 'sharp';
import { pages } from '../src/build.mjs';
import config from '../src/config.json' with { type: 'json' };
import de from '../src/content/de.mjs';
import en from '../src/content/en.mjs';

const all = pages(config, { live: {} });
const byFile = Object.fromEntries(all.map((p) => [p.file, p.html]));
const deHome = byFile['index.html'];
const root = (f) => new URL(`../${f}`, import.meta.url);
const js = (f) => readFileSync(root(`assets/js/${f}`), 'utf8');

test('1a. photos (Iva 5.11): badge and contact from the Hallstatt lake portrait, «Über mich» unchanged, all with width/height', async () => {
  for (const [f, w, h] of [['avatar-44', 44, 44], ['avatar-88', 88, 88], ['avatar-128', 128, 128], ['about-340', 340, 425], ['about-680', 680, 850], ['contact-iva-340', 340, 456], ['contact-iva-573', 573, 768]]) {
    for (const ext of ['avif', 'webp', 'jpg']) assert.ok(existsSync(root(`assets/img/${f}.${ext}`)), `${f}.${ext}`);
    const m = await sharp(readFileSync(root(`assets/img/${f}.jpg`))).metadata();
    assert.deepEqual([m.width, m.height], [w, h], f);
  }
  assert.match(deHome, /<a class="hero__chip" href="#about"><picture><source type="image\/avif" srcset="\/assets\/img\/avatar-44\.avif 1x, \/assets\/img\/avatar-88\.avif 2x">/);
  assert.match(deHome, /<img src="\/assets\/img\/about-340\.jpg"[^>]*width="340" height="425"/);
  assert.ok(!deHome.includes('about__second'), 'no second photo in «Über mich»');
  assert.match(deHome, /<picture class="contact__iva">[\s\S]*?<img src="\/assets\/img\/contact-iva-340\.jpg" srcset="\/assets\/img\/contact-iva-340\.jpg 340w, \/assets\/img\/contact-iva-573\.jpg 573w" sizes="5\.5rem" width="340" height="456" loading="lazy" decoding="async" alt="Iva Tsatskrialashvili">/);
});

test('1a. OG cards and Person.image stay as they were', async () => {
  for (const f of ['og-image-de.png', 'og-image-en.png']) {
    const m = await sharp(readFileSync(root(f))).metadata();
    assert.deepEqual([m.width, m.height], [1200, 630], f);
  }
  assert.ok(!/iva-portrait/.test(readFileSync(root('src/templates/og.mjs'), 'utf8')));
  assert.match(deHome, /"image":"https:\/\/mrlololi\.com\/assets\/img\/about-680\.jpg"/);
});

test('2/6. one video element, chapters inside the transcript, controls only after the first play', () => {
  const h = deHome;
  assert.equal((h.match(/<video\b/g) || []).length, 1);
  assert.match(h, /data-media="\(orientation: portrait\) and \(max-width: 767px\)"/);
  assert.match(h, /<source media="\(orientation: portrait\) and \(max-width: 767px\)" type="image\/webp" srcset="\/assets\/video\/anmeldung-9x16\.webp"/);
  assert.ok(!/<ol class="vid__chapters"[^>]*>[\s\S]*?<\/ol>\n<details/.test(h), 'no chapter buttons under the video');
  const v = js('video.js');
  assert.match(v, /tall\.addEventListener\('change'/);
  assert.match(v, /v\.controls = true;/);
  const css = readFileSync(root('assets/css/main.css'), 'utf8');
  assert.match(css, /@media \(orientation: landscape\) and \(max-height: 600px\) \{\n  \.vid__frame \{ width: min\(100%, calc\(\(100svh - var\(--header-h\) - 24px\) \* 16 \/ 9\)\); \}/);
});

test('9. new video renders published, the old ones only local (_alt ignored)', () => {
  assert.match(readFileSync(root('.gitignore'), 'utf8'), /^_alt\/$/m);
  for (const f of ['anmeldung-16x9.mp4', 'anmeldung-9x16.mp4']) assert.ok(existsSync(root(`assets/video/${f}`)), f);
  assert.ok(!de.s6.video.lines.some((l) => /hunderte/.test(l)));
});

test('4. every mascot reacts: lines DE/EN, one group button each (mascots.js)', () => {
  for (const t of [de, en]) for (const k of ['logik', 'loesung', 'live']) assert.ok(t.brand.lines[k].length >= 3 && t.brand.lines[k].length <= 5, `${t.lang} ${k}`);
  for (const f of ['index.html', 'en/index.html', '404.html', 'danke/index.html', 'en/thanks/index.html']) assert.match(byFile[f], /<script type="application\/json" id="mascot-say">/, f);
  const m = js('mascots.js');
  assert.match(m, /const GROUPS = '\.mscene, \.footer-mascots, \.nf__scene';/);
  assert.match(m, /g\.setAttribute\('role', 'button'\);/);
  assert.match(m, /new MutationObserver/);
});

test('5. pause: no picture button, a tap on the picture, the global toggle with one state', () => {
  const l = js('loops.js');
  assert.match(l, /tap = false/);
  assert.match(l, /document\.addEventListener\('motion:change', label\);/);
  assert.ok(!/class="loopctl/.test(deHome));
});

test('7. project cards: readable details, updated texts', () => {
  for (const k of ['ki', 'langstarter', 'geoapp', 'kittycats']) assert.ok(existsSync(root(`src/images/project-${k}-detail.png`)), k);
  assert.equal(de.s6.projects.items.find((x) => x.key === 'langstarter').shows, '66 erste Sätze in 42 Sprachen, mit Gruppenmodus, Plakat und Beamer.');
  assert.ok(!/45 (Sätze|phrases)/.test(deHome + byFile['en/index.html']));
});

test('8. the hero chip keeps a rounded focus ring, no tap rectangle', () => {
  const css = readFileSync(root('assets/css/main.css'), 'utf8');
  assert.match(css, /\.hero__chip \{ -webkit-tap-highlight-color: transparent; border-radius: var\(--radius-pill\); \}/);
});
