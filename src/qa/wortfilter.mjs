// Wortfilter (docs/PROMPT_Qualitaet_und_Wortfilter_2026-11-17.md, part A): words that promise what nobody
// can promise, missing «Beispiel» / «Stand» labels and prices that differ from the package data.
// The rules live in ONE data file, src/qa/wortfilter.json; tests/wortfilter.test.mjs runs this in npm test.
// Hits the scan of 17.11 missed go into src/qa/wortfilter-baseline.json (a ratchet: it may only shrink).
//   node src/qa/wortfilter.mjs     prints every hit of the built pages (main site + German Webprojekte pages)
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import * as kerne from '../content/kerne/launch.de.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const RULES = JSON.parse(readFileSync(path.join(root, 'src/qa/wortfilter.json'), 'utf8'));

/* ---------- visible text ---------- */
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', shy: '' };
const decode = (s) => s
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&([a-z]+);/gi, (m, n) => (n.toLowerCase() in ENTITIES ? ENTITIES[n.toLowerCase()] : m));

// The text a visitor can see or hear: element text (no <script>, <style>), the attributes alt, aria-label
// and title, the <title>, and the content of meta description / og / twitter title and description.
// Elements that are hidden until an action (panels, <template>) count: they are shown at some point.
export function visibleText(html) {
  const head = [...html.matchAll(/<meta (?:name|property)="(?:description|og:title|og:description|twitter:title|twitter:description)" content="([^"]*)"/g)].map((m) => m[1]);
  const attrs = [...html.matchAll(/\s(?:alt|aria-label|title)="([^"]*)"/g)].map((m) => m[1]);
  const body = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|li|h[1-6]|div|section|article|td|th|dt|dd|button|a|label|span|title)>/gi, (m) => `${m} `)
    .replace(/<[^>]+>/g, '');
  return decode([body, ...attrs, ...head].join(' \n ')).replace(/[ \t\r\f\v   ]+/g, ' ');
}

/* ---------- matching ---------- */
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Whole word, case-insensitive; «100 %» also matches «100&nbsp;%» (already a space after decoding).
const wordRe = (w) => new RegExp(`(?<![\\p{L}\\p{N}_-])${esc(w).replace(/ /g, '\\s+')}(?![\\p{L}\\p{N}_])`, 'giu');
export const pageMatches = (patterns, page) => patterns.some((p) => p === '*' || p === page || (p.endsWith('*') && page.startsWith(p.slice(0, -1))));

const context = (text, i, len) => text.slice(Math.max(0, i - 40), i + len + 40).replace(/\s+/g, ' ').trim();

// Allowed when the hit lies inside an occurrence of an allowed phrase on that page.
function allowed(rules, page, text, i, len) {
  return rules.allow.some((a) => pageMatches(a.pages, page) && [...text.matchAll(wordRe(a.phrase))].some((m) => m.index <= i && i + len <= m.index + m[0].length));
}

export function wordHits(page, text, rules = RULES) {
  const hits = [];
  const lists = [{ name: 'global', ...rules.global }, ...rules.groups].filter((g) => pageMatches(g.pages, page));
  for (const g of lists) {
    for (const w of g.words || []) {
      for (const m of text.matchAll(wordRe(w))) {
        if (allowed(rules, page, text, m.index, m[0].length)) continue;
        hits.push({ page, kind: 'word', list: g.name, word: w, context: context(text, m.index, m[0].length) });
      }
    }
    for (const p of g.patterns || []) {
      for (const m of text.matchAll(new RegExp(p, 'gu'))) hits.push({ page, kind: 'pattern', list: g.name, word: p, context: context(text, m.index, m[0].length) });
    }
    if (g.noPrice) for (const m of text.matchAll(PRICE_RE)) hits.push({ page, kind: 'price', list: g.name, word: m[0], context: context(text, m.index, m[0].length) });
  }
  return hits;
}

/* ---------- prices ---------- */
// «990 €», «1.190 €», «ab 990 €», «€990», «€1,190», «45 € pro Stunde».
const PRICE_RE = /(\d{1,3}(?:[.,  ]\d{3})*|\d+)\s?€|€\s?(\d{1,3}(?:[.,]\d{3})*|\d+)/gu;
const amount = (s) => Number(String(s).replace(/[.,  ]/g, ''));

// Every amount named in the package data (DE), plus the hourly rate.
export function packagePrices(de, rules = RULES) {
  const out = new Set([rules.prices.hourly]);
  for (const g of de.pricing.groups) {
    for (const it of g.items) {
      for (const s of [it.price, it.extra?.label]) for (const m of String(s || '').matchAll(PRICE_RE)) out.add(amount(m[1] || m[2]));
    }
  }
  for (const p of de.stack?.pakete || []) for (const m of String(p.price || '').matchAll(PRICE_RE)) out.add(amount(m[1] || m[2]));
  return out;
}

