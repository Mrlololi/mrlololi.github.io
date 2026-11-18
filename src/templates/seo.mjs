import { absUrl } from './util.mjs';
import de from '../content/de.mjs';
import en from '../content/en.mjs';
import { loadProtokoll } from './qualitaet.mjs';

// The page pairs; DE is x-default. The key names the pair's date in config.page_dates.
// Stage 5: the five service pages follow the three original pairs.
const PAIRS = [
  ['/', '/en/', 'home'],
  ['/impressum/', '/en/legal-notice/', 'legal'],
  ['/datenschutz/', '/en/privacy/', 'privacy'],
  ...de.services.pages.map((p) => [p.path, en.services.pages.find((e) => e.key === p.key).path, p.key]),
];

export function alternatesFor(path) {
  const pair = PAIRS.find((p) => p.slice(0, 2).includes(path));
  return pair ? { de: pair[0], en: pair[1] } : null;
}

// Stage 5: Iva as a Person. The same node on every page (and with the same @id in the Webprojekte repo),
// so search engines stop guessing who runs the business. Stage 7b-S: language-aware (gender, pronouns,
// job title and the identity sentence in the page language).
export function person(config, lang = 'de') {
  const en_ = lang === 'en';
  return {
    '@type': 'Person',
    '@id': absUrl(config, '/#iva'),
    name: 'Iva Tsatskrialashvili',
    alternateName: 'mrlololi',
    gender: 'Male',
    pronouns: en_ ? 'he/him' : 'er/ihm',
    jobTitle: en_ ? 'Marketing Automation Technician' : 'Techniker für Marketing-Automation',
    description: (en_ ? en : de).identity,
    knowsAbout: ['ActiveCampaign', 'Zapier', 'Make', 'Leadpages', 'Stripe', 'E-Mail-Zustellbarkeit', 'Marketing-Automation'],
    address: { '@type': 'PostalAddress', addressLocality: 'Graz', addressCountry: 'AT' },
    image: absUrl(config, '/assets/img/about-680.jpg'),
    url: absUrl(config, '/'),
    sameAs: [config.linkedin, config.malt, config.github, config.instagram],
  };
}

// One business; the street is the Impressum address. Identical on every page (German, the x-default).
export function business(config) {
  return {
    '@type': 'ProfessionalService',
    '@id': absUrl(config, '/#business'),
    name: 'mrlololi',
    alternateName: 'Iva Tsatskrialashvili',
    description: de.meta.description,
    url: absUrl(config, '/'),
    email: config.contact_email,
    image: absUrl(config, '/og-image-de.png'),
    logo: absUrl(config, '/assets/brand/apple-touch-icon.png'),
    sameAs: [config.linkedin, config.malt],
    areaServed: ['AT', 'DE', 'CH', 'IT'],
    address: { '@type': 'PostalAddress', streetAddress: 'Herbersteinstraße 4/4181', addressLocality: 'Graz', postalCode: '8020', addressCountry: 'AT' },
    founder: { '@id': absUrl(config, '/#iva') },
    priceRange: '€€',
  };
}

// Every page: the business, Iva and the website, plus the page's own nodes (Service, BreadcrumbList, BlogPosting).
export function jsonLd(t, config, extra = []) {
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      business(config),
      person(config, t.lang),
      {
        '@type': 'WebSite',
        '@id': absUrl(config, '/#website'),
        url: absUrl(config, '/'),
        name: 'mrlololi',
        inLanguage: t.lang,
        publisher: { '@id': absUrl(config, '/#business') },
      },
      ...extra,
    ],
  };
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

// GitHub Pages reads the custom domain from a CNAME file at the publishing root.
// The build writes it from site_url every time, so a rebuild can never drop it.
export function cname(config) {
  const host = new URL(config.site_url).hostname;
  return host.endsWith('.github.io') ? null : `${host}\n`;
}

// The repo root is the published folder, so the source files are kept out of search.
// Stage 5: the Webprojekte sitemap is named only once it answered 200 at build time.
const PRIVATE = ['/src/', '/tests/', '/README.md', '/package.json', '/package-lock.json'];
export const robots = (config, { webprojekteSitemap = false } = {}) =>
  `User-agent: *\nAllow: /\n${PRIVATE.map((p) => `Disallow: ${p}\n`).join('')}\nSitemap: ${absUrl(config, '/sitemap.xml')}\n${webprojekteSitemap ? `Sitemap: ${config.webprojekte_sitemap}\n` : ''}`;

// Minimal web app manifest (name, icons, theme colour).
export const manifest = () => `${JSON.stringify({
  name: 'mrlololi',
  short_name: 'mrlololi',
  start_url: '/',
  display: 'browser',
  background_color: '#F4C9D3',
  theme_color: '#F4C9D3',
  icons: [
    { src: '/assets/brand/favicon.svg', type: 'image/svg+xml', sizes: 'any' },
    { src: '/assets/brand/apple-touch-icon.png', type: 'image/png', sizes: '180x180' },
  ],
}, null, 2)}\n`;

// lastmod is the date of each page's last real content change (config.page_dates), not the build day.
// Ratgeber pages (DE only, no alternates) appear only with config.ratgeber_live.
// Qualität 17.11.2026: /qualitaet/ (DE only, no alternates) once src/content/qualitaet.json exists.
export function sitemap(config, articles = [], { qualitaet = Boolean(loadProtokoll()) } = {}) {
  const urls = PAIRS.flatMap(([de, en, key]) =>
    [de, en].map(
      (loc) => `  <url>
    <loc>${absUrl(config, loc)}</loc>
    <lastmod>${config.page_dates[key]}</lastmod>
    <xhtml:link rel="alternate" hreflang="de" href="${absUrl(config, de)}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${absUrl(config, en)}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${absUrl(config, de)}"/>
  </url>`
    )
  );
  if (config.ratgeber_live && articles.length) {
    const one = (loc, lastmod) => `  <url>
    <loc>${absUrl(config, loc)}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`;
    const newest = articles.map((a) => a.dateModified).sort().at(-1);
    if (newest) urls.push(one(de.ratgeber.path, newest));
    for (const a of articles) urls.push(one(`${de.ratgeber.path}${a.slug}/`, a.dateModified));
  }
  if (qualitaet) {
    urls.push(`  <url>
    <loc>${absUrl(config, de.qualitaet.path)}</loc>
    <lastmod>${config.page_dates.qualitaet}</lastmod>
  </url>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;
}
