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
  assert.equal(m.subject, 'Anfrage über mrlololi.com');
  assert.equal(m.body, 'Hallo Iva,\n\nIch verkaufe einen Onlinekurs über Leadpages. Es hakt bei Zahlungen. Start: in 4 Wochen.\n\nViele Grüße');
  const e = briefMail(en.s4.contact, { what: 'a membership', via: 'Wix', issue: 'sign-ups', start: 'right away' });
  assert.match(e.body, /^Hello Iva,\n\nI sell a membership via Wix\. The problem is sign-ups\. Start: right away\.\n\nBest regards$/);
});

test('support meter: 45 € per hour', () => {
  assert.deepEqual([1, 3, 5, 2, 10].map(supportTotal), [45, 135, 225, 90, 450]);
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
test('before/after: a mask wrapper and a counter-shifted inner layer (transforms, not clip-path)', () => {
  const p = section(DE, 'problems');
  assert.match(p, /<div class="ba__mask"><div class="ba__inner">/);
  assert.match(p, /<input class="ba__range" type="range"/, 'the native range stays');
  assert.ok(!/\.js \.ba__side--after \{ clip-path/.test(css));
});

test('problem cards: three mini-demos, a real «Lösung ansehen» button each, labels and package links kept', () => {
  const p = section(DE, 'problems');
  assert.equal((p.match(/<figure class="fixdemo fixdemo--(signup|spam|rate)"/g) || []).length, 3);
  assert.equal((p.match(/<button class="fixdemo__play" type="button" data-again="Nochmal ansehen">Lösung ansehen<\/button>/g) || []).length, 3);
  assert.match(css, /html:not\(\.js\) \.fixdemo__play \{ display: none; \}/);
  assert.equal((p.match(/class="label label--pink">Problem</g) || []).length, 3);
  assert.equal((p.match(/class="label label--pist">Lösung</g) || []).length, 3);
  assert.match(p, /<span class="sig__n">47<\/span>\/47 angekommen/);
  for (const b of ['SPF', 'DKIM', 'DMARC']) assert.ok(p.includes(`>${b}<`), b);
  for (const s of de.s4.fixDemo.rate.steps) assert.ok(p.includes(`>${s}<`), s);
  assert.equal((p.match(/<a class="pc__link" href="#pkg-/g) || []).length, 3);
  assert.match(section(EN, 'problems'), />Show the fix<\/button>/);
});

/* ---------- B3: the story as one live screen ---------- */
test('story: one screen with four panes, the automation canvas, phone inbox, course area and the log stripe', () => {
  const s = section(DE, 'signup');
  assert.match(s, /<div class="screen" role="group" aria-label="Beispiel-Bildschirm: Anmeldung, Automation, Postfach und Kursbereich">/);
  assert.equal((s.match(/<div class="pane pane--(form|flow|phone|course)"/g) || []).length, 4);
  const nodes = [...s.matchAll(/<li class="anode anode--\d"><span class="anode__kind">([^<]+)<\/span><span class="anode__name">([^<]+)<\/span><\/li>/g)].map((m) => `${m[1]} ${m[2]}`);
  assert.deepEqual(nodes, ['Trigger Formular', 'Tag Herbst-Kurs', 'Mail Bestätigung', 'Warten bis bestätigt', 'Zahlung Stripe', 'Rechnung Quaderno', 'Zugang Somba']);
  assert.match(s, /Bitte bestätigen/);
  assert.match(s, /Willkommen, <span class="js-first">Anna<\/span>!/);
  assert.match(s, /<form class="story__form" method="dialog" novalidate>/, 'the real local form stays');
  assert.equal((s.match(/<li class="run__step"/g) || []).length, 6);
  assert.match(s, /<div class="screen"[\s\S]*<button class="loop-btn"[\s\S]*<\/div>\n<\/div>\n<\/div>\n<\/section>/, 'the pause button sits inside the frame');
  assert.equal((s.match(/<li class="story__step">/g) || []).length, 3, 'the 1-2-3 legend stays');
  assert.ok(!/<img[^>]+logo/i.test(s), 'no brand logos');
});

/* ---------- B4, B5: prices and projects visuals ---------- */
test('prices: Quick-Fix checkout, Technik-Check list with the conic border, Launch hub with the box, website frame, KI chat', () => {
  const p = section(DE, 'services');
  assert.match(p, /<div class="viz viz--quick" aria-hidden="true">/);
  assert.match(p, /<div class="viz viz--check" aria-hidden="true">/);
  for (const line of de.s4.starter.check) assert.ok(p.includes(`<li>${line}</li>`), line);
  assert.match(css, /@property --angle/);
  assert.match(p, /<div class="viz viz--hub" aria-hidden="true">/);
  assert.match(p, /<div class="lbox">/);
  for (const part of de.s4.projects.hub.parts) assert.ok(p.includes(`>${part}<`), part);
  assert.match(p, /<div class="viz viz--site" aria-hidden="true">/);
  assert.match(p, /<div class="viz viz--chat" aria-hidden="true">/);
  assert.ok(!p.includes('three'), 'no three.js');
});

test('prices: no mascots on the price cards or the Betreuung block; Lösung only at the 30-day promise', () => {
  const p = section(DE, 'services');
  for (const [li] of p.matchAll(/<li class="item"[\s\S]*?<\/li>\n(?=<li|<\/ul>)/g)) assert.ok(!li.includes('class="mascot'), li.slice(0, 60));
  const support = p.match(/<section class="tariff__group tariff__group--3"[\s\S]*?<\/section>/)[0];
  assert.ok(!support.includes('class="mascot'));
  assert.match(p, /<p class="tariff__promise[^"]*">[\s\S]*?data-scene="promise"/);
});

/* ---------- B6: KI demo ---------- */
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

test('KI demo: sticky steps, legend, example 1 static, the other 19 in a details list, data as JSON', () => {
  const p = section(DE, 'services');
  assert.equal((p.match(/<li class="kisteps__step[ "]/g) || []).length, 3);
  const legend = [...p.matchAll(/<li class="kilegend__item kilegend__item--(\w+)"><span class="hl hl--\w+">([^<]+)<\/span><\/li>/g)].map((m) => [m[1], m[2]]);
  assert.deepEqual(legend, [['anliegen', 'Anliegen'], ['fehlt', 'Fehlt'], ['stimmung', 'Stimmung'], ['dringlichkeit', 'Dringlichkeit']]);
  // Example 1 carries its reasons, so its highlights work before the JSON has arrived.
  assert.match(p, /<mark class="hl hl--anliegen" data-mark="0" data-reason="[^"]+" data-action="[^"]+">kein login bekommen<\/mark>/);
  assert.match(p, /<span class="kidemo__tag">KI-Entwurf<\/span>/);
  assert.match(p, /<details class="kimore">\n<summary>Weitere 19 Beispiele<\/summary>/);
  assert.equal((p.match(/<li class="kimore__item">/g) || []).length, 19);
  assert.match(p, /data-src="\/assets\/data\/ki-de\.json"/);
  for (const lang of ['de', 'en']) {
    const data = JSON.parse(readFileSync(file(`assets/data/ki-${lang}.json`), 'utf8'));
    assert.equal(data.examples.length, 20);
  }
});

/* ---------- B7: package finder as a chat ---------- */
test('finder chat: honest header, static list for no JS, avatar Lösung', () => {
  const f = section(DE, 'finder');
  assert.match(f, /<p class="chat__name">Paket-Assistent<span class="chat__demo"> · Demo, vorprogrammiert<\/span><\/p>/);
  assert.match(f, /data-scene="avatar"/);
  assert.match(f, /<ul class="finder__static" role="list">/);
  assert.ok(!f.includes('<form'), 'nothing to submit');
});

/* ---------- B8: Betreuung ---------- */
test('Betreuung: hour meter, 2/5/10 h switch, 30-day strip with the stamp; VAT line unchanged', () => {
  const p = section(DE, 'services');
  assert.match(p, /<div class="meter"/);
  const opts = [...p.matchAll(/<button class="meter__opt" type="button" aria-pressed="(true|false)" data-h="(\d+)">/g)].map((m) => Number(m[2]));
  assert.deepEqual(opts, [2, 5, 10]);
  assert.match(p, /<ol class="zusage__days" role="list">/);
  assert.match(p, /<textPath href="#stamp-path"[^>]*>30 Tage Zusage · 30 Tage Zusage · <\/textPath>/);
  assert.ok(p.includes(`<p class="small">${de.pricing.smallPrint}</p>`), 'VAT text exactly as before');
});

/* ---------- B9 to B13 ---------- */
test('process: «So arbeiten wir zusammen», a line and four pictograms', () => {
  const p = section(DE, 'process');
  assert.match(p, /So arbeiten wir <em class="accent">zusammen<\/em>/);
  assert.match(p, /<span class="steps__line" aria-hidden="true"><span><\/span><\/span>/);
  assert.equal((p.match(/<svg class="step__icon step__icon--(cal|offer|blocks|key)"/g) || []).length, 4);
  assert.match(section(EN, 'process'), /How we work <em class="accent">together<\/em>/);
});

test('references: browser frame around the long screenshot, three quote cards, case link in a new tab', () => {
  const r = section(DE, 'references');
  assert.match(r, /<div class="browser"><div class="browser__bar" aria-hidden="true">/);
  assert.match(r, /<a class="ext" href="https:\/\/alexandrafry\.ch" target="_blank" rel="noopener">alexandrafry\.ch<span class="sr-only"> \(öffnet in neuem Tab\)<\/span><\/a>/);
  assert.equal((r.match(/<li class="qcard /g) || []).length, 3);
});

test('about: the Lo/Lö/Li line, four timeline stories, two marquee rows, the mascot group', () => {
  const a = section(DE, 'about');
  assert.match(a, /<p class="about__line"><span class="tl-pink">Lo<\/span>gik, <span class="tl-blue">Lö<\/span>sung, <span class="tl-pist">Li<\/span>ve: so arbeite ich\.<span class="mscene mscene--about"/);
  assert.match(a, /data-scene="about"/);
  for (const s of de.s4.about.stories) assert.ok(a.includes(`>${s.replace(/&/g, "&amp;")}</p>`), s);
  assert.equal((a.match(/<ul class="trow trow--\d" role="list"/g) || []).length, 2);
  assert.match(section(EN, 'about'), /<span class="tl-pink">Lo<\/span>gic, <span class="tl-blue">Lo<\/span>op, <span class="tl-pist">Li<\/span>ve: that's how I work\./);
});

test('FAQ: intro, details for every question, «Auch gefragt», a way to the contact, Logik at the heading only', () => {
  const f = section(DE, 'faq');
  assert.match(f, /<p class="faq__intro">Kurze Antworten/);
  assert.equal((f.match(/<details class="faq__item"/g) || []).length, 7);
  assert.match(f, /data-also="Auch gefragt:"/);
  assert.match(f, /<a class="faq__more" href="#contact">Frage nicht dabei\? → Schreiben Sie mir<\/a>/);
  assert.match(f, /<h2 id="faq-title">[\s\S]*?data-scene="faq"/);
  for (const [d] of f.matchAll(/<details class="faq__item"[\s\S]*?<\/details>/g)) assert.ok(!d.includes('mascot'));
});

test('contact: brief builder with a live preview, mailto, Iva bubble, Graz time, the note only after the click', () => {
  const c = section(DE, 'contact');
  assert.equal((c.match(/<select class="brief__select" id="brief-(what|via|issue|start)"/g) || []).length, 4);
  // Without JS the builder is hidden, so the link carries only the subject; contact.js adds the brief as the body.
  assert.match(c, /<a class="btn btn--primary brief__open" href="mailto:hello@mrlololi\.com\?subject=Anfrage%20%C3%BCber%20mrlololi\.com" data-mail="hello@mrlololi\.com"/);
  assert.match(c, /<p class="brief__body">Hallo Iva,<br><br>Ich verkaufe einen Onlinekurs über Leadpages\. Es hakt bei Zahlungen\. Start: in 4 Wochen\.<br><br>Viele Grüße<\/p>/);
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
test('mascots: nine scenes on the home page plus the footer, none on legal pages', () => {
  const scenes = [...new Set([...DE.matchAll(/data-scene="(\w+)"/g)].map((m) => m[1]))].sort();
  assert.deepEqual(scenes, ['about', 'avatar', 'contact', 'faq', 'hero', 'loading', 'party', 'problems', 'promise'].sort());
  for (const f of ['impressum/index.html', 'datenschutz/index.html', 'en/legal-notice/index.html', 'en/privacy/index.html', '404.html']) {
    assert.ok(!html(f).includes('data-scene'), f);
  }
  for (const [q] of DE.matchAll(/<li class="qcard[\s\S]*?<\/li>/g)) assert.ok(!q.includes('mascot'));
});

/* ---------- header ---------- */
test('header: bigger lockup (28 px icon) and a variant switch', () => {
  assert.match(DE, /<header class="site-header" data-header data-variant="(light|halo)">/);
  assert.match(css, /\.wordmark \.logo \{ display: block; height: clamp\(2\.1rem, 1\.4rem \+ 2\.6vw, 2\.6rem\);/);
});
