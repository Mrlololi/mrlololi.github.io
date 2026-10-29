// Stage 6b (docs/PROMPT_Stage6b_Korrekturen_2026-10-29.md): corrections after the review.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { pages } from '../src/build.mjs';
import config from '../src/config.json' with { type: 'json' };
import de from '../src/content/de.mjs';
import en from '../src/content/en.mjs';

const all = pages(config, { live: {} });
const byFile = Object.fromEntries(all.map((p) => [p.file, p.html]));
const root = (p) => new URL(`../${p}`, import.meta.url);

test('photos (Iva 29.10.2026): badge F1, «Über mich» Hallstatt again; the others kept in _alt', () => {
  const images = readFileSync(root('src/tools/images.mjs'), 'utf8');
  assert.match(images, /src\('avatar-iva-badge-F1\.jpg'\), 'avatar'/);
  assert.match(images, /src\('about-hallstatt\.jpg'\), 'about'/);
  for (const f of ['src/images/avatar-iva-badge-F1.jpg', 'src/images/about-hallstatt.jpg', 'src/_alt/stage5/img/avatar-laecheln.jpg', 'src/_alt/stage6b/img/about-iva-2026-10-29.jpg', 'src/_alt/stage6b/img/about-680.jpg', 'src/_alt/stage6b/img/avatar-iva-2026-10-29.jpg', 'src/_alt/stage6b/img/avatar-88.jpg']) assert.ok(existsSync(root(f)), f);
  assert.ok(!existsSync(root('src/images/about-iva-2026-10-29.jpg')) && !existsSync(root('src/images/avatar-iva-2026-10-29.jpg')), 'the 6b photos are no longer sources');
  for (const f of ['avatar-44', 'avatar-88', 'about-340', 'about-680']) for (const ext of ['avif', 'webp', 'jpg']) assert.ok(existsSync(root(`assets/img/${f}.${ext}`)), `${f}.${ext}`);
  assert.match(byFile['index.html'], /alt="Iva Tsatskrialashvili"/);
  assert.match(byFile['en/index.html'], /alt="Iva Tsatskrialashvili"/);
});

test('softer claims: no «nichts bricht», no «nie Ihr Passwort», no course clients in four countries, the welcome mail is sent', () => {
  for (const { file, html } of all) {
    assert.ok(!/nichts bricht|nothing breaks|nie Ihr Passwort|never your password|in bis zu 4 Stunden erledigt|done in up to 4 hours/.test(html), file);
    assert.ok(!/Online-Kursanbieter:innen in Deutschland|online course creators in Germany/.test(html), `${file}: course clients in four countries`);
  }
  assert.ok(de.hero.flow.lines[1].includes('Willkommens-Mail wird verschickt'));
  assert.match(byFile['launch-technik/index.html'], /damit zum Verkaufsstart keine Anmeldung verloren geht\./);
  assert.equal(de.s6.pricing.cards.quick.line, 'Eine konkrete Aufgabe, Aufwand bis zu 4 Stunden.');
  assert.equal(de.s6.pricing.cards.quick.bullets[0], 'E-Mail-Zustellung (SPF, DKIM, DMARC)');
});

test('references: the course card with tools, the honest line and the video link; CMX with its support line; the H2 like the others', () => {
  const h = byFile['index.html'];
  const course = h.match(/<li class="ref card ref--course">[\s\S]*?<\/li>\n<li/)[0];
  for (const tool of de.s6.b.refs.tools) assert.ok(course.includes(`<li>${tool}</li>`), tool);
  assert.match(course, /Laufende Zusammenarbeit seit April 2026, Name nicht genannt\./);
  assert.match(course, /<a class="text-link" href="#video">Ablauf im Video ansehen<\/a>/);
  assert.match(h, /Daher kenne ich Support-Teams von innen, die Grundlage für die KI-Antwortentwürfe\./);
  assert.match(h, /<h2 id="refs-title" data-enter="lines">Arbeit und <em class="accent">Referenzen<\/em><\/h2>/);
  assert.ok(!/\d+ ?%|Workflows, 0/.test(course), 'no invented numbers');
});

test('prices: chooser rows with an arrow, rows with a small outline «Anfragen», «Beispiel ansehen» on the KI row', () => {
  const h = byFile['index.html'];
  assert.equal((h.match(/<a class="chooser__row" href="#pkg-\w+"><span>[^<]+<\/span><span class="chooser__to"><span aria-hidden="true">→<\/span> <strong>/g) || []).length, 5);
  assert.equal((h.match(/class="btn btn--secondary btn--sm row__ask"/g) || []).length, 3);
  // Stage 6e: a visible secondary button with a small mail icon.
  assert.match(h, /<a class="btn btn--secondary btn--sm row__example" href="\/ki-antwortentwuerfe\/#ki-demo"><svg class="row__icon"[^>]*>[\s\S]*?<\/svg>Beispiel ansehen<\/a>/);
  const support = h.match(/<li class="row card[^"]*" id="pkg-support">[\s\S]*?<\/li>/)[0];
  assert.ok(!/row__more/.test(support), 'Betreuung without «Mehr …»');
});

test('video: flat posters from the film, a quiet CTA line under the block', () => {
  const tools = readFileSync(root('src/tools/stage6-images.mjs'), 'utf8');
  assert.match(tools, /video-poster-16x9\.png/);
  assert.ok(!/a_cover\.png/.test(tools), 'no 3D cover poster');
  assert.match(byFile['index.html'], /<p class="vid__cta"><span>Fragen zu Ihrem Ablauf\? 20 Minuten, kostenlos\.<\/span> <a class="btn btn--secondary btn--sm" href="#contact">Kostenloses Erstgespräch<\/a><\/p>/);
});

test('404: «Repariert. Hier geht es weiter:» under the scene', () => {
  assert.match(byFile['404.html'], /<\/div>\n<p class="nf__caption">Repariert\. Hier geht es weiter:<\/p>\n<p class="nf__ctl"><button class="loopctl[^"]*"[\s\S]*?<\/p>\n<h1>Hier ist die Leitung unterbrochen\.<\/h1>/);
});

test('contact mail in EN: «not decided yet» as its own sentence', async () => {
  const { briefMail } = await import('../assets/js/pure.js');
  const m = briefMail(en.s4.contact, { what: 'a workshop', via: 'not decided yet', issue: 'payments', start: 'right away' });
  assert.match(m.body, /^Hello Iva,\n\nI sell a workshop\. The platform is not decided yet\./);
});
