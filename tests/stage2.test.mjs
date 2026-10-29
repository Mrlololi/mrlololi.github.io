// Stage 2 (21.10.2026): accents, demos and trust blocks. Markup and copy only;
// behaviour (motion, keyboard, no JS, mobile) is checked in src/qa/demos.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { pages } from '../src/build.mjs';
import config from '../src/config.json' with { type: 'json' };
import { accent } from '../src/templates/util.mjs';

const all = pages(config, { buildDate: new Date('2026-10-21T12:00:00Z') });
const de = all.find((p) => p.file === 'index.html').html;
const en = all.find((p) => p.file === 'en/index.html').html;
const count = (html, re) => (html.match(re) || []).length;
// Page text without the inlined stylesheet and scripts.
const body = (html) => html.replace(/<style>[\s\S]*?<\/style>/, '').replace(/<script[\s\S]*?<\/script>/g, '');

test('accent: *x* becomes an italic serif em, everything escaped', () => {
  assert.equal(accent('Häufige *Fragen*'), 'Häufige <em class="accent">Fragen</em>');
  assert.equal(accent('a <b> *c & d*'), 'a &lt;b&gt; <em class="accent">c &amp; d</em>');
  assert.equal(accent('no accent'), 'no accent');
});

test('headings carry exactly one accent each', () => {
  assert.match(de, /<h1 id="hero-title">Die Technik hinter Ihrem <em class="accent">Kurs-Launch\.<\/em><\/h1>/);
  for (const id of ['problems-title', 'services-title', 'process-title', 'refs-title', 'about-title', 'faq-title', 'contact-title']) {
    for (const html of [de, en]) {
      const h = html.match(new RegExp(`<h2[^>]*id="${id}"[^>]*>([\\s\\S]*?)</h2>`))[1];
      assert.equal(count(h, /<em class="accent">/g), 1, id);
    }
  }
  assert.match(de, /Wo es bei Launches <em class="accent">meistens hakt<\/em>/);
  assert.match(de, /Erzählen Sie mir, <em class="accent">was hakt\.<\/em>/);
  assert.match(en, /Services and <em class="accent">pricing<\/em>/);
  for (const html of [de, en]) assert.ok(!/\*[^*\s<][^*<]*\*/.test(body(html)), 'no raw asterisks left');
});

test('EB Garamond italic is self-hosted; only the 500 (h1 accent) is preloaded', () => {
  for (const f of ['eb-garamond-italic-400.woff2', 'eb-garamond-italic-500.woff2']) {
    assert.ok(existsSync(new URL(`../assets/fonts/${f}`, import.meta.url)), f);
  }
  assert.equal(count(de, /<link rel="preload"[^>]*as="font"/g), 3);
  assert.ok(!de.includes('eb-garamond-italic-400.woff2" as="font"'));
  assert.match(de, /font-family:\s*"EB Garamond"/);
});

test('hero: proof line under the buttons', () => {
  assert.match(de, /<p class="hero__proof">Aus Graz, remote im DACH-Raum · Marketing-Automation seit 2023 · Gewerbe in Österreich<\/p>/);
  assert.match(en, /<p class="hero__proof">Based in Graz, working remotely · marketing automation since 2023 · business registered in Austria<\/p>/);
});

test('case study stays hidden until Iva sends real numbers (config.case_study)', () => {
  assert.equal(config.case_study, null);
  assert.ok(!de.includes('class="study"'));
  const withStudy = pages({ ...config, case_study: { before: 'Vorher-Text', after: 'Nachher-Text', tiles: [{ value: '12', label: 'Test' }] } }, { buildDate: new Date('2026-10-21T12:00:00Z') });
  const html = withStudy.find((p) => p.file === 'index.html').html;
  assert.match(html, /<article class="study"[\s\S]*Fallbeispiel: Online-Kursanbieterin[\s\S]*Vorher-Text[\s\S]*Nachher-Text[\s\S]*<span class="study__value">12<\/span>/);
});

test('final touches (21.10.2026): hello@ address everywhere, path line «DACH-Vertrieb ab 2020», image files exist', () => {
  for (const p of all) assert.ok(!p.html.includes('ivikosha@gmail.com'), p.file);
  const imp = all.find((p) => p.file === 'impressum/index.html').html;
  const dsg = all.find((p) => p.file === 'datenschutz/index.html').html;
  assert.match(imp, /hello@mrlololi\.com/);
  assert.match(dsg, /hello@mrlololi\.com/);
  assert.match(de, /<li class="path__stop"><span class="path__label">DACH-Vertrieb ab 2020<\/span>/);
  assert.match(en, /<li class="path__stop"><span class="path__label">DACH sales since 2020<\/span>/);
  for (const f of ['about-340', 'about-680', 'avatar-44', 'avatar-88']) {
    for (const ext of ['avif', 'webp', 'jpg']) assert.ok(existsSync(new URL(`../assets/img/${f}.${ext}`, import.meta.url)), `${f}.${ext}`);
  }
});
