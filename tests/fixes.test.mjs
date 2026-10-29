// Fixes 21.10.2026 (docs/PROMPT_Fixes_2026-10-21.md): SEO, publishing, legal and wording.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { pages, sitemap } from '../src/build.mjs';
import { robots } from '../src/templates/seo.mjs';
import config from '../src/config.json' with { type: 'json' };
import de from '../src/content/de.mjs';
import en from '../src/content/en.mjs';

const at = (date) => pages(config, { buildDate: new Date(date) });
const all = at('2026-10-21T12:00:00Z');
const html = (file) => all.find((p) => p.file === file).html;
const deHome = html('index.html');
const enHome = html('en/index.html');
const root = (f) => new URL(`../${f}`, import.meta.url);

test('JSON-LD: business with @id, street, logo, sameAs, IT; a WebSite node; no inLanguage on the business', () => {
  const data = JSON.parse(deHome.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const biz = data['@graph'].find((n) => n['@type'] === 'ProfessionalService');
  const site = data['@graph'].find((n) => n['@type'] === 'WebSite');
  assert.equal(data['@context'], 'https://schema.org');
  assert.equal(biz['@id'], 'https://mrlololi.com/#business');
  assert.equal(biz.inLanguage, undefined);
  assert.equal(biz.address.streetAddress, 'Herbersteinstraße 4/4181');
  assert.equal(biz.address.postalCode, '8020');
  assert.match(biz.logo, /^https:\/\/mrlololi\.com\/assets\/brand\/.+\.(png|svg)$/);
  assert.deepEqual(biz.sameAs, [config.linkedin, config.malt]);
  assert.deepEqual(biz.areaServed, ['AT', 'DE', 'CH', 'IT']);
  assert.equal(site['@id'], 'https://mrlololi.com/#website');
  assert.equal(site.url, 'https://mrlololi.com/');
  assert.equal(site.publisher['@id'], biz['@id']);
  assert.equal(site.inLanguage, 'de');
});

test('robots.txt keeps the source tree out of search', () => {
  const r = robots(config);
  for (const p of ['/src/', '/tests/', '/README.md', '/package.json', '/package-lock.json']) assert.match(r, new RegExp(`^Disallow: ${p.replace(/\./g, '\\.')}$`, 'm'));
  assert.match(r, /^Sitemap: https:\/\/mrlololi\.com\/sitemap\.xml$/m);
  assert.ok(readFileSync(root('README.md'), 'utf8').trim().split('\n').length <= 3, 'public README is one line');
});

test('favicon.ico at the root and a web manifest', () => {
  assert.ok(existsSync(root('favicon.ico')));
  const m = JSON.parse(readFileSync(root('site.webmanifest'), 'utf8'));
  assert.equal(m.name, 'mrlololi');
  assert.equal(m.theme_color, '#F4C9D3');
  assert.ok(m.icons.length >= 2);
  assert.match(deHome, /<link rel="manifest" href="\/site\.webmanifest">/);
});

test('dates come from the content, not from the build day', () => {
  const later = at('2027-03-01T12:00:00Z');
  for (const f of ['datenschutz/index.html', 'en/privacy/index.html']) {
    assert.equal(later.find((p) => p.file === f).html, html(f), f);
  }
  assert.match(html('datenschutz/index.html'), /Stand: 28\.10\.2026/); // Language Starter section, 28.10.2026
  assert.equal(sitemap(config, new Date('2027-03-01')), sitemap(config, new Date('2026-01-01')));
  assert.equal((sitemap(config).match(/<lastmod>2026-10-21<\/lastmod>/g) || []).length, 0, 'Impressum and legal notice moved to 29.10 (Legal 29.10.2026)');
  assert.equal((sitemap(config).match(/<lastmod>2026-10-28<\/lastmod>/g) || []).length, 10, 'home (Stage 4), privacy and six service pages (Stage 5)');
  assert.equal((sitemap(config).match(/<lastmod>2026-10-29<\/lastmod>/g) || []).length, 6, 'spam and ActiveCampaign pages (Iva 29.10.2026), Impressum and legal notice (Legal 29.10.2026)');
});

test('external links open in a new tab and say so', () => {
  for (const [page, hint] of [[deHome, '(öffnet in neuem Tab)'], [enHome, '(opens in a new tab)']]) {
    const ext = [...page.matchAll(/<a [^>]*href="(https?:\/\/[^"]+)"[^>]*>[\s\S]*?<\/a>/g)].filter((m) => !m[1].startsWith('https://mrlololi.com/') || m[1].includes('/Webprojekte/'));
    assert.ok(ext.length >= 4, `${ext.length} external links`);
    for (const [a] of ext) {
      assert.match(a, /target="_blank"/, a);
      assert.match(a, /rel="noopener"/, a);
      assert.ok(a.includes(`<span class="sr-only"> ${hint}</span>`), a);
    }
  }
});

test('footers: same structure and the agreed copyright lines', () => {
  const foot = (p) => p.match(/<footer[\s\S]*?<\/footer>/)[0];
  const shape = (f) => f.replace(/>[^<]*</g, '><').replace(/ (href|hreflang|lang|aria-label)="[^"]*"/g, '');
  assert.equal(shape(foot(deHome)), shape(foot(enHome)));
  assert.match(foot(deHome), /© 2026 Iva Tsatskrialashvili · Werbeagentur · Graz, Österreich/);
  assert.match(foot(enHome), /© 2026 Iva Tsatskrialashvili · Advertising agency \(Werbeagentur\) · Graz, Austria/);
});

test('performance hints: three font preloads incl. the accent, module preloads, one .calc__fields rule set', () => {
  assert.equal((deHome.match(/<link rel="preload"[^>]*as="font"/g) || []).length, 3);
  assert.match(deHome, /<link rel="preload" href="\/assets\/fonts\/eb-garamond-italic-500\.woff2" as="font" type="font\/woff2" crossorigin>/);
  // finder.js now comes with the lazy chat module (Stage 4).
  for (const m of ['demos', 'calc', 'loops']) assert.match(deHome, new RegExp(`<link rel="modulepreload" href="/assets/js/${m}\\.js"`));
  const css = readFileSync(root('assets/css/main.css'), 'utf8');
  assert.equal((css.match(/^\.calc__fields \{/gm) || []).length, 1);
});

test('wording: new strings exist in DE and EN alike', () => {
  for (const t of [de, en]) {
    assert.equal(t.pricing.groups[1].items[0].bullets.length, 5);
    assert.ok(t.contact.free.includes('20'));
    assert.ok(!/Cart-Open|cart open|\(DSGVO\)\.|\(GDPR\)\.|Strecke/.test(JSON.stringify(t)));
  }
  assert.match(deHome, /<ul class="item__bullets" role="list">(<li>[^<]+<\/li>){5}<\/ul>/);
  assert.match(deHome, /<p class="contact__free">Das Erstgespräch \(20 Minuten\) ist kostenlos\.<\/p>/);
  assert.match(deHome, /„\[…\] halten wir Iva Tsatskrialashvili/);
  assert.match(deHome, /Übersetzung: „Er war außerdem sehr anpassungsfähig/);
  assert.match(enHome, /subject=Enquiry%20via%20mrlololi\.com/);
  assert.match(deHome, /<input class="ba__range" type="range" min="0" max="100" step="1" value="50" aria-valuetext="Vorher 50 %" data-valuetext="Vorher \{v\} %">/);
});

// WCAG relative luminance and contrast ratio for #RRGGBB.
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };

test('«Freigegeben» button: white on the darker green reaches 4.5:1', () => {
  const css = readFileSync(root('assets/css/main.css'), 'utf8');
  const bg = css.match(/\.kidemo__actions \.btn\[aria-disabled="true"\] \{[^}]*background: (#[0-9A-Fa-f]{6})/)[1];
  assert.equal(bg, '#3F7531');
  assert.ok(ratio('#FFFFFF', bg) >= 4.5, ratio('#FFFFFF', bg).toFixed(2));
});
