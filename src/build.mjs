// Renders all pages from src/content/*.mjs into static HTML at the repo root.
// Usage: npm run build
import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import config from './config.json' with { type: 'json' };
import de from './content/de.mjs';
import en from './content/en.mjs';
import { layout } from './templates/layout.mjs';
import { home } from './templates/home.mjs';
import { impressum, privacy, notFound } from './templates/legal.mjs';
import { robots, sitemap, cname, manifest } from './templates/seo.mjs';
import { kiData } from './templates/ki.mjs';

export { sitemap, cname };

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fileFor = (p) => (p.endsWith('/') ? `${p.slice(1)}index.html` : p.slice(1));

// Dates come from config.page_dates (change them only with the page's content), never from the build day.
export function pages(cfg = config) {
  const out = [];
  for (const [t, other] of [[de, en], [en, de]]) {
    const ctx = { t, other, config: cfg };
    out.push({
      file: fileFor(t.paths.home),
      html: layout({ ...ctx, page: { key: 'home', path: t.paths.home, altPath: other.paths.home, ...t.meta }, main: home(t, cfg) }),
    });
    out.push({
      file: fileFor(t.paths.legal),
      html: layout({ ...ctx, page: { key: 'legal', path: t.paths.legal, altPath: other.paths.legal, ...t.legalMeta }, main: impressum(t, cfg) }),
    });
    out.push({
      file: fileFor(t.paths.privacy),
      html: layout({ ...ctx, page: { key: 'privacy', path: t.paths.privacy, altPath: other.paths.privacy, ...t.privacyMeta }, main: privacy(t, cfg, { date: new Date(`${cfg.page_dates.privacy}T12:00:00Z`) }) }),
    });
  }
  out.push({
    file: '404.html',
    html: layout({
      t: de, other: en, config: cfg,
      page: { key: '404', path: '/404.html', altPath: en.paths.home, noindex: true, ...de.notFoundMeta },
      main: notFound(de, en),
    }),
  });
  return out;
}

export async function build({ outDir = root } = {}) {
  for (const { file, html } of pages(config)) {
    const target = path.join(outDir, file);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, html, 'utf8');
    console.log(`page: ${file}`);
  }
  // Stage 4: the 20 KI-demo examples per language, fetched by assets/js/kidemo.js on first view.
  await mkdir(path.join(outDir, 'assets/data'), { recursive: true });
  for (const t of [de, en]) await writeFile(path.join(outDir, `assets/data/ki-${t.lang}.json`), JSON.stringify(kiData(t)), 'utf8');
  await writeFile(path.join(outDir, 'robots.txt'), robots(config), 'utf8');
  await writeFile(path.join(outDir, 'sitemap.xml'), sitemap(config), 'utf8');
  await writeFile(path.join(outDir, 'site.webmanifest'), manifest(), 'utf8');
  // Browsers ask for /favicon.ico at the root no matter what the page links.
  await copyFile(path.join(root, 'assets/brand/favicon.ico'), path.join(outDir, 'favicon.ico'));
  console.log('page: robots.txt, sitemap.xml, site.webmanifest, favicon.ico');
  const domain = cname(config);
  if (domain) {
    await writeFile(path.join(outDir, 'CNAME'), domain, 'utf8');
    console.log(`page: CNAME (${domain.trim()})`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await build();
}
