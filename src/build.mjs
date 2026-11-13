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
import { impressum, privacy, notFound, thanksPage } from './templates/legal.mjs';
import { robots, sitemap, cname, manifest } from './templates/seo.mjs';
import { videoLd } from './templates/video.mjs';
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
      html: layout({ ...ctx, page: { key: 'home', path: t.paths.home, altPath: other.paths.home, ...t.meta, ld: t.s6.video ? [videoLd(t, cfg)] : [] }, main: home(t, cfg) }),
    });
    out.push({
      file: fileFor(t.paths.legal),
      html: layout({ ...ctx, page: { key: 'legal', path: t.paths.legal, altPath: other.paths.legal, ...t.legalMeta }, main: impressum(t, cfg) }),
    });
    out.push({
      file: fileFor(t.paths.privacy),
      html: layout({ ...ctx, page: { key: 'privacy', path: t.paths.privacy, altPath: other.paths.privacy, ...t.privacyMeta }, main: privacy(t, cfg, { date: new Date(`${cfg.page_dates.privacy}T12:00:00Z`) }) }),
    });
    // Stage 6f: the thank-you page for the form without JavaScript (noindex, not in the sitemap).
    out.push({
      file: fileFor(t.thanksPage.path),
      html: layout({ ...ctx, page: { key: 'thanks', path: t.thanksPage.path, altPath: other.thanksPage.path, noindex: true, title: t.thanksPage.title, description: t.thanksPage.description }, main: thanksPage(t) }),
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
      main: notFound(de, en, { ratgeber }),
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
  // Stage 7b: the icon contact sheet (QA page, noindex, not in the sitemap, linked from nowhere) and the
  // icon checks of design system 3.2 over every built page.
  const built = pages(config, { articles, live });
  await mkdir(path.join(outDir, '_icons'), { recursive: true });
  await writeFile(path.join(outDir, '_icons/index.html'), await iconSheet(), 'utf8');
  await checkIcons(built.map((p) => p.html));
  log('page: _icons/index.html (icon contact sheet)');
  // Pages that are no longer built (a Ratgeber switched off again) must not stay online.
  const ratgeber = config.ratgeber_live && articles.length > 0;
  if (!ratgeber) await rm(path.join(outDir, 'ratgeber'), { recursive: true, force: true });
  // Stage 6: the 20 KI examples live only on /Webprojekte/ki-kundenservice/; the three on the KI
  // service page are inlined, so the old JSON files go.
  await rm(path.join(outDir, 'assets/data'), { recursive: true, force: true });
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

/* ---------- Stage 7b: icons (design system 3.2) ---------- */
// Every id at 20, 24 and 48 px (pictos with their tone), a mascot of the same size beside the 48 px
// row. A QA page: title «Icons», the ids as captions, no other words.
export async function iconSheet() {
  const { ICONS, icon } = await import('../assets/js/kit/icons.mjs');
  const { mascotScene } = await import('./templates/mascots.mjs');
  const ids = Object.keys(ICONS);
  const row = (size) => `<section class="icons-sheet__row" aria-label="${size} px">
<p class="icons-sheet__size">${size}</p>
<ul class="icons-sheet__list" role="list">
${ids.map((id) => `<li>${icon(id, { size })}<span>${id}</span></li>`).join('\n')}
${size === 48 ? `<li>${mascotScene('icons', [[0, 'idle']], 'icons-sheet__mascot', 'icons')}<span>Logik</span></li>` : ''}
</ul>
</section>`;
  const main = `<article class="doc icons-sheet">
<h1>Icons</h1>
${[20, 24, 48].map(row).join('\n')}
<style>.icons-sheet__list { display: flex; flex-wrap: wrap; gap: var(--space-5); list-style: none; padding: 0; align-items: flex-end; }
.icons-sheet__list li { display: grid; justify-items: center; gap: var(--space-2); font-size: var(--step--1); }
.icons-sheet__size { font-weight: 700; }
.icons-sheet__mascot .mascot { display: block; width: 3rem; height: auto; overflow: visible; }</style>
</article>`;
  return layout({
    t: de, other: en, config, ratgeber: false,
    page: { key: 'icons', path: '/_icons/', altPath: en.paths.home, noindex: true, title: 'Icons', description: 'Icons' },
    main,
  });
}

// Unknown ids throw where they are drawn (icon(), iconSymbols()); here: every <use> and inline icon of
// a built page is an id of the module, and every id is used: (1) a built page other than the sheet
// carries it, or (2) a file under src/templates/, src/content/ or src/config.json names it as a string,
// or (3) its entry has a «project» field (drawn for a Webprojekte page).
export async function checkIcons(htmls) {
  const { ICONS } = await import('../assets/js/kit/icons.mjs');
  const { readdirSync, readFileSync } = await import('node:fs');
  const onPages = new Set(htmls.flatMap((h) => [...h.matchAll(/href="#i-([\w-]+)"|data-icon="([\w-]+)"/g)].map((m) => m[1] || m[2])));
  const unknown = [...onPages].filter((id) => !ICONS[id]);
  if (unknown.length) throw new Error(`icons: unknown id on a page: ${unknown.join(', ')}`);
  const src = [
    ...['src/templates', 'src/content'].flatMap((d) => readdirSync(path.join(root, d)).filter((f) => /\.(mjs|json|md)$/.test(f)).map((f) => readFileSync(path.join(root, d, f), 'utf8'))),
    readFileSync(path.join(root, 'src/config.json'), 'utf8'),
  ].join('\n');
  const unused = Object.entries(ICONS).filter(([id, e]) => !onPages.has(id) && !e.project && !new RegExp(`['"\`]${id}['"\`]`).test(src)).map(([id]) => id);
  if (unused.length) throw new Error(`icons: id in assets/js/kit/icons.mjs but used nowhere: ${unused.join(', ')} (draw an id only in its stage)`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await build();
}
