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
  assert.match(de, /<h1 id="hero-title">Die Technik hinter Ihrem <span class="nowrap">Kurs-Launch\.<\/span> <em class="accent">Gebaut, getestet, betreut\.<\/em><\/h1>/);
  for (const id of ['problems-title', 'signup-title', 'services-title', 'process-title', 'refs-title', 'about-title', 'faq-title', 'contact-title']) {
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

test('EB Garamond italic is self-hosted and not preloaded', () => {
  for (const f of ['eb-garamond-italic-400.woff2', 'eb-garamond-italic-500.woff2']) {
    assert.ok(existsSync(new URL(`../assets/fonts/${f}`, import.meta.url)), f);
  }
  assert.equal(count(de, /<link rel="preload"[^>]*as="font"/g), 2);
  assert.match(de, /font-family:\s*"EB Garamond"/);
});
