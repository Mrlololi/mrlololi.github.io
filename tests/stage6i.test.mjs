// Stage 6i (docs/PROMPT_Stage6i_Springen_Faecher_2026-11-05.md): static checks. Scrolling without
// layout shifts and the fan entrance run in the browser (src/qa/stage6.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pages } from '../src/build.mjs';
import config from '../src/config.json' with { type: 'json' };
import de from '../src/content/de.mjs';
import en from '../src/content/en.mjs';

const all = pages(config, { live: {} });
const byFile = Object.fromEntries(all.map((p) => [p.file, p.html]));
const css = readFileSync(new URL('../assets/css/main.css', import.meta.url), 'utf8');
const js = (f) => readFileSync(new URL(`../assets/js/${f}`, import.meta.url), 'utf8');

test('1. nothing changes height near the video: slider range kept, no content-visibility, steady counter and bubble', () => {
  assert.match(css, /\.js \.ba__control \{ display: grid; visibility: hidden; \}/);
  assert.match(css, /\.js \.ba\.is-ready \.ba__control \{ visibility: visible; \}/);
  assert.ok(!/content-visibility:\s*auto/.test(css), 'no section is measured at a placeholder height');
  assert.match(css, /\.sig__n \{ display: inline-block; min-width: 2ch;/);
  assert.match(js('contact.js'), /contact__ghost/);
  assert.match(css, /\.contact__ghost \{ color: transparent; \}/);
  // The FAQ columns stand before faq.js: the panel is in the HTML, the grid comes from CSS.
  assert.match(byFile['index.html'], /<div class="faq__chat" aria-hidden="true"><\/div>/);
  assert.ok(!/\.faqbox\.is-chat/.test(css));
});

test('2. quote fan: stacked, then fanned out one after another (transforms only), again on every return', () => {
  assert.match(css, /\.qcards\.is-stacked \.qcard \{ transform: translate\(var\(--sx, 0\), var\(--sy, 0\)\) rotate\(var\(--st, 0deg\)\); transition: none; \}/);
  assert.match(css, /\.qcards\.is-fanning \.qcard \{ transition: transform 0\.6s var\(--ease-soft\) calc\(var\(--i, 0\) \* 0\.15s\); \}/);
  const s = js('sections.js');
  assert.match(s, /const FAN_MS = 600;\nconst FAN_STEP = 150;/);
  assert.match(s, /threshold: \[0, 0\.3\]/);
  assert.match(s, /box\.matches\(':focus-within'\)/);
  assert.match(s, /if \(!wide\.matches \|\| calm\(\)/);
});

test('3. FAQ categories: four groups plus «Alle», every question in exactly one, real buttons, hidden without JS', () => {
  for (const t of [de, en]) {
    const ids = t.s4.faq.cats.groups.flatMap(([, x]) => x).sort((a, b) => a - b);
    assert.deepEqual(ids, t.faq.items.map((_, i) => i));
  }
  assert.deepEqual(de.s4.faq.cats.groups.map(([n]) => n), ['Zusammenarbeit', 'Technik und Tools', 'Launch', 'Daten und Verträge']);
  assert.deepEqual(en.s4.faq.cats.groups.map(([n]) => n), ['Working together', 'Tech and tools', 'Launch', 'Data and contracts']);
  const h = byFile['index.html'];
  assert.match(h, /<div class="faq__cats" role="group" aria-label="Fragen nach Thema"><button class="chip faq__cat" type="button" data-cat="0" aria-pressed="true">Alle<\/button><button class="chip faq__cat" type="button" data-cat="1" aria-pressed="false">Zusammenarbeit<\/button>/);
  assert.match(h, /<details class="faq__item" id="faq-11" data-cat="3">\n<summary>Und wenn Sie krank sind\?<\/summary>/);
  assert.match(h, /<details class="faq__item" id="faq-10" data-cat="4">\n<summary>Gibt es einen Auftragsverarbeitungsvertrag\?/);
  assert.match(css, /html:not\(\.js\) \.faq__cats \{ display: none; \}/);
  assert.match(js('faq.js'), /if \(items\[k\]\.hidden\) filter\('0'\);/);
  assert.match(byFile['en/index.html'], /aria-label="Questions by topic"><button class="chip faq__cat" type="button" data-cat="0" aria-pressed="true">All<\/button>/);
});

test('3. one rounded focus ring on a question', () => {
  assert.match(css, /\.faq__item summary:focus-visible \{ outline: none; \}/);
  assert.match(css, /\.faq__item:has\(> summary:focus-visible\) \{ outline: 3px solid var\(--ink\); outline-offset: -1px; \}/);
});
