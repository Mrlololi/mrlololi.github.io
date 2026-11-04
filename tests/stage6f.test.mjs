// Stage 6f (docs/PROMPT_Stage6f_Svod_2026-11-04.md): static checks. Behaviour (?paket=, the submit
// guard, the payload with termin, the run-log tab, one demo at a time, the global pause, the timeline
// on phones, no shift from the pause buttons) runs in the browser (src/qa/stage6.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pages, sitemap } from '../src/build.mjs';
import config from '../src/config.json' with { type: 'json' };
import de from '../src/content/de.mjs';
import en from '../src/content/en.mjs';

const all = pages(config, { live: {} });
const byFile = Object.fromEntries(all.map((p) => [p.file, p.html]));
const deHome = byFile['index.html'];
const enHome = byFile['en/index.html'];
const js = (f) => readFileSync(new URL(`../assets/js/${f}`, import.meta.url), 'utf8');
const css = readFileSync(new URL('../assets/css/main.css', import.meta.url), 'utf8');
const text = (h) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<template[\s\S]*?<\/template>/g, '').replace(/<[^>]+>/g, ' ');

test('1. Somba is gone everywhere (content, pages, tests, scripts)', () => {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const hits = [];
  const walk = (d) => {
    for (const n of readdirSync(d)) {
      if (['node_modules', '.git', 'stage6f.test.mjs'].includes(n)) continue;
      const p = path.join(d, n);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(mjs|js|json|html|css|md|xml|txt)$/.test(n) && /somba/i.test(readFileSync(p, 'utf8'))) hits.push(p);
    }
  };
  walk(root);
  assert.deepEqual(hits, []);
  assert.deepEqual(de.s4.contact.fields.via[1], ['Leadpages', 'WordPress', 'Wix', 'Digistore24', 'CopeCart', 'ablefy', 'Kajabi', 'Memberspot', 'Skool', 'eine eigene Website', 'ein anderes Tool', 'noch offen']);
  assert.ok(de.faq.items.some((x) => x.q === 'Ich nutze ein anderes Tool. Geht das?' && x.a.includes('z. B. Digistore24, CopeCart, ablefy, Kajabi oder Memberspot')));
  assert.ok(de.faq.items.some((x) => x.q === 'Mein Setup ist schon da, aber unübersichtlich. Räumen Sie auch auf?'));
  assert.ok(!/Circle|Skool/.test(JSON.stringify(de.s6.pricing.cards) + JSON.stringify(de.pricing.groups)), 'no platform names in the package bullets');
});

test('2. honesty: trust line, no Italy, no «hunderte», «oft», no seconds claim, footer without «Werbeagentur»', () => {
  assert.equal(de.hero.trust, 'Aus Graz, remote im DACH-Raum · Online-Marketing seit 2023 · Gewerbe in Österreich');
  assert.equal(en.hero.trust, 'From Graz, working remotely · Online marketing since 2023 · Registered business in Austria');
  for (const [h, gone] of [[deHome, /Italien|hunderte|meistens|immer wieder|2,3 Sekunden|Neu:|Werbeagentur/], [enHome, /Italy|hundreds|usually|again and again|2\.3 seconds|Advertising agency|DACH/]]) {
    const m = text(h).match(gone);
    assert.ok(!m, m && m[0]);
  }
  assert.match(deHome, /Wo es bei Launches <em class="accent">oft hakt<\/em>/);
  assert.equal(de.run.summary, '6 Schritte, 0 Fehler (vereinfachtes Beispiel)');
  assert.match(byFile['website-one-pager/index.html'], /Impressum- und Datenschutzseite angelegt und eingebunden \(Texte von Ihnen\)/);
  assert.match(byFile['impressum/index.html'], /Werbeagentur/, '«Werbeagentur» stays in the Impressum');
});

