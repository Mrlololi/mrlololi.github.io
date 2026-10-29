// Legal 29.10.2026 (docs/PROMPT_Legal_2026-10-29.md): UID, phone as the second contact (§ 5 ECG),
// § 25 MedienG lines, the Ratgeber tax note and advertising line, the legal date.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pages, sitemap } from '../src/build.mjs';
import { parseArticle } from '../src/ratgeber.mjs';
import config from '../src/config.json' with { type: 'json' };

const all = pages(config);
const html = (f) => all.find((p) => p.file === f).html;
const LEGAL = ['impressum/index.html', 'en/legal-notice/index.html'];

test('UID from config on both legal pages', () => {
  assert.equal(config.uid, 'ATU83778137');
  assert.match(html(LEGAL[0]), /<dt>UID-Nummer<\/dt>\n<dd>ATU83778137<\/dd>/);
  assert.match(html(LEGAL[1]), /<dt>VAT ID<\/dt>\n<dd>ATU83778137<\/dd>/);
});

test('phone directly under the e-mail on both legal pages, as a tel: link', () => {
  assert.equal(config.phone, '+43 677 63461404');
  const link = '<a href="tel:+4367763461404">+43 677 63461404</a>';
  assert.ok(html(LEGAL[0]).includes(`E-Mail: <a href="mailto:hello@mrlololi.com">hello@mrlololi.com</a><br>\nTelefon: ${link}</address>`));
  assert.ok(html(LEGAL[1]).includes(`Email: <a href="mailto:hello@mrlololi.com">hello@mrlololi.com</a><br>\nPhone: ${link}</address>`));
});

test('phone only in the Impressum: no other page, no JSON-LD', () => {
  for (const { file, html: h } of all) {
    if (LEGAL.includes(file)) continue;
    assert.ok(!/63461404|tel:/.test(h), file);
  }
  for (const f of LEGAL) {
    const ld = [...html(f).matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('');
    assert.ok(!/63461404|telephone/.test(ld), `${f} JSON-LD`);
    assert.equal((html(f).match(/63461404/g) || []).length, 2, `${f}: once (href and text)`);
  }
});

test('Offenlegung gemäß § 25 MedienG: owner unchanged, business and editorial line', () => {
  const de = html(LEGAL[0]).split('id="disclosure"')[1];
  assert.match(de, /<dt>Medieninhaber<\/dt>\n<dd>Iva Tsatskrialashvili, Herbersteinstraße 4\/4181, 8020 Graz, Österreich<\/dd>/);
  assert.match(de, /<dt>Unternehmensgegenstand<\/dt>\n<dd>Werbeagentur \(E-Mail-Marketing, Online-Kurs-Technik, Marketing-Automatisierung\)<\/dd>/);
  assert.match(de, /<dt>Grundlegende Richtung<\/dt>\n<dd>Information über die Dienstleistungen von mrlololi sowie fachliche Beiträge zu E-Mail-Marketing, Online-Kurs-Technik und Marketing-Automatisierung\.<\/dd>/);
  const en = html(LEGAL[1]).split('id="disclosure"')[1];
  assert.match(en, /<dt>Media owner<\/dt>\n<dd>Iva Tsatskrialashvili, Herbersteinstraße 4\/4181, 8020 Graz, Austria<\/dd>/);
  assert.match(en, /<dt>Business<\/dt>\n<dd>advertising agency \(email marketing, online course tech, marketing automation\)<\/dd>/);
  assert.match(en, /<dt>Basic editorial line<\/dt>\n<dd>Information about the services of mrlololi and articles on email marketing, online course tech and marketing automation\.<\/dd>/);
});

test('price line under the prices unchanged', () => {
  assert.match(html('index.html'), /Als Kleinunternehmer gemäß § 6 Abs\. 1 Z 27 UStG weise ich keine Umsatzsteuer aus\. Bei Unternehmen mit gültiger UID in einem anderen EU-Mitgliedstaat geht die Steuerschuld auf den Leistungsempfänger über \(Reverse Charge\)\./);
});

test('legal date 29.10.2026 and sitemap lastmod for Impressum and legal notice', () => {
  assert.equal(config.page_dates.legal, '2026-10-29');
  const xml = sitemap(config);
  for (const loc of ['impressum/', 'en/legal-notice/']) assert.match(xml, new RegExp(`<loc>https://mrlololi\\.com/${loc}</loc>\\s*<lastmod>2026-10-29</lastmod>`), loc);
});

const article = (extra) => parseArticle(`---
title: Testartikel Steuer
description: Platzhalter, wird nie veröffentlicht.
slug: steuer-test
datePublished: 2026-11-02
dateModified: 2026-12-03
package: launch
${extra}---
Einleitung.
`);
const render = (a) => pages({ ...config, ratgeber_live: true }, { articles: [a] }).find((p) => p.file === `ratgeber/${a.slug}/index.html`).html;

test('Ratgeber: tax: true adds the note box with Stand from dateModified', () => {
  const h = render(article('tax: true\n'));
  assert.ok(h.includes('<p class="ratgeber-note">Dieser Beitrag dient der allgemeinen Information und ersetzt keine Steuer- oder Rechtsberatung. Stand: Dezember 2026.</p>'));
  assert.ok(h.indexOf('class="ratgeber-note"') > h.indexOf('class="ratgeber__body"'), 'at the end of the article');
});

test('Ratgeber: affiliate: true shows the advertising line under the title', () => {
  const h = render(article('affiliate: true\n'));
  assert.match(h, /<h1>Testartikel Steuer<\/h1>\n<p class="ratgeber__ad small">Enthält Werbung \/ Affiliate-Links<\/p>/);
});

test('Ratgeber: neither box without the flags', () => {
  const h = render(article(''));
  assert.ok(!h.includes('class="ratgeber-note"'));
  assert.ok(!h.includes('Affiliate-Links'));
});
