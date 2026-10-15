import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pages, sitemap } from '../src/build.mjs';
import config from '../src/config.json' with { type: 'json' };

const SITE = 'https://mrlololi.github.io';
const fixedDate = new Date('2026-10-15T12:00:00Z');
const all = pages(config, { buildDate: fixedDate });
const byFile = Object.fromEntries(all.map((p) => [p.file, p.html]));
const count = (html, re) => (html.match(re) || []).length;

const expected = {
  'index.html': { lang: 'de', url: `${SITE}/` },
  'en/index.html': { lang: 'en', url: `${SITE}/en/` },
  'impressum/index.html': { lang: 'de', url: `${SITE}/impressum/` },
  'datenschutz/index.html': { lang: 'de', url: `${SITE}/datenschutz/` },
  'en/legal-notice/index.html': { lang: 'en', url: `${SITE}/en/legal-notice/` },
  'en/privacy/index.html': { lang: 'en', url: `${SITE}/en/privacy/` },
  '404.html': { lang: 'de', url: null },
};

test('builds exactly the seven pages', () => {
  assert.deepEqual(all.map((p) => p.file).sort(), Object.keys(expected).sort());
});

for (const [file, { lang, url }] of Object.entries(expected)) {
  test(`${file}: structure, language and skip link`, () => {
    const html = byFile[file];
    assert.ok(html.startsWith('<!doctype html>'));
    assert.match(html, new RegExp(`<html lang="${lang}"`));
    assert.equal(count(html, /<h1[\s>]/g), 1, 'exactly one h1');
    assert.match(html, /<a class="skip" href="#main">/);
    assert.equal(count(html, /<main id="main"/g), 1);
    assert.match(html, /<title>[^<]+<\/title>/);
    assert.match(html, /<meta name="description" content="[^"]+">/);
  });

  test(`${file}: no third-party hosts referenced`, () => {
    const html = byFile[file];
    for (const host of ['fonts.googleapis', 'fonts.gstatic', 'cdn.', 'unpkg', 'jsdelivr', 'googletagmanager']) {
      assert.ok(!html.includes(host), `${host} found`);
    }
  });

  if (url) {
    test(`${file}: canonical and hreflang alternates`, () => {
      const html = byFile[file];
      assert.match(html, new RegExp(`<link rel="canonical" href="${url}">`));
      assert.equal(count(html, /<link rel="alternate" hreflang="(de|en|x-default)"/g), 3);
      assert.match(html, /hreflang="x-default" href="https:\/\/mrlololi\.github\.io\/(impressum\/|datenschutz\/)?"/);
      assert.match(html, new RegExp(`<meta property="og:url" content="${url}">`));
      assert.match(html, /<meta property="og:image" content="https:\/\/mrlololi\.github\.io\/og-image-(de|en)\.png">/);
      assert.match(html, /<meta name="twitter:card" content="summary_large_image">/);
    });
  }
}

test('404 is noindex and links home', () => {
  assert.match(byFile['404.html'], /<meta name="robots" content="noindex">/);
  assert.match(byFile['404.html'], /href="\/"/);
});

test('home pages carry ProfessionalService JSON-LD without a street', () => {
  for (const file of ['index.html', 'en/index.html']) {
    const m = byFile[file].match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    assert.ok(m, 'JSON-LD missing');
    const data = JSON.parse(m[1]);
    assert.equal(data['@type'], 'ProfessionalService');
    assert.equal(data.priceRange, '€€');
    assert.deepEqual(data.areaServed, ['AT', 'DE', 'CH']);
    assert.equal(data.address.postalCode, '8020');
    assert.equal(data.address.addressLocality, 'Graz');
    assert.equal(data.address.streetAddress, undefined);
    assert.deepEqual(data.founder.sameAs, [config.linkedin, config.malt]);
  }
});

test('language switch points to the equivalent page', () => {
  assert.match(byFile['impressum/index.html'], /<a [^>]*href="\/en\/legal-notice\/"[^>]*hreflang="en"/);
  assert.match(byFile['en/privacy/index.html'], /<a [^>]*href="\/datenschutz\/"[^>]*hreflang="de"/);
  assert.match(byFile['index.html'], /<a [^>]*href="\/en\/"[^>]*hreflang="en"/);
});

