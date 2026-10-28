// Renders all pages from src/content/*.mjs into static HTML at the repo root.
// Usage: npm run build
import { copyFile, mkdir, rm, writeFile } from 'node:fs/promises';
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
import { servicePage, serviceLd, serviceTitle } from './templates/service.mjs';
import { ratgeberIndex, ratgeberArticle, blogPostingLd } from './templates/ratgeber.mjs';
import { loadArticles } from './ratgeber.mjs';

export { sitemap, cname };

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fileFor = (p) => (p.endsWith('/') ? `${p.slice(1)}index.html` : p.slice(1));

// Dates come from config.page_dates (change them only with the page's content), never from the build day.
// articles: the Ratgeber Markdown files (src/content/ratgeber/), built only with cfg.ratgeber_live.
// live: what answered 200 at build time (see probe() below); tests pass it explicitly.
export function pages(cfg = config, { articles = loadArticles(), live = {} } = {}) {
  const out = [];
  const ratgeber = Boolean(cfg.ratgeber_live) && articles.length > 0;
  for (const [t, other] of [[de, en], [en, de]]) {
    const ctx = { t, other, config: cfg, ratgeber };
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
    // Stage 5: the five service pages.
    for (const s of t.services.pages) {
      const twin = other.services.pages.find((p) => p.key === s.key);
      out.push({
        file: fileFor(s.path),
        html: layout({
          ...ctx,
          page: { key: 'service', path: s.path, altPath: twin.path, title: serviceTitle(s), description: s.description, ogImage: `/assets/og/${t.lang}-${s.key}.png`, ld: serviceLd(t, cfg, s) },
          main: servicePage(t, cfg, s, { live }),
        }),
      });
    }
  }
  // Stage 5: the Ratgeber (DE only, no EN alternates; the language switch leads to the English home page).
  if (ratgeber) {
    const ctx = { t: de, other: en, config: cfg, ratgeber };
    out.push({
      file: fileFor(de.ratgeber.path),
      html: layout({ ...ctx, page: { key: 'ratgeber', path: de.ratgeber.path, altPath: en.paths.home, title: de.ratgeber.title, description: de.ratgeber.description }, main: ratgeberIndex(de, articles) }),
    });
    for (const a of articles) {
      const p = `${de.ratgeber.path}${a.slug}/`;
      out.push({
        file: fileFor(p),
        html: layout({ ...ctx, page: { key: 'article', path: p, altPath: en.paths.home, title: `${a.title} | mrlololi`, description: a.description, ld: [blogPostingLd(cfg, a)] }, main: ratgeberArticle(de, cfg, a, articles) }),
      });
    }
  }
  out.push({
    file: '404.html',
    html: layout({
      t: de, other: en, config: cfg, ratgeber,
      page: { key: '404', path: '/404.html', altPath: en.paths.home, noindex: true, ...de.notFoundMeta },
      main: notFound(de, en),
    }),
  });
  return out;
}

// Stage 5: two links depend on pages another repo publishes. They are added only if the URL
// answers 200 when the site is built (no network or any other answer: left out).
async function answers200(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(8000) });
    return res.status === 200;
  } catch {
    return false;
  }
}

export async function build({ outDir = root, probe = true, quiet = false } = {}) {
  const log = quiet ? () => {} : console.log;
  const live = probe
    ? { kiPortfolio: await answers200(config.ki_portfolio_url), webprojekteSitemap: await answers200(config.webprojekte_sitemap) }
    : {};
  log(`probe: ${config.ki_portfolio_url} ${live.kiPortfolio ? '200, linked' : 'not 200, skipped'}`);
  log(`probe: ${config.webprojekte_sitemap} ${live.webprojekteSitemap ? '200, in robots.txt' : 'not 200, skipped'}`);
  const articles = loadArticles();
  for (const { file, html } of pages(config, { articles, live })) {
    const target = path.join(outDir, file);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, html, 'utf8');
    log(`page: ${file}`);
  }
  // Pages that are no longer built (a Ratgeber switched off again) must not stay online.
  const ratgeber = config.ratgeber_live && articles.length > 0;
  if (!ratgeber) await rm(path.join(outDir, 'ratgeber'), { recursive: true, force: true });
  // Stage 4: the 20 KI-demo examples per language, fetched by assets/js/kidemo.js on first view.
  await mkdir(path.join(outDir, 'assets/data'), { recursive: true });
  for (const t of [de, en]) await writeFile(path.join(outDir, `assets/data/ki-${t.lang}.json`), JSON.stringify(kiData(t)), 'utf8');
  await writeFile(path.join(outDir, 'robots.txt'), robots(config, { webprojekteSitemap: live.webprojekteSitemap }), 'utf8');
  await writeFile(path.join(outDir, 'sitemap.xml'), sitemap(config, ratgeber ? articles : []), 'utf8');
  await writeFile(path.join(outDir, 'site.webmanifest'), manifest(), 'utf8');
  // Browsers ask for /favicon.ico at the root no matter what the page links.
  await copyFile(path.join(root, 'assets/brand/favicon.ico'), path.join(outDir, 'favicon.ico'));
  log('page: robots.txt, sitemap.xml, site.webmanifest, favicon.ico');
  const domain = cname(config);
  if (domain) {
    await writeFile(path.join(outDir, 'CNAME'), domain, 'utf8');
    log(`page: CNAME (${domain.trim()})`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await build();
}
