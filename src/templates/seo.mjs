import { absUrl } from './util.mjs';

// The three page pairs; DE is x-default. The key names the pair's date in config.page_dates.
const PAIRS = [
  ['/', '/en/', 'home'],
  ['/impressum/', '/en/legal-notice/', 'legal'],
  ['/datenschutz/', '/en/privacy/', 'privacy'],
];

export function alternatesFor(path) {
  const pair = PAIRS.find((p) => p.slice(0, 2).includes(path));
  return pair ? { de: pair[0], en: pair[1] } : null;
}

// One business and the website it publishes; the street is the Impressum address.
export function jsonLd(t, config) {
  const business = absUrl(config, '/#business');
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfessionalService',
        '@id': business,
        name: 'mrlololi',
        alternateName: 'Iva Tsatskrialashvili',
        description: t.meta.description,
        url: absUrl(config, t.paths.home),
        email: config.contact_email,
        image: absUrl(config, `/og-image-${t.lang}.png`),
        logo: absUrl(config, '/assets/brand/apple-touch-icon.png'),
        sameAs: [config.linkedin, config.malt],
        areaServed: ['AT', 'DE', 'CH', 'IT'],
        address: { '@type': 'PostalAddress', streetAddress: 'Herbersteinstraße 4/4181', addressLocality: 'Graz', postalCode: '8020', addressCountry: 'AT' },
        founder: { '@type': 'Person', name: 'Iva Tsatskrialashvili', sameAs: [config.linkedin, config.malt] },
        priceRange: '€€',
      },
      {
        '@type': 'WebSite',
        '@id': absUrl(config, '/#website'),
        url: absUrl(config, '/'),
        name: 'mrlololi',
        inLanguage: t.lang,
        publisher: { '@id': business },
      },
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
const PRIVATE = ['/src/', '/tests/', '/README.md', '/package.json', '/package-lock.json'];
export const robots = (config) =>
  `User-agent: *\nAllow: /\n${PRIVATE.map((p) => `Disallow: ${p}\n`).join('')}\nSitemap: ${absUrl(config, '/sitemap.xml')}\n`;

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
export function sitemap(config) {
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
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;
}