test('at most two font preloads per page', () => {
  for (const html of Object.values(byFile)) {
    assert.ok(count(html, /rel="preload"[^>]*as="font"/g) <= 2);
  }
});

test('Impressum: facts from CONTENT.md, full address, no ODR link', () => {
  const html = byFile['impressum/index.html'];
  assert.match(html, /GISA-Zahl/);
  assert.match(html, /40197975/);
  assert.match(html, /Herbersteinstraße 4\/4181<br>8020 Graz, Österreich/);
  assert.match(html, /Medieninhaber<\/dt>\n<dd>Iva Tsatskrialashvili, Herbersteinstraße 4\/4181, 8020 Graz<\/dd>/);
  assert.match(byFile['datenschutz/index.html'], /Herbersteinstraße 4\/4181, 8020 Graz, Österreich/);
  assert.match(byFile['en/legal-notice/index.html'], /Herbersteinstraße 4\/4181<br>8020 Graz, Austria/);
  assert.match(html, /Kleinunternehmer gemäß § 6 Abs\. 1 Z 27 UStG/);
  assert.match(html, /Offenlegung gemäß § 25 Mediengesetz/);
  assert.match(html, /href="mailto:ivikosha@gmail\.com"/);
  assert.ok(!/odr|online-streitbeilegung/i.test(html));
  assert.match(byFile['en/legal-notice/index.html'], /Trade register number \(GISA\)/);
  assert.match(byFile['en/legal-notice/index.html'], /Disclosure under § 25 Austrian Media Act/);
});

test('privacy: build date as Stand / Last updated', () => {
  assert.match(byFile['datenschutz/index.html'], /Stand: 15\.10\.2026/);
  assert.match(byFile['en/privacy/index.html'], /Last updated: 15 October 2026/);
});

test('privacy: DPF sentence only when verified', () => {
  const on = pages({ ...config, github_dpf_verified: true }, { buildDate: fixedDate }).find((p) => p.file === 'datenschutz/index.html').html;
  const off = pages({ ...config, github_dpf_verified: false }, { buildDate: fixedDate }).find((p) => p.file === 'datenschutz/index.html').html;
  assert.match(on, /GitHub ist unter dem EU-US Data Privacy Framework zertifiziert\./);
  assert.ok(!off.includes('Data Privacy Framework'));
});

test('booking button, booking privacy section and UID line are hidden while empty', () => {
  const html = pages({ ...config, booking_url: '', uid: '' }, { buildDate: fixedDate }).map((p) => p.html).join('\n');
  assert.ok(!html.includes('Termin buchen</a>'));
  assert.ok(!html.includes('Book a call</a>'));
  assert.ok(!html.includes('<h2>Terminbuchung</h2>'));
  assert.ok(!html.includes('<dt>UID-Nummer</dt>'));
  assert.ok(!html.includes('<dt>VAT ID</dt>'));
});

test('booking button, booking privacy section and UID line appear when set', () => {
  const html = pages({ ...config, booking_url: 'https://example.com/book', uid: 'ATU12345678' }, { buildDate: fixedDate }).map((p) => p.html).join('\n');
  assert.ok(html.includes('href="https://example.com/book"'));
  assert.ok(html.includes('<h2>Terminbuchung</h2>'));
  assert.ok(html.includes('ATU12345678'));
});

test('404: German text and link to the home page, plus the English line', () => {
  const html = byFile['404.html'];
  assert.match(html, /Diese Seite gibt es nicht\./);
  assert.match(html, /Vielleicht hilft die Startseite weiter\./);
  assert.match(html, /<p class="doc__alt" lang="en">This page doesn't exist\. The home page might help\. <a href="\/en\/">Go to the home page<\/a><\/p>/);
});

test('sitemap lists the six indexable pages with alternates', () => {
  const xml = sitemap(config, fixedDate);
  assert.equal(count(xml, /<url>/g), 6);
  assert.equal(count(xml, /<xhtml:link rel="alternate"/g), 18);
  assert.ok(xml.includes('<loc>https://mrlololi.github.io/en/privacy/</loc>'));
});
