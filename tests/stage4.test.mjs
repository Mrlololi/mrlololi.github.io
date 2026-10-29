// Stage 4 (21.10.2026): the page moves, real demo interfaces, every section reworked.
// Markup and pure helpers here; behaviour in a browser (replay, reduced motion, no JS, keyboard,
// mobile tabs) in tests/stage4-browser.test.mjs and src/qa/stage4.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pages } from '../src/build.mjs';
import config from '../src/config.json' with { type: 'json' };
import de from '../src/content/de.mjs';
import en from '../src/content/en.mjs';
import { KI_EXAMPLES, KI_TABS } from '../src/content/ki-examples.mjs';
import { firstName, mailtoHref, briefMail, supportTotal } from '../assets/js/pure.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = (p) => path.join(root, p);
const all = pages(config);
const html = (f) => all.find((p) => p.file === f).html;
const DE = html('index.html');
const EN = html('en/index.html');
const css = readFileSync(file('assets/css/main.css'), 'utf8');
// From a top-level section's start to the next top-level section (pricing has nested <section>s).
const section = (h, id) => {
  const a = h.search(new RegExp(`<section class="[^"]*" id="${id}"`));
  const b = h.slice(a + 1).search(/\n(<section class="section|<aside|<\/main>)/);
  return h.slice(a, a + 1 + b + 1);
};

/* ---------- pure helpers ---------- */
test('first name: «Ann» stays «Ann», «Anna K.» becomes «Anna»', () => {
  assert.equal(firstName('Ann'), 'Ann');
  assert.equal(firstName('Anna K.'), 'Anna');
  assert.equal(firstName('  Anna-Lena   Berger '), 'Anna-Lena');
  assert.equal(firstName(''), '');
  assert.equal(firstName('', 'Anna K.'), 'Anna', 'empty field falls back to the example name');
});

test('mailto: subject and body encoded, line breaks as CRLF', () => {
  const href = mailtoHref('hello@mrlololi.com', 'Anfrage über mrlololi.com', 'Hallo Iva,\n\nIch verkaufe & teste.');
  assert.equal(href, 'mailto:hello@mrlololi.com?subject=Anfrage%20%C3%BCber%20mrlololi.com&body=Hallo%20Iva%2C%0D%0A%0D%0AIch%20verkaufe%20%26%20teste.');
});

test('brief builder: the sentence and the e-mail follow the choices', () => {
  const c = de.s4.contact;
  const m = briefMail(c, { what: 'einen Onlinekurs', via: 'Leadpages', issue: 'Zahlungen', start: 'in 4 Wochen' });
  // Stage 6b: lower case after «Hallo Iva,»; an open platform gets its own sentence.
  assert.ok(m.body.startsWith('Hallo Iva,\n\nich verkaufe einen Onlinekurs über Leadpages.'), m.body);
  assert.ok(briefMail(c, { what: 'einen Workshop', via: 'noch offen', issue: 'Zahlungen', start: 'sofort' }).body.includes('ich verkaufe einen Workshop. Die Plattform ist noch offen.'));
  assert.ok(!briefMail(c, { what: 'x', via: 'noch offen', issue: 'y', start: 'z' }).body.includes('über noch offen'));
  assert.equal(m.subject, 'Anfrage über mrlololi.com');
  assert.equal(m.body, 'Hallo Iva,\n\nich verkaufe einen Onlinekurs über Leadpages. Es hakt bei Zahlungen. Start: in 4 Wochen.\n\nViele Grüße');
  const e = briefMail(en.s4.contact, { what: 'a membership', via: 'Wix', issue: 'sign-ups', start: 'right away' });
  assert.match(e.body, /^Hello Iva,\n\nI sell a membership via Wix\. The problem is sign-ups\. Start: right away\.\n\nBest regards$/);
});

test('support meter: 45 € per hour', () => {
  assert.deepEqual([1, 3, 5, 10, 20].map(supportTotal), [45, 135, 225, 450, 900]);
});

/* ---------- motion system ---------- */
test('vendor: SplitText is self-hosted next to GSAP and ScrollTrigger', () => {
  for (const f of ['gsap.min.js', 'ScrollTrigger.min.js', 'SplitText.min.js']) assert.ok(existsSync(file(`assets/vendor/${f}`)), f);
  assert.match(readFileSync(file('src/tools/vendor.mjs'), 'utf8'), /'SplitText\.min\.js'/);
});

test('docking: every edge section has a scrubbable radius (48 px, 24 px on phones)', () => {
  assert.match(css, /\.edge \{[^}]*border-radius: calc\(var\(--dock, 1\) \* var\(--dock-r\)\) calc\(var\(--dock, 1\) \* var\(--dock-r\)\) 0 0;/);
  assert.match(css, /--dock-r: 48px;/);
  assert.match(css, /@media \(max-width: 767\.98px\) \{\s*:root \{ --dock-r: 24px; \}/);
});

test('every external link opens in a new tab and says so', () => {
  for (const { file: f, html: h } of all) {
    for (const [a, href] of h.matchAll(/<a [^>]*href="(https?:\/\/[^"]+)"[^>]*>[\s\S]*?<\/a>/g)) {
      if (href.startsWith(config.site_url + '/') && !href.includes('/Webprojekte/')) continue;
      assert.match(a, /target="_blank" rel="noopener"/, `${f}: ${href}`);
      assert.match(a, /<span class="sr-only"> \((öffnet in neuem Tab|opens in a new tab)\)<\/span>/, `${f}: ${href}`);
    }
  }
});

/* ---------- B1, B2: before/after and the problem cards ---------- */
test('KI data: 20 examples in 5 tabs, DE and EN, every highlight found in its mail', () => {
  for (const lang of ['de', 'en']) {
    const list = KI_EXAMPLES[lang];
    assert.equal(list.length, 20, lang);
    assert.equal(KI_TABS[lang].length, 5);
    for (let tab = 0; tab < 5; tab++) assert.equal(list.filter((x) => x.tab === tab).length, 4);
    for (const x of list) {
      for (const m of x.marks) assert.equal(x.body.split(m.text).length, 2, `${lang} ${x.id}: ${m.text}`);
      assert.ok(['sie', 'du', 'locker'].every((k) => x.drafts[k]), x.id);
      assert.ok(x.system && x.subject && x.from && x.mood, x.id);
    }
  }
  assert.ok(KI_EXAMPLES.de.some((x) => x.body.includes('Grüezi')));
  assert.equal(KI_EXAMPLES.de[0].body, de.ki.mail, 'example 1 is the approved Anna mail');
});

test('process: «So arbeiten wir zusammen», a line and four pictograms', () => {
  const p = section(DE, 'process');
  assert.match(p, /So arbeiten wir <em class="accent">zusammen<\/em>/);
  assert.match(p, /<span class="steps__line" aria-hidden="true"><span><\/span><\/span>/);
  assert.equal((p.match(/<svg class="step__icon step__icon--(cal|offer|blocks|key)"/g) || []).length, 4);
  assert.match(section(EN, 'process'), /How we work <em class="accent">together<\/em>/);
});

test('contact: brief builder with a live preview, mailto, Iva bubble, Graz time, the note only after the click', () => {
  const c = section(DE, 'contact');
  assert.equal((c.match(/<select class="brief__select" id="brief-(what|via|issue|start)"/g) || []).length, 4);
  // Without JS the builder is hidden, so the link carries only the subject; contact.js adds the brief as the body.
  assert.match(c, /<a class="btn btn--primary brief__open" href="mailto:hello@mrlololi\.com\?subject=Anfrage%20%C3%BCber%20mrlololi\.com" data-mail="hello@mrlololi\.com"/);
  assert.match(c, /<p class="brief__body">Hallo Iva,<br><br>ich verkaufe einen Onlinekurs über Leadpages\. Es hakt bei Zahlungen\. Start: in 4 Wochen\.<br><br>Viele Grüße<\/p>/);
  assert.match(css, /html:not\(\.js\) \.brief \{ display: none; \}/);
  assert.match(c, /<p class="contact__bubble"[^>]*>Erzählen Sie mir, was hakt\.<\/p>/);
  assert.match(c, /Antwort innerhalb von 2 Werktagen/);
  assert.match(c, /<time class="contact__time"/);
  assert.match(c, /<div class="contact__thanks" role="status"><\/div>/, 'empty until the click');
  assert.match(c, /<template id="contact-thanks">[\s\S]*data-scene="contact"[\s\S]*Danke! Sobald Ihre Mail da ist, melde ich mich innerhalb von zwei Werktagen\.[\s\S]*<\/template>/);
  const outside = c.replace(/<template[\s\S]*?<\/template>/, '');
  assert.ok(!outside.includes('class="mascot'), 'no mascot next to the buttons before the click');
  assert.match(section(EN, 'contact'), /Thank you! Once your email arrives, I'll reply within two working days\./);
});

/* ---------- mascots: exactly these places ---------- */
test('header: bigger lockup (28 px icon) and a variant switch', () => {
  assert.match(DE, /<header class="site-header" data-header data-variant="(light|halo)">/);
  assert.match(css, /\.wordmark \.logo \{ display: block; height: clamp\(2\.1rem, 1\.4rem \+ 2\.6vw, 2\.6rem\);/);
});
