// Stage 3 (21.10.2026): everything that looks clickable works; labels look like labels.
// Behaviour is checked in src/qa/clickable.mjs and src/qa/demos.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pages } from '../src/build.mjs';
import config from '../src/config.json' with { type: 'json' };

const all = pages(config, { buildDate: new Date('2026-10-21T12:00:00Z') });
const de = all.find((p) => p.file === 'index.html').html;
const en = all.find((p) => p.file === 'en/index.html').html;
const count = (html, re) => (html.match(re) || []).length;

test('story step 1 is a real local form: inputs, submit, note, inline error', () => {
  const form = de.match(/<form class="story__form"[\s\S]*?<\/form>/)[0];
  // method="dialog": submitting does nothing outside a dialog, so even without JS nothing is sent or put in the URL.
  assert.match(form, /<form class="story__form" method="dialog" novalidate>/);
  assert.match(form, /<input id="story-name" name="name" type="text" value="Anna K\." autocomplete="off">/);
  assert.match(form, /<input id="story-email" name="email" type="email" value="anna@example\.com" autocomplete="off" aria-describedby="story-email-error">/);
  assert.match(form, /<p class="story__error" id="story-email-error" hidden>Bitte geben Sie eine gültige E-Mail-Adresse ein\.<\/p>/);
  assert.match(form, /<button class="btn btn--primary" type="submit">Jetzt anmelden<\/button>/);
  assert.match(form, /<p class="story__note small">Nur eine Vorschau: Es wird nichts gesendet oder gespeichert\.<\/p>/);
  assert.ok(!/action=/.test(form), 'nothing is sent anywhere');
  assert.match(de, /Willkommen im Kurs, <span class="js-first">Anna<\/span>!/);
  assert.match(de, /<li class="toast">Neue Anmeldung: <span class="js-name">Anna K\.<\/span><\/li>/);
  assert.match(en, /Preview only: nothing is sent or stored\./);
});

test('KI demo: real approve / edit buttons with their follow-up texts', () => {
  assert.match(de, /<button class="btn btn--primary btn--sm kidemo__approve" type="button" data-done="Freigegeben">Freigeben<\/button>/);
  assert.match(de, /<button class="btn btn--ghost btn--sm kidemo__edit" type="button" data-done="Fertig" data-label="Antwort bearbeiten">Bearbeiten<\/button>/);
  assert.match(de, /<p class="kidemo__sent" role="status" hidden>Antwort an Anna gesendet \(Beispiel\)<\/p>/);
  assert.ok(!de.includes('fake-btn'));
  assert.match(en, /data-done="Approved">Approve<\/button>/);
});

