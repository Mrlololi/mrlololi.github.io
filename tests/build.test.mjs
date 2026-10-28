import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pages, sitemap, cname } from '../src/build.mjs';
import config from '../src/config.json' with { type: 'json' };

const SITE = config.site_url.replace(/\/$/, '');
const SITE_RE = SITE.replace(/[.]/g, '\\.').replace(/\//g, '\\/');

test('the site lives on its own domain (Iva, 2026-10-15)', () => {
  assert.equal(SITE, 'https://mrlololi.com');
  assert.equal(config.projects_url, 'https://mrlololi.com/Webprojekte/');
});

test('CNAME is derived from site_url and committed at the repo root', () => {
  assert.equal(cname(config), 'mrlololi.com\n');
  assert.equal(cname({ ...config, site_url: 'https://mrlololi.github.io' }), null);
  assert.equal(readFileSync(new URL('../CNAME', import.meta.url), 'utf8'), 'mrlololi.com\n');
});
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

// Stage 5 added the ten service pages (tests/stage5-seo.test.mjs checks them).
test('builds the seven original pages plus the ten service pages', () => {
  const SERVICE = /^(en\/)?(launch-technik|e-mails-landen-im-spam|activecampaign-einrichten|ki-antwortentwuerfe|website-one-pager|course-launch-tech|emails-going-to-spam|activecampaign-setup|ai-reply-drafts|one-page-website)\/index\.html$/;
  assert.deepEqual(all.map((p) => p.file).filter((f) => !SERVICE.test(f)).sort(), Object.keys(expected).sort());
  assert.equal(all.length, 17);
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
      assert.match(html, new RegExp(`hreflang="x-default" href="${SITE_RE}\\/(impressum\\/|datenschutz\\/)?"`));
      assert.match(html, new RegExp(`<meta property="og:url" content="${url}">`));
      assert.match(html, new RegExp(`<meta property="og:image" content="${SITE_RE}\\/og-image-(de|en)\\.png">`));
      assert.ok(!html.includes('mrlololi.github.io'), 'old github.io address left in the page');
      assert.match(html, /<meta name="twitter:card" content="summary_large_image">/);
    });
  }
}

test('404 is noindex and links home', () => {
  assert.match(byFile['404.html'], /<meta name="robots" content="noindex">/);
  assert.match(byFile['404.html'], /href="\/"/);
});

test('home pages carry ProfessionalService JSON-LD with the Impressum address (Fixes 21.10.2026)', () => {
  for (const file of ['index.html', 'en/index.html']) {
    const m = byFile[file].match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    assert.ok(m, 'JSON-LD missing');
    const data = JSON.parse(m[1])['@graph'].find((n) => n['@type'] === 'ProfessionalService');
    assert.equal(data.priceRange, '€€');
    assert.deepEqual(data.areaServed, ['AT', 'DE', 'CH', 'IT']);
    assert.equal(data.address.postalCode, '8020');
    assert.equal(data.address.addressLocality, 'Graz');
    assert.equal(data.address.streetAddress, 'Herbersteinstraße 4/4181');
    // Stage 5: the founder is a reference to the full Person node.
    assert.deepEqual(data.founder, { '@id': 'https://mrlololi.com/#iva' });
    const iva = JSON.parse(m[1])['@graph'].find((n) => n['@id'] === 'https://mrlololi.com/#iva');
    assert.deepEqual(iva.sameAs.slice(0, 2), [config.linkedin, config.malt]);
  }
});

test('language switch points to the equivalent page', () => {
  assert.match(byFile['impressum/index.html'], /<a [^>]*href="\/en\/legal-notice\/"[^>]*hreflang="en"/);
  assert.match(byFile['en/privacy/index.html'], /<a [^>]*href="\/datenschutz\/"[^>]*hreflang="de"/);
  assert.match(byFile['index.html'], /<a [^>]*href="\/en\/"[^>]*hreflang="en"/);
});

test('at most three font preloads per page', () => {
  for (const html of Object.values(byFile)) {
    assert.ok(count(html, /rel="preload"[^>]*as="font"/g) <= 3);
  }
});

test('Impressum: facts from CONTENT.md, full address, no ODR link', () => {
  const html = byFile['impressum/index.html'];
  assert.match(html, /GISA-Zahl/);
  assert.match(html, /40197975/);
  assert.match(html, /Herbersteinstraße 4\/4181<br>8020 Graz, Österreich/);
  assert.match(html, /Medieninhaber<\/dt>\n<dd>Iva Tsatskrialashvili, Herbersteinstraße 4\/4181, 8020 Graz, Österreich<\/dd>/);
  assert.match(byFile['datenschutz/index.html'], /Herbersteinstraße 4\/4181, 8020 Graz, Österreich/);
  assert.match(byFile['en/legal-notice/index.html'], /Herbersteinstraße 4\/4181<br>8020 Graz, Austria/);
  assert.match(html, /Kleinunternehmer gemäß § 6 Abs\. 1 Z 27 UStG/);
  assert.match(html, /Offenlegung gemäß § 25 Mediengesetz/);
  assert.match(html, /href="mailto:hello@mrlololi\.com"/);
  assert.ok(!/odr|online-streitbeilegung/i.test(html));
  assert.match(byFile['en/legal-notice/index.html'], /GISA number \(Austrian trade register\)/);
  assert.match(byFile['en/legal-notice/index.html'], /Disclosure under § 25 Austrian Media Act/);
});

test('privacy: page date as Stand / Last updated', () => {
  assert.match(byFile['datenschutz/index.html'], /Stand: 28\.10\.2026/);
  assert.match(byFile['en/privacy/index.html'], /Last updated: 28 October 2026/);
});

test('privacy: DPF sentence only when verified', () => {
  const on = pages({ ...config, github_dpf_verified: true }, { buildDate: fixedDate }).find((p) => p.file === 'datenschutz/index.html').html;
  const off = pages({ ...config, github_dpf_verified: false }, { buildDate: fixedDate }).find((p) => p.file === 'datenschutz/index.html').html;
  assert.match(on, /GitHub ist unter dem EU-US Data Privacy Framework zertifiziert; die Übermittlung in die USA stützt sich darauf \(Art\. 45 DSGVO\)\./);
  assert.ok(!off.includes('GitHub ist unter dem EU-US Data Privacy Framework'));
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

test('sitemap lists the sixteen indexable pages with alternates (Stage 5: plus ten service pages)', () => {
  const xml = sitemap(config, fixedDate);
  assert.equal(count(xml, /<url>/g), 16);
  assert.equal(count(xml, /<xhtml:link rel="alternate"/g), 48);
  assert.ok(xml.includes(`<loc>${SITE}/en/privacy/</loc>`));
});
