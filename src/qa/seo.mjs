// Stage 5: canonical and hreflang over a build output. Every indexable page names itself as canonical;
// every DE/EN page lists de, en and x-default (= de), and the page it points to points back.
// Usage: node src/qa/seo.mjs [dir]   (default: the repo root; exit code 1 on problems)
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import config from '../config.json' with { type: 'json' };
import { repoRoot } from './browsers.mjs';

const SKIP = new Set(['node_modules', '.git', 'src', 'tests', 'assets', 'docs']);

async function htmlFiles(dir, base = dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const f = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await htmlFiles(f, base)));
    else if (e.name.endsWith('.html')) out.push(path.relative(base, f).replace(/\\/g, '/'));
  }
  return out;
}

const urlOf = (site, file) => `${site}/${file.replace(/index\.html$/, '')}`;
const attr = (html, re) => (html.match(re) || [])[1];

export async function checkSeo(dir = repoRoot, site = config.site_url) {
  const problems = [];
  const pages = new Map();
  for (const file of await htmlFiles(dir)) {
    const html = await readFile(path.join(dir, file), 'utf8');
    if (html.includes('<meta name="robots" content="noindex">')) continue;
    const alt = (lang) => attr(html, new RegExp(`<link rel="alternate" hreflang="${lang}" href="([^"]+)">`));
    pages.set(urlOf(site, file), {
      file,
      lang: attr(html, /<html lang="([a-z]+)"/),
      canonical: attr(html, /<link rel="canonical" href="([^"]+)">/),
      de: alt('de'), en: alt('en'), xdefault: alt('x-default'),
    });
  }
  for (const [url, p] of pages) {
    if (p.canonical !== url) problems.push(`${p.file}: canonical ${p.canonical} is not ${url}`);
    if (!p.de && !p.en && !p.xdefault) {
      if (!p.file.startsWith('ratgeber/')) problems.push(`${p.file}: no hreflang alternates`);
      continue;
    }
    if (!p.de || !p.en || !p.xdefault) { problems.push(`${p.file}: hreflang de/en/x-default incomplete`); continue; }
    if (p.xdefault !== p.de) problems.push(`${p.file}: x-default ${p.xdefault} is not the German page ${p.de}`);
    if (p[p.lang] !== url) problems.push(`${p.file}: hreflang ${p.lang} ${p[p.lang]} is not the page itself`);
    const twinUrl = p.lang === 'de' ? p.en : p.de;
    const twin = pages.get(twinUrl);
    if (!twin) { problems.push(`${p.file}: alternate ${twinUrl} is not an indexable page of the build`); continue; }
    if (twin.de !== p.de || twin.en !== p.en || twin.xdefault !== p.xdefault) problems.push(`${p.file}: ${twin.file} does not point back the same way`);
    if (twin.lang === p.lang) problems.push(`${p.file}: alternate ${twin.file} has the same language`);
  }
  return { problems, indexable: pages.size };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const r = await checkSeo(process.argv[2] ? path.resolve(process.argv[2]) : repoRoot);
  console.log(`seo: ${r.indexable} indexable pages, ${r.problems.length} problems`);
  for (const p of r.problems) console.log(`  ${p}`);
  process.exit(r.problems.length ? 1 : 0);
}
