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

test('KI block: inbox to draft with marks, chips, pill, tone panels, note, after the KI item', () => {
  const ki = de.match(/<section class="kidemo"[\s\S]*?<\/section>/)[0];
  assert.ok(de.indexOf('KI im Kundenservice') < de.indexOf('class="kidemo"') && de.indexOf('class="kidemo"') < de.indexOf('id="ki-rechner"'));
  assert.match(ki, /<h3 class="kidemo__title" id="kidemo-title">Vom verärgerten Mail zum fertigen <em class="accent">Entwurf<\/em><\/h3>/);
  assert.equal(ki.match(/<p class="kidemo__text">([\s\S]*?)<\/p>/)[1].replace(/<[^>]+>/g, ''), 'hallo ich hab den kurs gekauft aber kein login bekommen??? und die rechnung fehlt auch. echt ärgerlich, brauche das bis morgen!!');
  assert.deepEqual([...ki.matchAll(/<mark class="hl hl--\d">([^<]+)<\/mark>/g)].map((m) => m[1]), ['kein login bekommen', 'die rechnung fehlt', 'echt ärgerlich', 'bis morgen']);
  assert.deepEqual([...ki.matchAll(/<li class="chip chip--\d">([^<]+)<\/li>/g)].map((m) => m[1]), ['Thema: Login', 'Rechnung fehlt', 'Stimmung: verärgert', 'dringend']);
  assert.match(ki, /Entwurf wird erstellt…/);
  assert.deepEqual([...ki.matchAll(/<p class="tone__label">([^<]+)<\/p>/g)].map((m) => m[1]), ['Sie', 'du', 'locker']);
  assert.match(ki, /Liebe Anna, danke für Ihre Nachricht und entschuldigen Sie den Ärger\. Ihren Zugang habe ich neu verschickt, die Rechnung finden Sie im Anhang\. Bei Fragen bin ich gern da\./);
  assert.match(ki, /Hi Anna! Sorry für das Chaos\. Zugang ist neu unterwegs, Rechnung hängt dran\. Schreib einfach, wenn noch was fehlt\./);
  assert.match(ki, /<div class="kidemo__actions" aria-hidden="true"><span class="fake-btn fake-btn--primary">Freigeben<\/span><span class="fake-btn">Bearbeiten<\/span><\/div>/);
  assert.match(ki, /Versendet wird erst nach Freigabe durch Ihr Team\./);
  assert.match(ki, /<p class="kidemo__caption">Die Entwürfe klingen wie Ihre Schule\.<\/p>/);
  assert.match(ki, /<button class="kidemo__replay" type="button" hidden>Nochmal<\/button>/);
  assert.match(en, /<p class="tone__label">Casual<\/p>/);
});

test('KI block: 6 minutes vs 1 minute cards next to the calculator, example values, pause button', () => {
  const speed = de.match(/<div class="speed">[\s\S]*?<button class="loop-btn"/)[0];
  assert.match(speed, /<span class="demo-tag">Beispielwerte<\/span>/);
  assert.match(speed, /<p class="speed__title">Von Hand: ca\. 6 Minuten pro Antwort<\/p>/);
  assert.match(speed, /<p class="speed__title">Mit Entwurf: ca\. 1 Minute zum Prüfen<\/p>/);
  assert.equal(count(speed, /<p class="speed__text" aria-hidden="true">/g), 2);
  assert.ok(de.indexOf('id="ki-rechner"') < de.indexOf('class="speed"'));
});

test('package finder: mapping from the brief for every answer', async () => {
  const { pickPackage } = await import('../assets/js/finder.js');
  const expect = { broken: { yes: 'quick', no: 'check' }, launch: { yes: 'launch', no: 'check' }, website: { yes: 'website', no: 'check' }, inbox: { yes: 'ki', no: 'check' } };
  for (const [q1, byQ2] of Object.entries(expect)) {
    for (const [q2, pkg] of Object.entries(byQ2)) assert.equal(pickPackage(q1, q2), pkg, `${q1} + ${q2}`);
  }
});

