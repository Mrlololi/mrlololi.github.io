import { readFileSync } from 'node:fs';
import { esc, absUrl, join } from './util.mjs';
import { alternatesFor, jsonLd } from './seo.mjs';
import { lockup, wordmark, iconTight, taglineHtml, WHITE } from './brand.mjs';
import { footerMascots } from './mascots.mjs';

// Sources of truth: assets/css/components.css (tokens and shared components, Stage 6) and
// assets/css/main.css; comments and indentation are stripped when inlined.
const css = ['components', 'main'].map((f) => readFileSync(new URL(`../../assets/css/${f}.css`, import.meta.url), 'utf8')).join('\n')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\n\s*/g, '\n')
  .replace(/\n{2,}/g, '\n')
  .trim();

// page: { key, path, altPath, title, description, noindex?, ogImage?, ld? }. Every indexable page has a
// canonical; hreflang only where a DE/EN pair exists (the Ratgeber is German only).
// ratgeber: true once the Ratgeber is live (config.ratgeber_live and at least one article).
export function layout({ t, other, config, page, main, ratgeber = false }) {
  const isHome = page.key === 'home';
  const alts = alternatesFor(page.path);
  const canonical = !page.noindex;
  const ogImage = absUrl(config, page.ogImage || `/og-image-${t.lang}.png`);

  const head = join([
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${esc(page.title)}</title>`,
    `<meta name="description" content="${esc(page.description)}">`,
    page.noindex && '<meta name="robots" content="noindex">',
    canonical && `<link rel="canonical" href="${absUrl(config, page.path)}">`,
    alts && `<link rel="alternate" hreflang="de" href="${absUrl(config, alts.de)}">`,
    alts && `<link rel="alternate" hreflang="en" href="${absUrl(config, alts.en)}">`,
    alts && `<link rel="alternate" hreflang="x-default" href="${absUrl(config, alts.de)}">`,
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="mrlololi">',
    `<meta property="og:title" content="${esc(page.title)}">`,
    `<meta property="og:description" content="${esc(page.description)}">`,
    canonical && `<meta property="og:url" content="${absUrl(config, page.path)}">`,
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
    '<link rel="icon" href="/assets/brand/favicon.ico" sizes="16x16 32x32 48x48">',
    '<link rel="icon" href="/assets/brand/favicon.svg" type="image/svg+xml">',
    '<link rel="apple-touch-icon" href="/assets/brand/apple-touch-icon.png">',
    '<link rel="manifest" href="/site.webmanifest">',
    '<link rel="preload" href="/assets/fonts/bricolage-grotesque-latin.woff2" as="font" type="font/woff2" crossorigin>',
    '<link rel="preload" href="/assets/fonts/atkinson-hyperlegible-next-latin.woff2" as="font" type="font/woff2" crossorigin>',
    // The h1 accent words: without this they fall back to Georgia on a cold cache (font-display: optional).
    '<link rel="preload" href="/assets/fonts/eb-garamond-italic-500.woff2" as="font" type="font/woff2" crossorigin>',
    // The stylesheet is inlined at build time (saves a render-blocking request on slow phones).
    `<style>${css}</style>`,
    // Runs before first paint: marks JS as available (the CSS lays out the JS versions of the demos).
    `<script>document.documentElement.classList.add('js')</script>`,
    // main.js is fetched only after the first frame is on screen, so the headline (LCP) never
    // waits for it; the page works without it until then ("Menü" link, example result).
    // main.js in turn loads the GSAP files after load (home pages only).
    `<script type="module">requestAnimationFrame(()=>requestAnimationFrame(()=>import('/assets/js/main.js')))</script>`,
    // main.js's own imports are fetched early at low priority, so they are ready when it runs.
    ...['loops', ...(isHome ? ['mascots', 'mascot-art'] : [])].map((m) => `<link rel="modulepreload" href="/assets/js/${m}.js" fetchpriority="low">`),
    // Stage 5: the business and Iva (#business, #iva) on every page, plus the page's own nodes.
    jsonLd(t, config, page.ld || []),
  ]);

  return `<!doctype html>
<html lang="${t.lang}">
<head>
${head}
</head>
<body class="page-${page.key}">
<a class="skip" href="#main">${esc(t.ui.skip)}</a>
${header({ t, page, isHome, variant: config.header_variant || 'light' })}
<main id="main" tabindex="-1">
${main}
</main>
${footer({ t, page, ratgeber })}
</body>
</html>
`;
}

// Stage 4: variant «light» (warm white bar with blur) or «halo» (pink bar, white ring around each ball).
function header({ t, page, isHome, variant }) {
  const base = isHome ? '' : t.paths.home;
  const items = t.nav.map((n) => `<li><a href="${base}${n.href}">${esc(n.label)}</a></li>`).join('\n');
  const altPath = page.altPath;
  return `<header class="site-header" data-header data-variant="${variant}">
<div class="site-header__in">
<a class="wordmark" href="${t.paths.home}">${lockup({ kind: 'header', class: 'logo', wordId: 'mrl-word', halo: variant === 'halo' })}<span class="sr-only">mrlololi ${esc(t.ui.wordmarkName)}</span></a>
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

// Home pages: the dark lockup with the live tagline (EB Garamond italic, initials in the
// pastels of the three balls) and the three mascots waving next to it.
function footerBrand(t) {
  return `<div class="site-footer__brand">
<div class="brand-lockup">${iconTight({ line: WHITE, class: 'brand-lockup__icon' })}${wordmark({ dark: true, use: 'mrl-word', class: 'brand-lockup__word' })}<span class="sr-only">mrlololi</span>
<p class="tagline tagline--dark">${taglineHtml(esc(t.brand.tagline))}</p></div>
${footerMascots()}
</div>`;
}

// Stage 5: a «Leistungen» column with the five service pages (and the Ratgeber once it is live, DE only).
function footerServices(t, ratgeber) {
  const L = t.services.ui;
  const links = t.services.pages.map((p) => `<li><a href="${p.path}">${esc(p.short)}</a></li>`);
  if (ratgeber && t.ratgeber) links.push(`<li><a href="${t.ratgeber.path}">${esc(t.ratgeber.h1)}</a></li>`);
  return `<nav class="site-footer__services" aria-label="${esc(L.services)}">
<p class="site-footer__title">${esc(L.services)}</p>
<ul class="site-footer__links">
${links.join('\n')}
</ul>
</nav>`;
}

// The footer repeats the section links: it is also where the phone "Menü" link leads
// when main.js has not (yet) loaded.
function footer({ t, page, ratgeber }) {
  const base = page.key === 'home' ? '' : t.paths.home;
  const sections = t.nav.map((n) => `<li><a href="${base}${n.href}">${esc(n.label)}</a></li>`).join('\n');
  return `<footer class="site-footer bg-ink edge">
<div class="site-footer__in">
${page.key === 'home' ? footerBrand(t) : ''}${footerServices(t, ratgeber)}
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