export function priceHits(page, text, prices, rules = RULES) {
  if (rules.prices.allow.some((a) => pageMatches(a.pages, page))) return [];
  const hits = [];
  for (const m of text.matchAll(PRICE_RE)) {
    const n = amount(m[1] || m[2]);
    if (!prices.has(n)) hits.push({ page, kind: 'price', list: 'prices', word: m[0].trim(), context: context(text, m.index, m[0].length) });
  }
  return hits;
}

/* ---------- labels ---------- */
// Content entries flagged beispiel / drittanbieter (anywhere in the content modules) and the element that
// renders them (data-entry="<id>"): the label must be inside that element.
// A flag as a property (beispiel: true) or in a flags list (flags: ['beispiel'], the data cores).
const isFlag = (o, f) => Boolean(o[f]) || (Array.isArray(o.flags) && o.flags.includes(f));
export function flaggedEntries(obj, out = []) {
  if (Array.isArray(obj)) obj.forEach((x) => flaggedEntries(x, out));
  else if (obj && typeof obj === 'object') {
    if (isFlag(obj, 'beispiel') || isFlag(obj, 'drittanbieter')) out.push(obj);
    Object.values(obj).forEach((x) => flaggedEntries(x, out));
  }
  return out;
}

// The element with data-entry="<id>" up to its matching closing tag (same tag name, nesting counted).
function entryHtml(html, id) {
  const start = html.search(new RegExp(`<([a-z][\\w-]*)\\b[^>]*\\sdata-entry="${esc(id)}"`, 'i'));
  if (start < 0) return null;
  const tag = html.slice(start + 1).match(/^[a-z][\w-]*/i)[0];
  const re = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi');
  re.lastIndex = start;
  let depth = 0;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    depth += m[1] ? -1 : 1;
    if (depth === 0) return html.slice(start, m.index + m[0].length);
  }
  return html.slice(start);
}

export function labelHits(pagesHtml, entries, rules = RULES) {
  const hits = [];
  for (const e of entries) {
    if (!e.id) { hits.push({ page: '(content)', kind: 'label', list: 'labels', word: 'id', context: `flagged entry without id: ${JSON.stringify(e).slice(0, 80)}` }); continue; }
    const where = pagesHtml.map(({ page, html }) => ({ page, part: entryHtml(html, e.id) })).filter((x) => x.part);
    for (const { page, part } of where) {
      const text = visibleText(part);
      if (isFlag(e, 'beispiel') && !rules.labels.beispiel.some((l) => wordRe(l).test(text))) hits.push({ page, kind: 'label', list: 'labels', word: 'Beispiel', context: `${e.id}: no «${rules.labels.beispiel.join('» or «')}»` });
      if (isFlag(e, 'drittanbieter') && !new RegExp(rules.labels.drittanbieter, 'u').test(text)) hits.push({ page, kind: 'label', list: 'labels', word: 'Stand', context: `${e.id}: no «Stand: <Datum>»` });
    }
  }
  return hits;
}

/* ---------- the built site ---------- */
function htmlFiles(dir, skip = []) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (skip.includes(name)) continue;
    if (statSync(p).isDirectory()) out.push(...htmlFiles(p, skip));
    else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}
const pathOf = (rel) => `/${rel.replace(/\\/g, '/').replace(/(^|\/)index\.html$/, '$1')}`;

// The built main-site pages (repo root; not src/, tests/, node_modules/, the QA sheet /_icons/) and the
// Webprojekte pages that are German (lang="de"), as { page, html }.
export function builtPages({ wp = path.resolve(root, '../../webprojekte/site') } = {}) {
  const main = htmlFiles(root, ['node_modules', 'src', 'tests', '_icons', '.git', 'assets', 'docs'])
    .map((f) => ({ page: pathOf(path.relative(root, f)), html: readFileSync(f, 'utf8') }));
  const web = existsSync(wp)
    ? htmlFiles(wp, ['node_modules', 'tools', 'assets', '.git']).map((f) => ({ page: `/Webprojekte${pathOf(path.relative(wp, f))}`, html: readFileSync(f, 'utf8') })).filter((p) => /<html[^>]*\slang="de"/.test(p.html))
    : [];
  return [...main, ...web];
}

export const hitKey = (h) => `${h.page} | ${h.kind} | ${h.word} | ${h.context}`;

// Every hit over the given pages. de: the German content module (package data, flagged entries).
// entries: the flagged entries of the German content and of the data cores (src/content/kerne/).
export function scan(pagesHtml, de, { rules = RULES, entries = [...flaggedEntries(de), ...flaggedEntries(kerne)] } = {}) {
  const prices = packagePrices(de, rules);
  const hits = [];
  for (const { page, html } of pagesHtml) {
    const text = visibleText(html);
    hits.push(...wordHits(page, text, rules), ...priceHits(page, text, prices, rules));
  }
  hits.push(...labelHits(pagesHtml, entries, rules));
  return hits;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const de = (await import('../content/de.mjs')).default;
  const pages = builtPages();
  const hits = scan(pages, de);
  for (const h of hits) console.log(hitKey(h));
  console.log(`\n${hits.length} hits on ${pages.length} pages`);
}
