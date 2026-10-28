// Stage 5: checks the live site against the local build: the ten service pages (200, same title,
// description, canonical and H1, JSON-LD #iva), sitemap.xml and robots.txt byte for byte.
// Waits for the GitHub Pages deploy (up to 10 minutes). Usage: node src/qa/seo-live.mjs [?v=seo1]
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import config from '../config.json' with { type: 'json' };
import { repoRoot } from './browsers.mjs';
import { SERVICE_PAGES } from './overflow.mjs';

const query = process.argv[2] || '?v=seo1';
const pick = (h, re) => (h.match(re) || [])[1];
const facts = (h) => ({
  title: pick(h, /<title>([^<]*)<\/title>/),
  description: pick(h, /<meta name="description" content="([^"]*)">/),
  canonical: pick(h, /<link rel="canonical" href="([^"]+)">/),
  h1: pick(h, /<h1[^>]*>([\s\S]*?)<\/h1>/),
  iva: h.includes('"@id":"https://mrlololi.com/#iva"'),
  explain: h.includes('<aside class="svc-explain"'),
});
const local = (p) => readFile(path.join(repoRoot, p === '/robots.txt' || p === '/sitemap.xml' ? p.slice(1) : `${p.slice(1)}index.html`), 'utf8');
const live = async (p) => {
  const r = await fetch(`${config.site_url}${p}${query}`, { headers: { 'cache-control': 'no-cache' } });
  return { status: r.status, text: await r.text() };
};

async function once() {
  const problems = [];
  const lines = [];
  for (const p of SERVICE_PAGES) {
    const r = await live(p);
    const want = facts(await local(p));
    const got = facts(r.text);
    const diff = Object.keys(want).filter((k) => want[k] !== got[k]);
    if (r.status !== 200 || diff.length) problems.push(`${p}: ${r.status}${diff.length ? `, differs: ${diff.join(', ')}` : ''}`);
    lines.push(`${r.status} ${p} ${got.title}`);
  }
  for (const p of ['/sitemap.xml', '/robots.txt']) {
    const r = await live(p);
    const same = r.text === (await local(p));
    if (r.status !== 200 || !same) problems.push(`${p}: ${r.status}${same ? '' : ', differs from the build'}`);
    lines.push(`${r.status} ${p}${p === '/sitemap.xml' ? ` (${(r.text.match(/<loc>/g) || []).length} URLs)` : ''}${same ? ', same as build' : ''}`);
  }
  return { problems, lines };
}

const until = Date.now() + 10 * 60 * 1000;
let r = await once();
while (r.problems.length && Date.now() < until) {
  await new Promise((ok) => setTimeout(ok, 20000));
  r = await once();
}
console.log(r.lines.join('\n'));
console.log(r.problems.length ? `LIVE FAIL\n${r.problems.join('\n')}` : 'LIVE OK: 10 pages, sitemap and robots match the build');
process.exit(r.problems.length ? 1 : 0);
