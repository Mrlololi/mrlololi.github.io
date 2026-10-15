import { absUrl } from './util.mjs';

// The three page pairs; DE is x-default.
const PAIRS = [
  ['/', '/en/'],
  ['/impressum/', '/en/legal-notice/'],
  ['/datenschutz/', '/en/privacy/'],
];

export function alternatesFor(path) {
  const pair = PAIRS.find((p) => p.includes(path));
  return pair ? { de: pair[0], en: pair[1] } : null;
}

export function jsonLd(t, config) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'mrlololi',
    alternateName: 'Iva Tsatskrialashvili',
    description: t.meta.description,
    url: absUrl(config, t.paths.home),
    email: config.contact_email,
    image: absUrl(config, `/og-image-${t.lang}.png`),
    inLanguage: t.lang,
    areaServed: ['AT', 'DE', 'CH'],
    address: { '@type': 'PostalAddress', addressLocality: 'Graz', postalCode: '8020', addressCountry: 'AT' },
    founder: { '@type': 'Person', name: 'Iva Tsatskrialashvili', sameAs: [config.linkedin, config.malt] },
    priceRange: '€€',
  };
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

// GitHub Pages reads the custom domain from a CNAME file at the publishing root.
// The build writes it from site_url every time, so a rebuild can never drop it.
export function cname(config) {
  const host = new URL(config.site_url).hostname;
  return host.endsWith('.github.io') ? null : `${host}\n`;
}

export const robots = (config) => `User-agent: *\nAllow: /\n\nSitemap: ${absUrl(config, '/sitemap.xml')}\n`;

export function sitemap(config, buildDate) {
  const day = buildDate.toISOString().slice(0, 10);
  const urls = PAIRS.flatMap(([de, en]) =>
    [de, en].map(
      (loc) => `  <url>
    <loc>${absUrl(config, loc)}</loc>
    <lastmod>${day}</lastmod>
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
