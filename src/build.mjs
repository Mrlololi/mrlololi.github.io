// Renders all pages from src/content/*.mjs into static HTML at the repo root.
// Usage: npm run build
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import config from './config.json' with { type: 'json' };
import de from './content/de.mjs';
import en from './content/en.mjs';
import { layout } from './templates/layout.mjs';
import { home } from './templates/home.mjs';
import { impressum, privacy, notFound } from './templates/legal.mjs';
import { robots, sitemap } from './templates/seo.mjs';

export { sitemap };

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fileFor = (p) => (p.endsWith('/') ? `${p.slice(1)}index.html` : p.slice(1));

export function pages(cfg = config, { buildDate = new Date() } = {}) {
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
      html: layout({ ...ctx, page: { key: 'privacy', path: t.paths.privacy, altPath: other.paths.privacy, ...t.privacyMeta }, main: privacy(t, cfg, { buildDate }) }),
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

export async function build({ outDir = root, buildDate } = {}) {
  const date = buildDate ?? (config.build_date ? new Date(config.build_date) : new Date());
  for (const { file, html } of pages(config, { buildDate: date })) {
    const target = path.join(outDir, file);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, html, 'utf8');
    console.log(`page: ${file}`);
  }
  await writeFile(path.join(outDir, 'robots.txt'), robots(config), 'utf8');
  await writeFile(path.join(outDir, 'sitemap.xml'), sitemap(config, date), 'utf8');
  console.log('page: robots.txt, sitemap.xml');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await build();
}
