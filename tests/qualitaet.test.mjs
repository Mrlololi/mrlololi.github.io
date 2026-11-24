// Qualität (docs/PROMPT_Qualitaet_und_Wortfilter_2026-11-17.md, part B): /qualitaet/ «Prüfprotokoll dieser
// Website», rendered only from src/content/qualitaet.json (src/qa/protokoll.mjs writes it).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import config from '../src/config.json' with { type: 'json' };
import de from '../src/content/de.mjs';
import en from '../src/content/en.mjs';
import { pages } from '../src/build.mjs';
import { sitemap } from '../src/templates/seo.mjs';
import { scan } from '../src/qa/wortfilter.mjs';

const DATA = new URL('../src/content/qualitaet.json', import.meta.url);
const data = existsSync(DATA) ? JSON.parse(readFileSync(DATA, 'utf8')) : null;
const P = de.qualitaet.path;
const file = (p) => `${p.slice(1)}index.html`;

// A fixture with values that are NOT met, to see that the page shows them as they are.
const fixture = {
  measured: '2026-12-01', commit: 'abc1234', dirty: false,
  tools: { lighthouse: 'L', playwright: 'P', chromium: 'C', axe: 'A', node: 'N' },
  lighthouseRuns: 3, tests: { total: 280, pass: 279, fail: 1 }, gates: { total: 400, pass: 400, fail: 0 },
  summary: { pages: 21, perfLimit: 95, perfMin: 91, perfMax: 100, clsMax: 0.0012, keyboardPassed: 61, keyboardTotal: 63, axeSerious: 2, cookies: 0, external: 1, budget: 'x', budgetOk: true },
  form_live: null, pages: [],
};
const html = (protokoll) => Object.fromEntries(pages(config, { articles: [], protokoll }).map((p) => [p.file, p.html]));

test('qualitaet.json: committed, a full run (not --quick), not older than the newest page date', () => {
  assert.ok(data, 'src/content/qualitaet.json is missing: run node src/qa/protokoll.mjs');
  assert.ok(!data.quick, 'a --quick file is a layout preview only: run the full node src/qa/protokoll.mjs');
  const newest = Object.values(config.page_dates).sort().at(-1);
  assert.ok(data.measured >= newest, `measured ${data.measured} is older than the newest page date ${newest}: run node src/qa/protokoll.mjs`);
  assert.match(data.commit, /^[0-9a-f]{7,}$/);
  for (const k of ['lighthouse', 'playwright', 'chromium', 'axe', 'node']) assert.ok(data.tools[k], k);
  assert.ok(data.lighthouseRuns >= 3);
  // While src/qa/protokoll.mjs measures, these two counts are what it is measuring (still null).
  if (!process.env.PROTOKOLL_RUNNING) assert.ok(Number.isInteger(data.tests.total) && Number.isInteger(data.gates.total), 'test and gate counts');
});

test('the page renders only from the file: no file, no page and no footer link; the fixture values appear as they are', () => {
  const none = html(null);
  assert.ok(!none[file(P)], 'no page without data');
  assert.ok(!Object.values(none).some((h) => h.includes(`href="${P}"`)), 'no link without data');
  const f = html(fixture)[file(P)];
  for (const x of ['Leistung 91 bis 100 von 100 auf 21 Seiten', 'Median aus 3 Läufen', 'Verschiebung (CLS) 0,0012', '61 von 63 Tastatur-Prüfungen ohne Befund', '2 schwere oder kritische Befunde', '0 Cookies, 1 fremde Anfragen', 'noch nicht gemessen', '280 Tests und 400 Prüfschritte, davon 1 mit Befund', 'Commit <code>abc1234</code>', '01.12.2026']) assert.ok(f.includes(x), x);
  // Every row of the fixture is open: «nicht erfüllt», no check icon; nothing is hidden.
  const main = f.slice(f.indexOf('<main'), f.indexOf('</main>'));
  assert.equal((main.match(/q-row--open/g) || []).length, 7);
  assert.equal((main.match(/nicht erfüllt/g) || []).length, 7);
  assert.ok(!/href="#i-check"/.test(main));
});

// The static text of the template's HTML (template literals without their ${…} parts) and its string
// literals carry no digit: every number on the page comes from qualitaet.json (tag names h1, h2 aside).
test('the template types no number: no digit in its HTML text or string literals', () => {
  const src = readFileSync(new URL('../src/templates/qualitaet.mjs', import.meta.url), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const strip = (s) => { let prev; do { prev = s; s = s.replace(/\$\{[^{}]*\}/g, ''); } while (s !== prev); return s; };
  const html = [...strip(src).matchAll(/`([^`]*)`/g)].map((m) => m[1]).join('\n').replace(/<\/?h[1-6]\b/g, '');
  assert.ok(html.includes('<table'), 'the HTML of the page is in the scanned text');
  assert.deepEqual(html.match(/.{0,20}\d.{0,20}/g), null);
  const strings = [...src.matchAll(/'([^'\n]*)'/g)].map((m) => m[1]).filter((s) => /\d/.test(s) && s !== 'utf8');
  assert.deepEqual(strings, []);
});

test('the built page: indexable, DE only, sitemap entry without alternates, exit from the package data', () => {
  const h = html(data)[file(P)];
  assert.ok(h);
  assert.ok(!/name="robots"/.test(h));
  assert.match(h, new RegExp(`<link rel="canonical" href="${config.site_url}${P}">`));
  assert.ok(!/rel="alternate" hreflang/.test(h));
  assert.match(h, /<h1 id="q-h">Prüfprotokoll dieser Website<\/h1>/);
  // R2 (December release): the exit is the Technik-Check, the price without «fix».
  const pkg = de.pricing.groups.flatMap((g) => g.items).find((i) => i.id === 'check');
  assert.ok(h.includes('<p class="q-exit__lead">Ihren Launch vor dem Start prüfen lassen:</p>'));
  assert.ok(h.replace(/\u00a0/g, ' ').includes(`<a class="btn btn--primary" href="/?paket=check&amp;quelle=qualitaet#contact">${pkg.name}, ${pkg.price.replace(/\s*fix$/, '')}</a>`));
  assert.ok(!/class="[^"]*\bmscene\b|data-demo|class="rl/.test(h.slice(h.indexOf('<main'), h.indexOf('</main>'))), 'no mascot scene, no demo in the body');
  const xml = sitemap(config, [], { qualitaet: true });
  assert.match(xml, new RegExp(`<loc>${config.site_url}${P}</loc>\\s*<lastmod>${config.page_dates.qualitaet}</lastmod>\\s*</url>`));
  assert.ok(!en.qualitaet && !Object.keys(html(data)).some((f) => f.startsWith('en/') && f.includes('qual')), 'no EN page');
});

test('footer link «Prüfprotokoll» on every German page, EN pages unchanged; one-pager link', () => {
  const withData = html(data);
  const without = html(null);
  for (const [f, h] of Object.entries(withData)) {
    const isEn = /<html lang="en"/.test(h);
    if (isEn) assert.equal(h, without[f], `${f} unchanged`);
    else assert.ok(h.includes(`<li><a href="${P}">Prüfprotokoll</a></li>`), f);
  }
  assert.ok(withData['website-one-pager/index.html'].includes(`<a class="text-link" href="${P}">So prüfe ich diese Website</a>`));
  assert.ok(!withData['en/one-page-website/index.html'].includes(P));
});

test('Wortfilter: the page carries none of its words', () => {
  const hits = scan([{ page: P, html: html(data)[file(P)] }], de);
  assert.deepEqual(hits, []);
});
