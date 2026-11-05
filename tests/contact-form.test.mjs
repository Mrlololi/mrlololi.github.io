// Kontaktformular 30.10.2026 (docs/PROMPT_Kontaktformular_2026-10-30.md): static checks. Validation,
// payload, success, error, timeout and keyboard run in the browser with the Make hook mocked
// (src/qa/stage6.mjs, tests/stage6-browser.test.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pages } from '../src/build.mjs';
import config from '../src/config.json' with { type: 'json' };

const all = pages(config, { live: {} });
const byFile = Object.fromEntries(all.map((p) => [p.file, p.html]));
const contact = (f) => byFile[f].slice(byFile[f].indexOf('id="contact"'), byFile[f].indexOf('<div class="contact__side">'));
const js = readFileSync(new URL('../assets/js/contact.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../assets/css/main.css', import.meta.url), 'utf8');

test('form: the brief builder stays, then name, e-mail, optional text, consent, «Anfrage senden» (DE)', () => {
  const c = contact('index.html');
  // Stage 6f: native post to the hook without JS; the inline guard holds clicks until contact.js is there.
  assert.match(c, /<form class="contact__form" id="contact-form" action="https:\/\/hook\.eu1\.make\.com\/49mmc0uciouni5rlvys2vb6drzdhhlph" method="post" onsubmit="return window\.__cfReady===true" data-endpoint="https:\/\/hook\.eu1\.make\.com\/49mmc0uciouni5rlvys2vb6drzdhhlph" data-lang="de"/);
  assert.equal((c.match(/<select class="brief__select"/g) || []).length, 4);
  assert.match(c, /<label for="cf-name">Ihr Name<\/label><input id="cf-name" name="name" type="text" autocomplete="name"[^>]* required aria-describedby="cf-name-err">/);
  assert.match(c, /<label for="cf-email">Ihre E-Mail-Adresse<\/label><input id="cf-email" name="email" type="email" autocomplete="email"[^>]* required aria-describedby="cf-email-err">/);
  assert.match(c, /<label for="cf-text">Möchten Sie noch etwas ergänzen\? \(optional\)<\/label><textarea id="cf-text" name="text"/);
  assert.match(c, /<input id="cf-consent" name="consent" type="checkbox" value="true" required aria-describedby="cf-consent-err"><label for="cf-consent">Ich bin einverstanden, dass meine Angaben zur Beantwortung meiner Anfrage verarbeitet werden\. Mehr in der <a href="\/datenschutz\/#form">Datenschutzerklärung<\/a>\.<\/label>/);
  assert.match(c, /<button class="btn btn--primary contact__send" type="submit">Anfrage senden<\/button>\n<p class="contact__next">In meiner Antwort bekommen Sie zwei, drei Terminvorschläge, per Zoom oder Telefon\.<\/p>\n<p class="contact__showcase small">Diese Anfrage läuft über eine Automation, wie ich sie für Sie baue\.<\/p>/);
  assert.match(c, /Ihre Angaben gehen nur an mich, über eine Automation in der EU\. Keine Cookies, kein Tracking\./);
  assert.ok(!/gesendet oder gespeichert/.test(c), 'the old note is gone (the run-log demo keeps its own «Nur eine Vorschau»)');
  assert.match(c, /data-sending="Wird gesendet…"/);
});

test('form (EN): the same fields and lines in English, privacy link to /en/privacy/', () => {
  const c = contact('en/index.html');
  assert.match(c, /data-lang="en"/);
  for (const s of ['Your name', 'Your email address', 'Anything to add? (optional)', 'Send request', 'This request runs through an automation like the ones I build for you.', 'Your details go only to me, through an automation in the EU. No cookies, no tracking.']) assert.ok(c.includes(s), s);
  assert.match(c, /<a href="\/en\/privacy\/#form">privacy policy<\/a>/);
  assert.ok(!/sent or stored/.test(c));
});

