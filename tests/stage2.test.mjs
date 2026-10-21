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

test('hero: proof line under the buttons', () => {
  assert.match(de, /<p class="hero__proof">Seit 2023 für Kursanbieter und Onlineshops in Deutschland, der Schweiz, Österreich und Italien · Gewerbe in Österreich<\/p>/);
  assert.match(en, /<p class="hero__proof">Since 2023 for course creators and online shops in Germany, Switzerland, Austria and Italy · Business registered in Austria<\/p>/);
});

test('hero: ribbon along two curves, started only by JS, with a pause button', () => {
  const svgs = de.match(/<svg class="ribbon[^"]*"[\s\S]*?<\/svg>/g);
  assert.equal(svgs.length, 2);
  for (const svg of svgs) assert.match(svg, /aria-hidden="true"/);
  const ribbon = svgs.join('');
  assert.equal(count(ribbon, /<textPath /g), 2);
  assert.equal(count(ribbon, /<animate attributeName="startOffset"[^>]*begin="indefinite"/g), 2);
  assert.ok(ribbon.includes('Anmeldung eingegangen · E-Mail bestätigt · Tag gesetzt · Zahlung erhalten · Zugang frei · Willkommens-Mail angekommen ·'));
  assert.match(de, /<button class="loop-btn" type="button" hidden data-pause="Animation anhalten" data-play="Animation fortsetzen">Animation anhalten<\/button>/);
});

test('tool marquee: ten text pills, one aria-hidden copy, never «Partner»', () => {
  const tools = ['ActiveCampaign', 'Zapier', 'Make', 'Leadpages', 'Stripe', 'Quaderno', 'Somba', 'WordPress', 'Wix', 'Google Apps Script'];
  const sec = de.match(/<section class="tools"[\s\S]*?<\/section>/)[0];
  assert.match(sec, /<p class="tools__label" id="tools-title">Ich arbeite mit<\/p>/);
  const lists = sec.match(/<ul class="marquee__list"[^>]*>[\s\S]*?<\/ul>/g);
  assert.equal(lists.length, 2);
  assert.deepEqual([...lists[0].matchAll(/<li>([^<]+)<\/li>/g)].map((m) => m[1]), tools);
  assert.match(lists[1], /aria-hidden="true"/);
  assert.ok(!lists[0].includes('aria-hidden'));
  assert.ok(de.indexOf('class="hero"') < de.indexOf('class="tools"') && de.indexOf('class="tools"') < de.indexOf('id="problems"'));
  for (const html of [de, en]) assert.ok(!/Partner/.test(body(html)));
});

test('problems: before/after slider above the cards, keyboard ready, with a text alternative', () => {
  const fig = de.match(/<figure class="ba">[\s\S]*?<\/figure>/)[0];
  assert.ok(de.indexOf('class="ba"') > de.indexOf('id="problems-title"') && de.indexOf('class="ba"') < de.indexOf('class="pcs"'));
  assert.match(fig, /<label class="ba__control"><span>Vorher \/ Nachher ziehen<\/span><input class="ba__range" type="range" min="0" max="100" step="1" value="50"><\/label>/);
  assert.match(fig, /<span class="ba__tag ba__tag--before">Chaos<\/span>/);
  assert.match(fig, /<span class="ba__tag ba__tag--after">Geordnet<\/span>/);
  assert.equal(count(fig, /<svg class="ba__svg"[^>]*aria-hidden="true"/g), 2);
  assert.match(fig, /<figcaption class="sr-only">Vorher: Formular, ActiveCampaign, Zapier, Stripe und Kurs kreuz und quer verbunden, drei Verbindungen gerissen\. Nachher: dieselben Werkzeuge in einem klaren Ablauf\.<\/figcaption>/);
  assert.match(en, /<span>Drag before \/ after<\/span>/);
  assert.match(en, /<span class="ba__tag ba__tag--after">Sorted<\/span>/);
});

test('3-step story: three panels with titles, the run log as step 2, toasts in step 3, example labels', () => {
  const sec = de.match(/<section class="section signup"[\s\S]*?<\/section>\n<section class="section services"/)[0];
  const titles = ['Eine Anmeldung kommt herein', 'Die Automation läuft', 'Ihre Teilnehmerin ist drin'];
  assert.deepEqual([...sec.matchAll(/<li class="story__step"><span class="story__n" aria-hidden="true">\d<\/span>([^<]+)<\/li>/g)].map((m) => m[1]), titles);
  assert.deepEqual([...sec.matchAll(/<h3 class="story__title">([^<]+)<\/h3>/g)].map((m) => m[1]), titles);
  assert.equal(count(sec, /<div class="story__panel" id="story-panel-\d"/g), 3);
  const p2 = sec.match(/id="story-panel-2"[\s\S]*?(?=<div class="story__panel" id="story-panel-3")/)[0];
  assert.match(p2, /<figure class="run instrument"/);
  assert.match(p2, /<span class="demo-tag">Beispiel-Durchlauf<\/span>/);
  assert.match(sec, /<dd class="story__value">anna@example\.com<\/dd>/);
  assert.match(sec, /Willkommen im Kurs, Anna!/);
  const toasts = [...sec.matchAll(/<li class="toast">([^<]+)<\/li>/g)].map((m) => m[1]);
  assert.deepEqual(toasts, ['Neue Anmeldung: Anna K.', 'Zahlung erhalten: 297 €', 'Kurszugang freigeschaltet', 'Willkommens-Mail zugestellt']);
  assert.ok(count(sec, /<span class="demo-tag">Beispiel<\/span>/g) >= 2);
  assert.match(en, /<li class="toast">Payment received: €297<\/li>/);
  assert.match(en, /<span class="demo-tag">Example run<\/span>/);
});