test('package finder: after the prices, static list without JS, questions ready for JS, packages addressable', () => {
  const sec = de.match(/<section class="section finder"[\s\S]*?<\/section>/)[0];
  assert.ok(de.indexOf('id="services"') < de.indexOf('id="finder"') && de.indexOf('id="finder"') < de.indexOf('id="process"'));
  assert.match(sec, /<h2 id="finder-title">Welches Paket <em class="accent">passt\?<\/em><\/h2>/);
  const links = [...sec.matchAll(/<li><a href="#pkg-(\w+)">[^<]+<strong>([^<]+)<\/strong><\/a><\/li>/g)].map((m) => [m[1], m[2]]);
  assert.deepEqual(links, [['quick', 'Quick-Fix'], ['check', 'Technik-Check'], ['launch', 'Launch-Setup'], ['website', 'Website als One-Pager'], ['ki', 'KI im Kundenservice']]);
  for (const id of ['quick', 'check', 'launch', 'website', 'ki']) assert.match(de, new RegExp(`<li class="item" id="pkg-${id}">`));
  assert.match(sec, /<div class="finder__app" hidden>/);
  assert.deepEqual([...sec.matchAll(/<legend>([^<]+)<\/legend>/g)].map((m) => m[1]), ['Worum geht es?', 'Wissen Sie, wo das Problem liegt?', 'Wann?']);
  assert.equal(count(sec, /<button class="finder__opt" type="button" data-value="\w+" aria-pressed="false">/g), 8);
  assert.match(en, /<legend>Do you know where the problem is\?<\/legend>/);
});

test('Zusage under the prices, never «Garantie»', () => {
  assert.match(de, /<p class="tariff__promise small">Meine Zusage: Läuft eine von mir gebaute Strecke in den ersten 30 Tagen nicht wie vereinbart, behebe ich das ohne Berechnung\. Das gilt für meine Arbeit, nicht für Ausfälle der Tools selbst\.<\/p>/);
  assert.match(en, /<p class="tariff__promise small">My promise: if a flow I built does not work as agreed within the first 30 days, I fix it free of charge\./);
  for (const html of [de, en]) assert.ok(!/Garantie|guarantee/i.test(body(html)));
});

test('references: the three quotes as pastel cards', () => {
  const refs = de.match(/<section class="section refs"[\s\S]*?<\/section>/)[0];
  const cards = [...refs.matchAll(/<li class="qcard qcard--(\w+)">/g)].map((m) => m[1]);
  assert.deepEqual(cards, ['pink', 'blue', 'pist']);
  assert.equal(count(refs, /<figure class="quote/g), 3);
  assert.ok(!/<article class="case[^"]*">[\s\S]*?<figure class="quote[\s\S]*?<\/article>/.test(refs), 'quotes left the case cards');
});

test('case study stays hidden until Iva sends real numbers (config.case_study)', () => {
  assert.equal(config.case_study, null);
  assert.ok(!de.includes('class="study"'));
  const withStudy = pages({ ...config, case_study: { before: 'Vorher-Text', after: 'Nachher-Text', tiles: [{ value: '12', label: 'Test' }] } }, { buildDate: new Date('2026-10-21T12:00:00Z') });
  const html = withStudy.find((p) => p.file === 'index.html').html;
  assert.match(html, /<article class="study"[\s\S]*Fallbeispiel: Online-Kursanbieterin[\s\S]*Vorher-Text[\s\S]*Nachher-Text[\s\S]*<span class="study__value">12<\/span>/);
});

test('«Was ich nicht mache» right before the FAQ', () => {
  assert.match(de, /<p class="notdo__text"><strong>Was ich nicht mache:<\/strong> Werbetexte schreiben, Ads schalten oder Ihren Kundensupport übernehmen\. Dafür empfehle ich Ihnen gern Kolleg:innen\.<\/p>/);
  assert.ok(de.indexOf('class="notdo__text"') < de.indexOf('id="faq"') && de.indexOf('class="notdo__text"') > de.indexOf('id="about"'));
  assert.match(en, /<strong>What I don't do:<\/strong> write ad copy, run ads or take over your customer support\./);
});

test('FAQ chat: still seven details, chat texts for the script', () => {
  assert.equal(count(de, /<details class="faq__item">/g), 7);
  assert.match(de, /<div class="faq__list" data-typing="tippt…" data-photo="\/assets\/img\/avatar-88\.webp">/);
  assert.match(en, /data-typing="typing…"/);
});

test('final touches (21.10.2026): hello@ address everywhere, path line «DACH-Vertrieb ab 2020», image files exist', () => {
  for (const p of all) assert.ok(!p.html.includes('ivikosha@gmail.com'), p.file);
  const imp = all.find((p) => p.file === 'impressum/index.html').html;
  const dsg = all.find((p) => p.file === 'datenschutz/index.html').html;
  assert.match(imp, /hello@mrlololi\.com/);
  assert.match(dsg, /hello@mrlololi\.com/);
  assert.match(de, /<li class="path__stop">DACH-Vertrieb ab 2020<\/li>/);
  assert.match(en, /<li class="path__stop">DACH sales since 2020<\/li>/);
  for (const f of ['about-340', 'about-680', 'avatar-44', 'avatar-88']) {
    for (const ext of ['avif', 'webp', 'jpg']) assert.ok(existsSync(new URL(`../assets/img/${f}.${ext}`, import.meta.url)), `${f}.${ext}`);
  }
});
