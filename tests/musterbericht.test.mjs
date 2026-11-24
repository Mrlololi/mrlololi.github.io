// Musterbericht Technik-Check (docs/PROMPT_Musterbericht_Technik-Check_2026-11-24.md): /musterbericht/technik-check/
// and its PDF. The texts are the sample report Iva approved on 22.11.2026; the word-for-word comparison with the
// source lives outside the repo (../qa/mb-wortlaut.mjs, the source is not in Git).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import config from '../src/config.json' with { type: 'json' };
import de from '../src/content/de.mjs';
import { pages } from '../src/build.mjs';
import { sitemap } from '../src/templates/seo.mjs';
import { scan } from '../src/qa/wortfilter.mjs';
import { startServer } from '../src/qa/serve.mjs';

const M = de.musterbericht;
const built = pages(config, { articles: [] });
const by = Object.fromEntries(built.map((p) => [p.file, p.html]));
const html = by['musterbericht/technik-check/index.html'];
const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
const root = new URL('../', import.meta.url);
const ld = (h) => [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap((m) => { const j = JSON.parse(m[1]); return j['@graph'] || [j]; });

test('the path is permanent; check_report_url points to it and answers 200 locally (built page)', async () => {
  assert.equal(M.path, '/musterbericht/technik-check/');
  assert.equal(config.check_report_url, M.path);
  const server = await startServer({ root: fileURLToPath(root) });
  try {
    const r = await fetch(`${server.url}${config.check_report_url}`);
    assert.equal(r.status, 200);
    assert.ok((await r.text()).includes(`<h1 id="mb-h">${M.h1}</h1>`), 'the built file is the report');
    const pdf = await fetch(`${server.url}${M.pdf}`);
    assert.equal(pdf.status, 200);
  } finally {
    await server.close();
  }
});

test('the PDF exists, is a PDF and is under 1 MB; the page links it as «Als PDF ansehen»', () => {
  const file = new URL(M.pdf.slice(1), root);
  const size = statSync(file).size;
  assert.ok(size > 10_000 && size < 1_000_000, `${size} bytes`);
  assert.equal(readFileSync(file).subarray(0, 5).toString(), '%PDF-');
  assert.ok(main.includes(`<a class="text-link" href="/musterbericht/technik-check.pdf">Als PDF ansehen</a>`));
});

test('DE only, indexable, in the sitemap with its own date, title and description, OG card', () => {
  assert.match(html, /<html lang="de">/);
  assert.ok(!html.includes('noindex'));
  assert.ok(html.includes('<link rel="canonical" href="https://mrlololi.com/musterbericht/technik-check/">'));
  assert.ok(!/hreflang=/.test(html.slice(0, html.indexOf('</head>'))), 'no alternates');
  assert.match(sitemap(config), new RegExp(`<loc>https://mrlololi.com/musterbericht/technik-check/</loc>\\s*<lastmod>${config.page_dates.musterbericht}</lastmod>`));
  assert.ok(html.includes('<title>Technik-Check: Beispielbericht | mrlololi</title>'));
  // The description is the brief's Entwurf, word for word (171 characters; the report to Iva names the length).
  assert.ok(html.includes(`<meta name="description" content="${M.description}">`));
  assert.ok(html.includes('content="https://mrlololi.com/assets/og/de-musterbericht.png"'));
  statSync(new URL('assets/og/de-musterbericht.png', root));
});

test('the label «Fiktives Beispiel.» comes first, before any section of the report; the header line without «Werbeagentur»', () => {
  const head = main.slice(0, main.indexOf('</section>'));
  assert.ok(head.includes('<p class="mb-fake card card--note"><strong>Fiktives Beispiel.</strong> Die Schule, alle Daten und Befunde sind erfunden.'));
  assert.ok(head.includes('<span>Iva Tsatskrialashvili · Techniker für Marketing-Automation · Graz</span>'));
  assert.ok(main.includes('<span>Iva Tsatskrialashvili · Techniker für Marketing-Automation · Herbersteinstraße 4/4181 · 8020 Graz</span>'));
  assert.ok(!html.includes('Werbeagentur'));
});

test('status and risk as words (never colour alone); all 12 findings in a table that scrolls on phones', () => {
  for (const w of ['kritisch', 'beheben', 'hoch', 'mittel', 'niedrig']) assert.ok(main.includes(`mb-tag">${w}</span>`), w);
  assert.equal((main.match(/<th scope="row" class="mb-nr">\d+<\/th>/g) || []).length, 12);
  assert.ok(main.includes('<div class="mb-scroll" role="region" aria-labelledby="mb-find-h" tabindex="0">'));
  assert.match(readFileSync(new URL('assets/css/musterbericht.css', root), 'utf8'), /\.mb-scroll \{ overflow-x: auto;/);
});

test('one priced exit from the package data, with ?quelle=musterbericht', () => {
  const pkg = de.pricing.groups.flatMap((g) => g.items).find((it) => it.id === 'check');
  const exit = `<a class="btn btn--primary" href="/?paket=check&amp;quelle=musterbericht#contact">${pkg.name}, ${pkg.price.replace(/\s*fix$/, '')}</a>`;
  assert.ok(main.includes('<p class="mb-exit__lead">Ihren Launch so prüfen lassen:</p>'));
  assert.ok(main.replace(/\u00a0/g, ' ').includes(exit), exit); // «290\u00a0€» in the page: number and unit on one line
  assert.equal((main.match(/class="btn btn--primary"/g) || []).length, 1);
});

test('no mascot scene and no motion hooks in the body; the footer keeps its three mascots', () => {
  const article = main.slice(main.indexOf('<article'), main.indexOf('</article>'));
  assert.ok(!/class="mascot|data-mascot|mscene|data-enter|data-demo|data-play/.test(article));
  assert.ok(html.slice(html.indexOf('<footer')).includes('footer-mascots'));
});

test('JSON-LD: a CreativeWork by the Person, about the Technik-Check, the PDF as encoding; no rating', () => {
  const w = ld(html).find((n) => n['@type'] === 'CreativeWork');
  assert.equal(w.author['@id'], 'https://mrlololi.com/#iva');
  assert.equal(w.about.name, 'Technik-Check');
  assert.equal(w.encoding.contentUrl, 'https://mrlololi.com/musterbericht/technik-check.pdf');
  assert.equal(w.isBasedOn, undefined);
  assert.ok(!/"@type":"(AggregateRating|Review|Rating)"/.test(html));
});

test('links to the report: the home card (DE), /activecampaign-einrichten/ and /werkzeuge/ein-kauf/; no other page', () => {
  const linking = Object.entries(by).filter(([f, h]) => f !== 'musterbericht/technik-check/index.html' && h.includes('href="/musterbericht/technik-check/"')).map(([f]) => f).sort();
  assert.deepEqual(linking, ['activecampaign-einrichten/index.html', 'index.html', 'werkzeuge/ein-kauf/index.html']);
  assert.ok(by['index.html'].includes('<a class="item__report text-link" href="/musterbericht/technik-check/">Beispielbericht ansehen</a>'));
  assert.ok(by['activecampaign-einrichten/index.html'].includes('<a class="item__report text-link" href="/musterbericht/technik-check/">So sieht ein Bericht aus</a>'));
  const ek = by['werkzeuge/ein-kauf/index.html'];
  assert.match(ek, /<h2>Wenn Sie das nicht selbst prüfen möchten<\/h2>\n<p>[^<]+<\/p>\n<p><a class="text-link" href="\/musterbericht\/technik-check\/">So sieht ein Bericht aus<\/a><\/p>/);
});

test('Wortfilter: the page is in the scope «document sample» (global list only) and has no hit, the label is there', () => {
  const g = JSON.parse(readFileSync(new URL('src/qa/wortfilter.json', root), 'utf8')).groups.find((x) => x.name === 'document sample');
  assert.deepEqual(g.pages, ['/musterbericht/*']);
  assert.deepEqual(g.words, []);
  assert.deepEqual(scan([{ page: M.path, html }], de).filter((h) => h.page === M.path), []);
});
