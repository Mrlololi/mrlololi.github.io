// Datenschutz-Ergänzung 28.10.2026: section «Language Starter (Webprojekte)» on /datenschutz/ and /en/privacy/.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pages, sitemap } from '../src/build.mjs';
import config from '../src/config.json' with { type: 'json' };

const all = pages(config);
const html = (f) => all.find((p) => p.file === f).html;

const DE = 'Language Starter (mrlololi.com/Webprojekte/language-starter): Die Funktion „Anhören“ nutzt die Sprachausgabe Ihres Browsers bzw. Geräts. Bei manchen Stimmen, zum Beispiel den „Google“-Stimmen in Google Chrome, wird der vorzulesende Satz zur Umwandlung in Sprache an den Sprachdienst des Browserherstellers übertragen. Wir selbst übermitteln dabei keine Daten. Die App setzt keine Cookies, verwendet kein Tracking und speichert den Lernfortschritt nur lokal in Ihrem Browser (localStorage).';

test('datenschutz: the Language Starter section, word for word, before «Ihre Rechte»', () => {
  const h = html('datenschutz/index.html');
  assert.ok(h.includes(`<section>\n<h2>Language Starter (Webprojekte)</h2>\n<p>${DE}</p>\n</section>`));
  assert.ok(h.indexOf('Language Starter (Webprojekte)') > h.indexOf('<h2>Externe Links</h2>') && h.indexOf('Language Starter (Webprojekte)') < h.indexOf('<h2>Ihre Rechte</h2>'));
});

test('privacy (EN): the same section in English, before «Your rights»', () => {
  const h = html('en/privacy/index.html');
  const sec = h.match(/<section>\n<h2>Language Starter \(Webprojekte\)<\/h2>\n<p>([^<]+)<\/p>\n<\/section>/);
  assert.ok(sec, 'section present');
  for (const part of ['mrlololi.com/Webprojekte/language-starter', 'Google Chrome', 'localStorage', 'no cookies', 'no tracking']) assert.ok(sec[1].includes(part), part);
  assert.ok(h.indexOf('Language Starter') < h.indexOf('<h2>Your rights</h2>'));
});

test('privacy date and sitemap lastmod: 28.10.2026 for both privacy pages only', () => {
  assert.equal(config.page_dates.privacy, '2026-10-28');
  assert.match(html('datenschutz/index.html'), /Stand: 28\.10\.2026/);
  assert.match(html('en/privacy/index.html'), /Last updated: 28 October 2026/);
  const xml = sitemap(config);
  assert.match(xml, /<loc>https:\/\/mrlololi\.com\/datenschutz\/<\/loc>\s*(<[^>]+>\s*)*?<lastmod>2026-10-28<\/lastmod>/);
  assert.equal((xml.match(/<lastmod>2026-10-28<\/lastmod>/g) || []).length, 2);
});
