import { readFileSync } from 'node:fs';
import { esc, absUrl, join } from './util.mjs';
import { alternatesFor, jsonLd } from './seo.mjs';

// Source of truth stays assets/css/main.css; comments and indentation are stripped when inlined.
const css = readFileSync(new URL('../../assets/css/main.css', import.meta.url), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\n\s*/g, '\n')
  .replace(/\n{2,}/g, '\n')
  .trim();

// page: { key: 'home'|'legal'|'privacy'|'404', path, altPath, title, description, noindex? }
export function layout({ t, other, config, page, main }) {
  const isHome = page.key === 'home';
  const alts = alternatesFor(page.path);
  const ogImage = absUrl(config, `/og-image-${t.lang}.png`);

  const head = join([
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${esc(page.title)}</title>`,
    `<meta name="description" content="${esc(page.description)}">`,
    page.noindex && '<meta name="robots" content="noindex">',
    alts && `<link rel="canonical" href="${absUrl(config, page.path)}">`,
    alts && `<link rel="alternate" hreflang="de" href="${absUrl(config, alts.de)}">`,
    alts && `<link rel="alternate" hreflang="en" href="${absUrl(config, alts.en)}">`,
    alts && `<link rel="alternate" hreflang="x-default" href="${absUrl(config, alts.de)}">`,
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="mrlololi">',
    `<meta property="og:title" content="${esc(page.title)}">`,
    `<meta property="og:description" content="${esc(page.description)}">`,
    alts && `<meta property="og:url" content="${absUrl(config, page.path)}">`,
    `<meta property="og:image" content="${ogImage}">`,
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    `<meta property="og:locale" content="${t.ogLocale}">`,
    `<meta property="og:locale:alternate" content="${other.ogLocale}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${esc(page.title)}">`,
    `<meta name="twitter:description" content="${esc(page.description)}">`,
    `<meta name="twitter:image" content="${ogImage}">`,
    '<meta name="theme-color" content="#F4C9D3">',
    '<link rel="icon" href="/assets/icons/favicon.ico" sizes="32x32">',
    '<link rel="icon" href="/assets/icons/favicon.svg" type="image/svg+xml">',
    '<link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png">',
    '<link rel="manifest" href="/site.webmanifest">',
    '<link rel="preload" href="/assets/fonts/bricolage-grotesque-latin.woff2" as="font" type="font/woff2" crossorigin>',
    '<link rel="preload" href="/assets/fonts/atkinson-hyperlegible-next-latin.woff2" as="font" type="font/woff2" crossorigin>',
    // The h1 accent words: without this they fall back to Georgia on a cold cache (font-display: optional).
    '<link rel="preload" href="/assets/fonts/eb-garamond-italic-500.woff2" as="font" type="font/woff2" crossorigin>',
    // The stylesheet is inlined at build time (saves a render-blocking request on slow phones).
    `<style>${css}</style>`,
    // Runs before first paint: marks JS as available; with motion allowed it holds the run log
    // steps (all widths) and, on desktop, the hero H1 for their entrance. CSS shows them anyway after 2 s.
    `<script>var d=document.documentElement;d.classList.add('js');if(matchMedia('(prefers-reduced-motion: no-preference)').matches)d.classList.add('run-pending')</script>`,
    // main.js is fetched only after the first frame is on screen, so the headline (LCP) never
    // waits for it; the page works without it until then ("Menü" link, example result).
    // main.js in turn loads the GSAP files after load (home pages only).
    `<script type="module">requestAnimationFrame(()=>requestAnimationFrame(()=>import('/assets/js/main.js')))</script>`,
    // main.js's own imports are fetched early at low priority, so they are ready when it runs.
    ...['demos', 'calc', 'loops', 'finder'].map((m) => `<link rel="modulepreload" href="/assets/js/${m}.js" fetchpriority="low">`),
    isHome && jsonLd(t, config),
  ]);

  return `<!doctype html>
<html lang="${t.lang}">
<head>
${head}
</head>
<body class="page-${page.key}">
<a class="skip" href="#main">${esc(t.ui.skip)}</a>
${header({ t, page, isHome })}
<main id="main" tabindex="-1">
${main}
</main>
${footer({ t, page })}
</body>
</html>
`;
}

function header({ t, page, isHome }) {
  const base = isHome ? '' : t.paths.home;
  const items = t.nav.map((n) => `<li><a href="${base}${n.href}">${esc(n.label)}</a></li>`).join('\n');
  const altPath = page.altPath;
  return `<header class="site-header" data-header>
<div class="site-header__in">
<a class="wordmark" href="${t.paths.home}">mrlololi<span class="sr-only"> ${esc(t.ui.wordmarkName)}</span></a>
<nav class="site-nav" aria-label="${esc(t.ui.navLabel)}">
<a class="site-nav__jump" href="#footer-nav">${esc(t.ui.menu)}</a>
<button class="site-nav__toggle" type="button" aria-expanded="false" aria-controls="site-nav-list" hidden>${esc(t.ui.menu)}</button>
<ul class="site-nav__list" id="site-nav-list">
${items}
<li class="site-nav__lang"><a href="${altPath}" hreflang="${t.ui.langCode}" lang="${t.ui.langCode}" aria-label="${esc(t.ui.langName)}">${esc(t.ui.langShort)}</a></li>
</ul>
</nav>
</div>
</header>`;
}

// The footer repeats the section links: it is also where the phone "Menü" link leads
// when main.js has not (yet) loaded.
function footer({ t, page }) {
  const base = page.key === 'home' ? '' : t.paths.home;
  const sections = t.nav.map((n) => `<li><a href="${base}${n.href}">${esc(n.label)}</a></li>`).join('\n');
  return `<footer class="site-footer bg-ink edge">
<div class="site-footer__in">
<p class="site-footer__copy">${esc(t.footer.copyright)}</p>
<nav id="footer-nav" aria-label="${esc(t.ui.footerNavLabel)}">
<ul class="site-footer__links">
${sections}
<li><a href="${t.paths.legal}">${esc(t.footer.legal)}</a></li>
<li><a href="${t.paths.privacy}">${esc(t.footer.privacy)}</a></li>
<li><a href="${page.altPath}" hreflang="${t.ui.langCode}" lang="${t.ui.langCode}">${esc(t.ui.langName)}</a></li>
</ul>
</nav>
</div>
</footer>`;
}
