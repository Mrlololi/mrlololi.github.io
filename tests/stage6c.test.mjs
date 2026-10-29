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

test('every looping demo has its pause button (44 px secondary button, named for screen readers)', () => {
  for (const sel of ['data-demo="hero"', 'data-demo="tools"', 'data-demo="prices"', 'data-demo="process"', 'data-demo="about"']) assert.ok(deHome.includes(sel), sel);
  const buttons = deHome.match(/<button class="loopctl btn btn--secondary btn--sm[^"]*" type="button" hidden data-pause-label="Pause" data-play-label="Abspielen" data-step-label="Nächster Schritt">/g) || [];
  assert.ok(buttons.length >= 9, String(buttons.length));
  assert.match(deHome, /<span class="loopctl__text">Pause<\/span><span class="sr-only">: Ablauf oben<\/span>/);
  assert.ok(!/class="replay\b/.test(deHome), 'no «Nochmal ansehen» button while it loops');
  assert.match(byFile['ki-antwortentwuerfe/index.html'], /class="loopctl btn/);
  assert.match(byFile['404.html'], /class="loopctl btn/);
});

test('loops.js: loop while visible, pause kept for the visit, no cap on plays', () => {
  const l = js('loops.js');
  assert.match(l, /sessionStorage/);
  assert.ok(!/MAX_AUTO/.test(l), 'no cap of two plays');
  assert.match(l, /function cycle\(d\)/);
  assert.match(l, /ambient/);
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

test('run-log demo behind «Ablauf selbst ausprobieren»: a template, nothing loaded before the click', () => {
  for (const h of [deHome, byFile['en/index.html']]) {
    assert.match(h, /<button class="btn btn--secondary runlog__open" type="button" aria-expanded="false" aria-controls="runlog">/);
    assert.match(h, /<template id="runlog-tpl"><div class="runlog demo" data-demo="runlog">/);
    assert.ok(!/runlog\.(css|js)/.test(h.replace(/<template[\s\S]*?<\/template>/g, '')), 'not linked in the page');
  }
  const tpl = deHome.match(/<template id="runlog-tpl">[\s\S]*?<\/template>/)[0];
  assert.equal((tpl.match(/<button class="chip runlog__step" type="button" data-step="\d"/g) || []).length, 3);
  assert.ok(!/toast|mascot|confetti/.test(tpl), 'no toasts, no small mascots');
  assert.match(tpl, /runlog__replay/);
  assert.match(tpl, /class="loopctl btn/);
  assert.match(js('main.js'), /\/assets\/css\/runlog\.css/);
});

test('«Über mich» row: what clients can rely on, the password item left out (it contradicts the FAQ)', () => {
  assert.match(deHome, /<div class="aboutrow demo" data-demo="about"/);
  for (const x of de.s6.e.aboutRow) assert.ok(deHome.includes(`<li>${x}</li>`), x);
  assert.ok(!/nie Ihr Passwort/.test(deHome) && !/never your password/.test(byFile['en/index.html']));
  assert.equal(en.s6.e.aboutRow.length, de.s6.e.aboutRow.length);
});

test('FAQ chat: question list and chat panel, F1 photo, «Auch gefragt» for all eight questions', () => {
  assert.equal(de.s4.faq.related.length, 8);
  assert.ok(de.s4.faq.related.flat().every((i) => i >= 0 && i < 8));
  assert.match(deHome, /data-photo="\/assets\/img\/avatar-88\.webp"/);
  assert.match(js('faq.js'), /bubble--typing/);
});

test('references: the long screenshot scrolls in its frame; the stack opens from the first moment', () => {
  assert.match(deHome, /<div class="browser__view">\n<picture class="case__shot">[\s\S]*case-alexandrafry-long-640/);
  assert.match(js('sections.js'), /start: 'top bottom', end: 'center 60%'/);
});

test('reveals: once, as soon as any part is on screen, never reversed', () => {
  const m = js('motion.js');
  assert.match(m, /start: 'top bottom', once: true/);
  assert.ok(!/toggleActions: 'play none none reverse'/.test(m.slice(m.indexOf('function entrances'))));
});
