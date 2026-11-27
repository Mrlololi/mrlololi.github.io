// December release R2 «Eine Tür» (docs/PROMPT_Dezember_Eine_Tuer_2026-11-24.md): Technik-Check + Musterbericht as
// one door on every page that sells, the hero link, the card wording without «Lesezugriff», the booking block and
// the quiet talk link, /qualitaet/ with the Technik-Check exit, package buttons to the page's own form.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import config from '../src/config.json' with { type: 'json' };
import de from '../src/content/de.mjs';
import { pages } from '../src/build.mjs';

const by = Object.fromEntries(pages(config, { articles: [] }).map((p) => [p.file, p.html.replace(/ /g, ' ')]));
const R = '/musterbericht/technik-check/';
const door = (h) => { const i = h.indexOf('<div class="svc-door'); return i < 0 ? '' : h.slice(i, h.indexOf('</div>', i)); };
const before = (h, a, b) => h.indexOf(a) >= 0 && h.indexOf(a) < h.indexOf(b);

test('1. /launch-technik/: the check door before «So läuft es ab», report and local request', () => {
  const h = by['launch-technik/index.html'];
  const d = door(h);
  assert.ok(d.includes('<p><strong>Noch nicht sicher, was fehlt?</strong> Im Technik-Check gehe ich Ihren Ablauf einen Tag lang wie eine Käuferin durch, im Testmodus bis in den Kurs. 290 € fix, bei Auftrag angerechnet.</p>'));
  assert.ok(d.includes(`<a class="text-link" href="${R}">So sieht ein Bericht aus</a>`));
  assert.ok(d.includes('<a class="text-link" href="/launch-technik/?paket=check#svc-form">Technik-Check anfragen</a>'));
  assert.ok(before(h, '<div class="svc-door', '>So läuft es ab</h2>'));
});

test('1. spam and ActiveCampaign: Quick-Fix first, then the Technik-Check with the report; KI and website: one link', () => {
  for (const f of ['e-mails-landen-im-spam/index.html', 'activecampaign-einrichten/index.html']) {
    const d = door(by[f]);
    assert.ok(before(d, 'Ein klares Problem? Quick-Fix, 190 € fix.', 'Hakt es an mehreren Stellen? Technik-Check, 290 €'), f);
    assert.ok(d.includes(`<a class="text-link" href="${R}">So sieht ein Bericht aus</a>`), f);
  }
  for (const f of ['website-one-pager/index.html', 'ki-antwortentwuerfe/index.html']) {
    const d = door(by[f]);
    assert.ok(d.includes(`<a class="text-link" href="${R}">So sieht ein Technik-Bericht aus</a>`), f);
    assert.equal((d.match(/<a /g) || []).length, 1, `${f}: one text link only`);
  }
  for (const f of ['en/course-launch-tech/index.html', 'en/emails-going-to-spam/index.html', 'en/activecampaign-setup/index.html', 'en/ai-reply-drafts/index.html', 'en/one-page-website/index.html']) {
    assert.ok(door(by[f]).includes(`<a class="text-link" href="${R}">Sample report (in German)</a>`), f);
  }
});

test('2. home hero: «Preise ansehen» stays, one text link under the trust line (DE; EN marked as German)', () => {
  const h = by['index.html'];
  assert.ok(h.includes('<p class="hero__proof">'));
  assert.ok(h.includes(`<p class="hero__report"><a class="text-link" href="${R}">So sieht ein Technik-Bericht aus (Beispiel)</a></p>`));
  assert.ok(h.indexOf('<p class="hero__report">') > h.indexOf('<p class="hero__proof">'));
  assert.ok(h.includes('href="#pricing">Preise ansehen</a>') || h.includes('href="#pricing">'), 'prices link stays');
  assert.ok(by['en/index.html'].includes(`<p class="hero__report"><a class="text-link" href="${R}">Sample report (in German)</a></p>`));
});