test('honeypot «website»: off-screen, tabindex -1, autocomplete off, aria-hidden, label «Bitte leer lassen»', () => {
  const c = contact('index.html');
  assert.match(c, /<div class="hp" aria-hidden="true"><label for="cf-website">Bitte leer lassen<\/label><input id="cf-website" name="website" type="text" tabindex="-1" autocomplete="off" aria-hidden="true"><\/div>/);
  assert.match(css, /\.hp \{ position: absolute; left: -10000px;/);
});

test('success and error: the panel with Live (joy), the error line with the address, mail fallback only on error', () => {
  const c = contact('index.html');
  assert.match(c, /<div class="contact__done" role="status" tabindex="-1" hidden data-text="Danke, \{name\}! Sie bekommen gleich eine Bestätigung per E-Mail\. Ich melde mich innerhalb von zwei Werktagen\.">/);
  assert.match(c, /data-scene="contact-done"[\s\S]*data-base="joy"/);
  assert.match(c, /<p class="contact__failed" role="alert" tabindex="-1" hidden>Das hat leider nicht geklappt\. Schreiben Sie mir direkt an <a href="mailto:hello@mrlololi\.com[^"]*">hello@mrlololi\.com<\/a><\/p>/);
  assert.match(css, /\.js \.contact__alt:not\(\.is-open\) \{ display: none; \}/);
  assert.ok(!/html:not\(\.js\) \.contact__fields/.test(css), 'Stage 6f: the form works without JS');
});

test('contact.js: one POST as JSON with keepalive, 10 s timeout, exactly the agreed fields, no cookies', () => {
  assert.match(js, /const TIMEOUT = 10000;/);
  assert.match(js, /method: 'POST', headers: \{ 'Content-Type': 'application\/json' \}, body: JSON\.stringify\(payload\), credentials: 'omit', keepalive: true/);
  // Stage 6f: the selects carry the payload names themselves (the native post matches the JSON).
  for (const [k, n] of [['what', 'was'], ['via', 'plattform'], ['issue', 'problem'], ['start', 'start']]) assert.ok(byFile['index.html'].includes(`name="${n}" data-key="${k}"`), n);
  const block = js.slice(js.indexOf('const payload = {'), js.indexOf('};', js.indexOf('const payload = {')));
  const keys = [...block.matchAll(/^\s{6}(\w+):/gm)].map((m) => m[1]);
  assert.deepEqual(keys, ['name', 'email', 'text', 'termin', 'consent', 'website', 'elapsed_ms', 'lang', 'page']);
  assert.ok(!/document\.cookie|localStorage|sessionStorage/.test(js));
});

test('Datenschutz: section «Kontaktformular» / «Contact form» before «Terminbuchung», linked from the form', () => {
  for (const [f, title, parts] of [
    ['datenschutz/index.html', 'Kontaktformular', ['Art. 6 Abs. 1 lit. b DSGVO', 'einen Dienst von Celonis (Celonis Inc., New York, USA, und ihre Tochtergesellschaften)', 'EU-Region', 'EU-US Data Privacy Framework', 'Google Gmail', '<a href="#email">Kontakt per E-Mail</a>', 'Sie müssen das Formular nicht nutzen']],
    ['en/privacy/index.html', 'Contact form', ['Art. 6(1)(b) GDPR', 'Make, a service of Celonis (Celonis Inc., New York, USA, and its subsidiaries)', 'EU region', 'EU-US Data Privacy Framework', 'Google Gmail', '<a href="#email">Contact by email</a>', 'You do not have to use the form']],
  ]) {
    const h = byFile[f];
    const sec = h.match(new RegExp(`<section id="form">\\n<h2>${title}</h2>\\n<p>([\\s\\S]*?)</p>\\n</section>`));
    assert.ok(sec, f);
    for (const p of parts) assert.ok(sec[1].includes(p), `${f}: ${p}`);
    assert.ok(h.includes('<section id="email">'));
  }
});

test('prices: two chains with their pause buttons beside them; the 30-day box centred (max 820 px)', () => {
  const h = byFile['index.html'];
  assert.match(h, /<div class="pkgs-wrap demo" data-demo="prices">\n<ul class="pkgs"/);
  // Stage 6g: no pause buttons on the pictures (the global toggle and a tap on the picture).
  assert.match(h, /<div class="promise-row">\n<div class="promise">[\s\S]*?<\/div>\n<\/div>/);
  assert.match(h, /<div class="more demo" data-demo="more">\n<div class="more__head"><h3 class="more__title">Weitere Leistungen<\/h3><\/div>/);
  assert.match(css, /\.promise-row \.promise \{ width: 100%; max-width: 51\.25rem;/);
  const p = readFileSync(new URL('../assets/js/prices.js', import.meta.url), 'utf8');
  assert.match(p, /\['\.viz--site', 0, 1500\], \['\.viz--chat', 2500, 1900, typer\]/);
  assert.ok(!/ambient: true/.test(p), 'Stage 6f: one conductor, no exception');
});