test('2. KI drafts never claim an action as done; no placeholder brackets', async () => {
  const { KI_EXAMPLES } = await import('../src/content/ki-examples.mjs');
  const drafts = JSON.stringify(Object.values(KI_EXAMPLES).flat().map((x) => x.drafts)) + JSON.stringify(de.s4.projects.chat) + JSON.stringify(en.s4.projects.chat);
  assert.ok(!/habe ich (Ihnen |dir )?(neu )?(verschickt|geschickt)|I have (re)?sent|I've resent|im Anhang|is attached|\[[A-Za-z-]+\]/.test(drafts));
  assert.match(de.s4.projects.chat.a, /schicke ich Ihnen gleich neu/);
});

test('3. «Anfragen» links to /?paket=<id>#contact everywhere; no package mailto left', () => {
  for (const [f, h] of Object.entries(byFile)) {
    assert.ok(!/class="[^"]*(item__cta|row__ask)[^"]*" href="mailto:/.test(h), f);
    assert.ok(!/href="mailto:[^"]*subject=Anfrage%3A/.test(h), `${f}: package mailto`);
  }
  for (const id of ['quick', 'check', 'launch', 'website', 'ki', 'support']) {
    assert.ok(deHome.includes(`href="/?paket=${id}#contact"`), id);
    assert.ok(enHome.includes(`href="/en/?paket=${id}#contact"`), id);
  }
  assert.match(deHome, /<label for="cf-paket">Mir geht es um<\/label><select class="field__select" id="cf-paket" name="paket"><option value="">Weiß ich noch nicht<\/option><option value="quick">Quick-Fix<\/option>/);
  assert.match(js('contact.js'), /new URLSearchParams\(location\.search\)\.get\('paket'\)/);
});

test('3. no-JS path: action to the hook, nojs and the hidden fields, a guard against early clicks', () => {
  for (const h of [deHome, byFile['launch-technik/index.html']]) {
    assert.match(h, /<form class="contact__form[^"]*" id="contact-form" action="https:\/\/hook\.eu1\.make\.com\/49mmc0uciouni5rlvys2vb6drzdhhlph" method="post" onsubmit="return window\.__cfReady===true"/);
    assert.match(h, /<input type="hidden" name="nojs" value="1">\n<input type="hidden" name="lang" value="de">\n<input type="hidden" name="page" value="https:\/\/mrlololi\.com\/[^"]*">/);
    assert.match(h, /name="consent" type="checkbox" value="true"/);
  }
  const c = js('contact.js');
  assert.match(c, /f\.querySelector\('input\[name="nojs"\]'\)\?\.remove\(\);/);
  assert.match(c, /window\.__cfReady = true;/);
  assert.match(c, /termin: f\.elements\.termin\.value\.trim\(\),/);
});

test('3. thank-you pages: noindex, not in the sitemap, Live and the way back', () => {
  for (const [f, h1, back] of [['danke/index.html', 'Danke für Ihre Anfrage!', 'href="/"'], ['en/thanks/index.html', 'Thank you for your request!', 'href="/en/"']]) {
    const h = byFile[f];
    assert.match(h, /<meta name="robots" content="noindex">/);
    assert.ok(h.includes(`<h1>${h1}</h1>`), f);
    assert.match(h, /data-scene="thanks-page"[\s\S]*data-base="joy"/);
    assert.ok(h.includes(`<a class="btn btn--primary" ${back}>`), f);
  }
  assert.ok(!/danke|thanks/.test(sitemap(config)));
});

test('4. next step: CTA text, preferred time, «So kommt Ihre Anfrage bei mir an», the three steps', () => {
  assert.match(deHome, /<a class="btn btn--primary" href="#contact">Kostenloses Erstgespräch anfragen<\/a>/);
  assert.match(enHome, /<a class="btn btn--primary" href="#contact">Request a free call<\/a>/);
  assert.match(deHome, /<label for="cf-termin">Wann passt es Ihnen am besten\? \(optional\)<\/label><input id="cf-termin" name="termin" type="text" maxlength="160" autocomplete="off" placeholder="z\. B\. vormittags, Di oder Do">/);
  assert.match(deHome, /<p class="brief__preview-title">So kommt Ihre Anfrage bei mir an<\/p>/);
  assert.ok(!/class="brief__meta"|<span>An:<\/span>/.test(deHome), 'no mail headers');
  assert.match(deHome, /<h3 class="contact__after-title">Was nach dem Klick passiert<\/h3>/);
  for (const s of de.s4.contact.after.steps) assert.ok(deHome.includes(s), s);
  assert.match(css, /section\[id\], h2\[id\], \.contact__form input/);
  assert.match(deHome, /<div class="contact__errsum" role="alert" tabindex="-1" hidden>/);
});

test('6. KI card: the full text reserves the height; equal picture heights; KI page: 2.5 s, 6 s, no rotation', () => {
  assert.match(deHome, /<span class="tchat__text"><span class="tchat__full">[^<]+<\/span><span class="tchat__typed">[^<]+<\/span><\/span>/);
  assert.match(css, /\.tchat__full, \.tchat__typed \{ grid-area: 1 \/ 1; \}/);
  assert.match(css, /\.row--viz \.viz \{ min-height: 7\.25rem; \}/);
  const k = js('kidemo.js');
  assert.match(k, /const READ = 2500;/);
  assert.match(k, /rest: 6000/);
  assert.ok(!/rounds\+\+/.test(k), 'no automatic rotation of the examples');
});

test('7. one conductor: icon pause buttons in place from the start, global «Bewegung pausieren»', () => {
  for (const h of [deHome, enHome]) assert.match(h, /<button class="motion-toggle btn btn--secondary btn--sm" type="button" hidden aria-pressed="false" data-pause-label="[^"]+" data-play-label="[^"]+">/);
  assert.match(css, /\.loopctl\[data-wait\] \{ visibility: hidden; \}/);
  assert.match(js('loops.js'), /try \{ localStorage\.setItem\('motion-paused'/);
  assert.match(js('main.js'), /initMotionToggle\(\);/);
});

test('8/9/10. chips, tools marquee, quotes, home order, four projects, transcript closed', () => {
  assert.match(css, /\.tools__in\[data-play="run"\] \.marquee:is\(:hover, :focus-within\) \.marquee__track \{ animation-play-state: paused; \}/);
  assert.match(css, /#000 3rem, #000 calc\(100% - 3rem\)/);
  assert.ok(!/class="qcards"[^>]*tabindex/.test(deHome), 'no needless tab stop');
  assert.ok(enHome.indexOf('He was also highly adaptable') < enHome.indexOf('Sehr gerne bestätige ich'), 'English quote first on EN');
  assert.ok(!/<p class="lead">Typische Stellen/.test(deHome), 'the problem intro repeating the H2 is gone');
  assert.ok(!/<details class="vid__text[^"]*" open/.test(deHome), 'transcript closed');
  assert.match(js('sections.js'), /once\(path, 0\.3,/);
});

test('11/12/13/14. Launch flow picture, EN audience line, 404 order, video and eyebrow', () => {
  assert.match(deHome, /<div class="viz viz--flow" aria-hidden="true"><ol class="flow4" role="list"><li class="flow4__n flow4__n--1"><span class="flow4__dot"><\/span><span class="flow4__name">Formular<\/span>/);
  assert.ok(!/class="viz viz--hub"/.test(deHome));
  assert.match(enHome, /For online course creators selling in Austria, Germany and Switzerland/);
  assert.match(enHome, /<p class="services__audience">Selling to German-speaking customers\? I set up double opt-in, German-language emails and your legal pages \(with your texts\)\.<\/p>/);
  assert.match(enHome, /AI in customer service \(in German\)/);
  assert.match(deHome, /<video class="vid__v vid__v--wide" controls playsinline muted preload="none" tabindex="-1"/);
  assert.match(css, /\.hero__eyebrow \{ color: #8E3650; \}/);
  assert.match(css, /\.nf-en \.nf__alt \{ order: -1; \}/);
});