test('3. Technik-Check card: buyer sentence and password sentence, no «Lesezugriff»; price, talk and crediting stay', () => {
  const h = by['index.html'];
  const c = h.slice(h.indexOf('id="pkg-check"'), h.indexOf('id="pkg-launch"'));
  assert.ok(c.includes('Ich gehe Ihren Kauf wie eine Käuferin durch: im Testmodus, bis in den Kurs hinein.'));
  assert.ok(c.includes('<p class="item__note small">Ich bitte Sie nie um Ihr Passwort. Wo ein Tool keinen eigenen Zugang kennt, arbeiten wir gemeinsam per Bildschirmfreigabe.</p>'));
  assert.ok(c.includes('290 € fix') && c.includes('45-Minuten-Auswertungsgespräch') && c.includes('Bei Auftrag innerhalb von 30 Tagen voll angerechnet'));
  for (const [f, x] of Object.entries(by)) assert.ok(!/Lesezugriff|read access/.test(x), f);
});

test('4. Musterbericht: booking block on top, the quiet talk link under the priced exit; Ein Kauf the same; one button each', () => {
  const m = by['musterbericht/technik-check/index.html'];
  const top = m.slice(m.indexOf('<main'), m.indexOf('</section>'));
  assert.ok(top.includes('<p class="mb-book">Technik-Check, 290 € fix. Ein Tag, eigener Zugang, bei Auftrag angerechnet. <a class="text-link" href="/?paket=check&amp;quelle=musterbericht#contact">Technik-Check anfragen</a></p>'));
  assert.ok(m.includes('</a>\n<p class="mb-talk"><a class="text-link" href="/?quelle=musterbericht#contact">Lieber erst reden? 20 Minuten, kostenlos</a></p>'));
  const e = by['werkzeuge/ein-kauf/index.html'];
  assert.ok(e.includes('</a>\n<p class="ek-talk"><a class="text-link" href="/?quelle=ein-kauf#contact">Lieber erst reden? 20 Minuten, kostenlos</a></p>'));
  for (const h of [m, e]) {
    const main = h.slice(h.indexOf('<main'), h.indexOf('</main>'));
    assert.equal((main.match(/class="btn btn--primary"/g) || []).length, 1, 'the priced exit stays the only button');
  }
});

test('5. /qualitaet/: the claim under the H1, the Technik-Check exit; linked from the footer only', () => {
  const q = by['qualitaet/index.html'];
  assert.ok(q.includes('<h1 id="q-h">Prüfprotokoll dieser Website</h1>\n<p class="q-claim">So arbeite ich auch in Ihren Konten: erst prüfen, dann veröffentlichen.</p>'));
  assert.ok(q.includes('<p class="q-exit__lead">Ihren Launch vor dem Start prüfen lassen:</p>\n<a class="btn btn--primary" href="/?paket=check&amp;quelle=qualitaet#contact">Technik-Check, 290 €</a>'));
  for (const [f, h] of Object.entries(by)) {
    // The website pages keep their «So teste ich diese Website» link (svc-testlink, Stage 7b-S); no other body link.
    if (f === 'qualitaet/index.html' || /svc-testlink/.test(h)) continue;
    const body = h.slice(h.indexOf('<main'), h.indexOf('</main>'));
    assert.ok(!body.includes('href="/qualitaet/"'), `${f}: /qualitaet/ only in the footer`);
  }
});

test('6. service pages: package «Anfragen» buttons to the own form, package preselected by ?paket=', () => {
  for (const s of de.services.pages) {
    const h = by[`${s.path.slice(1)}index.html`];
    for (const id of s.packages) assert.ok(h.includes(`href="${s.path}?paket=${id}#svc-form"`), `${s.path} ${id}`);
    assert.ok(!/class="btn btn--sm btn--primary" href="\/\?paket=/.test(h), `${s.path}: no package button to the home page`);
  }
});
