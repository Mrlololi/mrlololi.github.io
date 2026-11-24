// Stage 6c/6d/6e (docs/PROMPT_Stage6c_Animationen, 6d_Zurueck, 6e_Rueckkehr): static checks. The
// behaviour (loops, pause, reveals, slider, run-log, FAQ typing, quote stack) is checked in the browser
// by src/qa/stage6.mjs (tests/stage6-browser.test.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pages } from '../src/build.mjs';
import config from '../src/config.json' with { type: 'json' };
import de from '../src/content/de.mjs';
import en from '../src/content/en.mjs';

const all = pages(config, { live: {} });
const byFile = Object.fromEntries(all.map((p) => [p.file, p.html]));
const deHome = byFile['index.html'];
const js = (f) => readFileSync(new URL(`../assets/js/${f}`, import.meta.url), 'utf8');

// Stage 6g (Iva 4.11.2026: «слишком много»): no pause button on the pictures; one global toggle in the
// header and the footer (WCAG 2.2.2), a tap on a picture pauses it; text controls only on the KI demo
// and the run-log.
test('pause: no button on the pictures, the global toggle in header and footer, text controls only on the two demos', () => {
  for (const sel of ['data-demo="hero"', 'data-demo="tools"', 'data-demo="prices"', 'data-demo="process"', 'data-demo="about"']) assert.ok(deHome.includes(sel), sel);
  for (const f of ['index.html', 'en/index.html', '404.html']) assert.ok(!/class="loopctl/.test(byFile[f]), f);
  for (const f of ['index.html', 'en/index.html', 'impressum/index.html', '404.html']) assert.equal((byFile[f].match(/<button class="motion-toggle/g) || []).length, 2, f);
  assert.match(deHome, /<button class="motion-toggle btn btn--secondary btn--sm motion-toggle--head" type="button" aria-pressed="false"/);
  assert.match(byFile['ki-antwortentwuerfe/index.html'], /class="loopctl btn btn--secondary btn--sm" type="button"/);
  assert.ok(!deHome.includes('class="rl__ctl"'), 'R3: the run-log left home (teaser card)');
  assert.ok(!/class="replay\b/.test(deHome), 'no «Nochmal ansehen» button while it loops');
  for (const f of ['main.js', 'prices.js', 'fixdemos.js', 'sections.js']) assert.match(js(f), /tap: /, f);
});

test('loops.js: loop while visible, pause kept for the visit, no cap on plays', () => {
  const l = js('kit/motion.js');
  assert.match(l, /sessionStorage/);
  assert.ok(!/MAX_AUTO/.test(l), 'no cap of two plays');
  assert.match(l, /function cycle\(d\)/);
  // Stage 6f: nearest the centre, at least 2.5 s rest, a soft fade, the global pause in localStorage.
  assert.match(l, /const MIN_REST = 2500;/);
  assert.match(l, /is-fading/);
  assert.match(l, /localStorage\.getItem\('motion-paused'\)/);
  assert.match(l, /distance\(a\) - distance\(b\)/);
});

test('tool row: marquee again with its copy hidden from screen readers; the label inside the band', () => {
  assert.match(deHome, /<div class="wrap tools__in demo" data-demo="tools">\n<p class="tools__label" id="tools-title">Ich arbeite mit<\/p>\n<div class="marquee">/);
  assert.match(deHome, /<ul class="tools__list tools__copy" role="list" aria-hidden="true">/);
  assert.match(js('motion.js'), /!before\.classList\.contains\('tools'\)/, 'the band does not drift');
});

test('prices: pictures animated again, small pictures on the One-Pager and KI rows, the 30-day strip', () => {
  for (const c of ['viz--quick', 'viz--check', 'viz--hub', 'viz--site', 'viz--chat']) assert.ok(deHome.includes(c), c);
  assert.match(deHome, /<span class="scan__lens"><\/span>/);
  assert.match(deHome, /<ol class="days" role="list" aria-hidden="true"><li>Tag 1<\/li><li>Tag 14<\/li><li>Tag 30<\/li><\/ol>/);
  assert.ok(!/item__cta::after/.test(readFileSync(new URL('../assets/css/main.css', import.meta.url), 'utf8')), 'the price card is not one big link (calm cursor)');
});

test('slider «Chaos / Geordnet» is back as the opener of the problem cards, compact', () => {
  const p = deHome.slice(deHome.indexOf('id="problems"'), deHome.indexOf('<ul class="pcs"'));
  assert.match(p, /<figure class="ba">[\s\S]*viewBox="0 0 440 180"[\s\S]*<input class="ba__range" type="range"/);
});

// R3 (December release): the embedded run-log became one teaser card (the tool page and the sample report);
// runlog.js stays for /werkzeuge/ein-kauf/.
test('run-log: home shows the teaser card instead of the embedded run-log (R3)', () => {
  for (const [h, tool, report] of [[deHome, 'Was passiert, wenn ein Schritt fehlt? Selbst ausprobieren', 'So sieht ein Technik-Bericht aus'], [byFile['en/index.html'], 'What happens when a step is missing? Try it yourself (in German)', 'Sample report (in German)']]) {
    assert.ok(!h.includes('class="vtabs') && !h.includes('<li class="rl__step'), 'no tabs, no run-log');
    assert.ok(h.includes(`<div class="rl-teaser card">\n<p><a class="text-link" href="/werkzeuge/ein-kauf/">${tool}</a></p>\n<p><a class="text-link" href="/musterbericht/technik-check/">${report}</a></p>\n</div>`));
    assert.ok(!/runlog\.(css|js)/.test(h), 'runlog.js is not linked in the page');
  }
  const r = js('runlog.js');
  // Stage 7b: one beat is the kit's BEAT (1800 ms) instead of the run-log's own 1 s step.
  assert.match(r, /import \{[^}]*\bBEAT\b[^}]*\} from '\.\/kit\/motion\.js';/);
  assert.match(js('kit/motion.js'), /export const BEAT = 1800;/);
  assert.match(r, /const HOLD = 4000;/);
});

test('old run-log behind «Ablauf selbst ausprobieren» (Stage 6e): kept in src/_alt only', () => {
  assert.ok(readFileSync(new URL('../src/_alt/stage6e/runlog.js', import.meta.url), 'utf8').includes('export function open'));
});

test('«Über mich» row: what clients can rely on; the access item in the FAQ wording (Iva 29.10.2026)', () => {
  assert.match(deHome, /<div class="aboutrow demo" data-demo="about"/);
  // Stage 6f: five static chips, no marquee copy.
  for (const x of de.s6.e.aboutRow) assert.ok(deHome.includes(`<li class="trust">${x}</li>`), x);
  assert.ok(!/aboutrow[\s\S]{0,400}marquee/.test(deHome.slice(deHome.indexOf('class="aboutrow'), deHome.indexOf('class="aboutrow') + 900)));
  assert.ok(de.s6.e.aboutRow.includes('Eigener Zugang statt Ihres Passworts'));
  assert.ok(en.s6.e.aboutRow.includes('Own access instead of your password'));
  assert.ok(!/nie Ihr Passwort/.test(deHome) && !/never your password/.test(byFile['en/index.html']));
  assert.equal(en.s6.e.aboutRow.length, 5);
  assert.equal(de.s6.e.aboutRow.length, 5);
});

test('FAQ chat: question list and chat panel, F1 photo, «Auch gefragt» for all eight questions', () => {
  assert.equal(de.s4.faq.related.length, 12);
  assert.ok(de.s4.faq.related.flat().every((i) => i >= 0 && i < 12));
  assert.match(deHome, /data-photo="\/assets\/img\/avatar-88\.webp"/);
  assert.match(js('faq.js'), /bubble--typing/);
});

test('references: the long screenshot scrolls in its frame; the stack opens from the first moment', () => {
  assert.match(deHome, /<div class="browser__view">\n<picture class="case__shot">[\s\S]*case-alexandrafry-long-640/);
  // Stage 6f: timed, not scrubbed: the screenshot pans through the conductor, the quotes fan out once.
  assert.match(js('sections.js'), /function browserPan\(\)/);
  // Stage 6i: stacked while out of view, fanned out one after another on every return.
  assert.match(js('sections.js'), /box\.classList\.add\('is-fanning'\);\n    box\.classList\.remove\('is-stacked'\);/);
  const code = js('sections.js').replace(/\/\/.*$/gm, '').replace(/function aboutPhoto[\s\S]*?\n}\n/, '');
  assert.ok(!/scrub/.test(code), 'no scroll-scrubbed motion on what people read (the photo reveal stays)');
});

test('reveals: once, as soon as any part is on screen, never reversed', () => {
  const m = js('motion.js');
  // Stage 7b: 12 % inside the window (design system 5.2); the rest of the entrances moved to kit/enter.js.
  assert.match(m, /start: 'top 88%', once: true/);
  assert.match(js('kit/enter.js'), /rootMargin: '0px 0px -12% 0px'/);
  assert.ok(!/toggleActions: 'play none none reverse'/.test(m.slice(m.indexOf('function entrances'))));
});