test('price cards: one «Anfragen» mail link each, package in the subject', () => {
  const items = [...de.matchAll(/<li class="item" id="pkg-(\w+)">[\s\S]*?<\/a>\n<\/li>/g)];
  assert.equal(items.length, 6);
  for (const [li] of items) {
    const name = li.match(/<h4 class="item__name">([^<]+)<\/h4>/)[1];
    assert.ok(li.includes(`<a class="btn btn--sm item__cta" href="mailto:hello@mrlololi.com?subject=${encodeURIComponent(`Anfrage: ${name}`)}">Anfragen<span class="sr-only">: ${name}</span></a>`), name);
  }
  assert.match(en, /subject=Enquiry%3A%20Quick%20fix">Enquire/);
});

test('problem cards link to the matching package', () => {
  assert.deepEqual([...de.matchAll(/<a class="pc__link" href="#pkg-(\w+)">Passendes Paket: ([^<]+)<\/a>/g)].map((m) => [m[1], m[2]]),
    [['check', 'Technik-Check'], ['quick', 'Quick-Fix'], ['launch', 'Launch-Setup']]);
  assert.match(en, /Matching package: Tech check/);
});

test('hero: chip links to «Über mich», flow nodes are buttons with one line each', () => {
  assert.match(de, /<a class="hero__chip" href="#about">/);
  const btns = [...de.matchAll(/<button class="hf__btn hf__btn--(\d)" type="button" aria-expanded="false" aria-controls="hf-line-\1">([^<]+)<\/button>/g)].map((m) => m[2]);
  assert.deepEqual(btns, ['Formular', 'ActiveCampaign', 'Zahlung', 'Kurs offen']);
  assert.match(de, /<li id="hf-line-1">Die Anmeldung kommt herein und wird geprüft\.<\/li>/);
  assert.match(de, /<li id="hf-line-4">Der Zugang wird freigeschaltet, ohne Handarbeit\.<\/li>/);
  assert.match(en, /<li id="hf-line-3">Payment or instalment is recognised, the invoice goes out\.<\/li>/);
});

test('labels share one style; pause controls are icon buttons with a label', () => {
  for (const t of ['Beispiel', 'Beispielwerte', 'Problem', 'Lösung', 'Chaos', 'Geordnet', 'Thema: Login', 'dringend']) {
    assert.match(de, new RegExp(`class="label[^"]*">${t}<`), t);
  }
  assert.ok(!/class="(demo-tag|pc__tag|ba__tag|chip)\b/.test(de), 'old tag classes gone');
  const pauses = [...de.matchAll(/<button class="loop-btn" type="button" hidden aria-label="Animation anhalten" data-pause="Animation anhalten" data-play="Animation fortsetzen">/g)];
  // Four loops: hero ribbon, tool marquee, toast stack, 6 vs 1.
  assert.equal(pauses.length, 4);
  assert.equal(count(de, /<span class="loop-btn__tip" aria-hidden="true">Animation anhalten<\/span>/g), 4);
});

// Own contrast test (axe skips text on gradients): every text colour on every surface it sits on.
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const over = (fg, alpha, bg) => fg.map((c, i) => Math.round(c * alpha + bg[i] * (1 - alpha)));
const lum = (rgb) => {
  const [r, g, b] = rgb.map((c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const WHITE = [255, 255, 255];

test('contrast: text colours on every section colour, card and label (variant B) reach 4.5:1', () => {
  const sections = { pink: '#F4C9D3', blue: '#BFD8EE', pist: '#CFE3C2', lav: '#DCD3F0', peach: '#F7DCC8' };
  const text = { ink: '#2B2A33', inkSoft: '#4A4753', link: '#5A4A9C' };
  const fails = [];
  const need = (label, fg, bg) => { const r = ratio(fg, bg); if (r < 4.5) fails.push(`${label} ${r.toFixed(2)}`); };
  for (const [s, bgHex] of Object.entries(sections)) {
    const bg = hex(bgHex);
    const card = over(WHITE, 0.55, bg);
    for (const [t, fgHex] of Object.entries(text)) {
      need(`${t} on ${s}`, hex(fgHex), bg);
      need(`${t} on card over ${s}`, hex(fgHex), card);
    }
  }
  const pistCard = over(WHITE, 0.55, hex(sections.pist));
  need('run summary (pist-ink) on the run card', hex('#3F6B31'), pistCard);
  need('access line (pist-ink) on the welcome card', hex('#3F6B31'), over(hex('#F4C9D3'), 0.5, pistCard));
  need('form error on the story card', hex('#A23B2F'), pistCard);
  need('tone label on the draft', hex('#5A4A9C'), over(hex('#DCD3F0'), 0.55, over(WHITE, 0.55, hex(sections.pink))));
  for (const [fg, bg] of [['#9C3F58', '#FBE7EC'], ['#3F6B31', '#E6F1DF'], ['#285B88', '#E3EEF8'], ['#5A4A9C', '#EEEAF8'], ['#7A4E2D', '#FBEDE3'], ['#2B2A33', '#FFFFFF']]) need(`label ${fg} on ${bg}`, hex(fg), hex(bg));
  need('footer text', hex('#F3EEF0'), hex('#2B2A33'));
  assert.deepEqual(fails, []);
});
