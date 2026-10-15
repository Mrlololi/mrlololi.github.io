// Checks the published site on GitHub Pages (brief section 9.4).
// Usage: node src/qa/live.mjs [https://mrlololi.com]
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import config from '../config.json' with { type: 'json' };
import { chromium, qaDir } from './browsers.mjs';
import { network } from './checks.mjs';

const base = (process.argv[2] || config.site_url).replace(/\/$/, '');
const results = [];
const check = (name, pass, details = '') => results.push({ name, pass: Boolean(pass), details });

// Old and alternative addresses end on the canonical https origin, by real HTTP redirects.
for (const from of ['https://mrlololi.github.io/', 'https://mrlololi.github.io/en/', 'https://www.mrlololi.com/', 'http://mrlololi.com/', 'http://www.mrlololi.com/']) {
  try {
    const res = await fetch(from, { redirect: 'follow' });
    const to = new URL(res.url);
    const want = new URL(from.replace(/^http:/, 'https:').replace('://www.', '://').replace('mrlololi.github.io', new URL(base).host));
    check(`${from} -> ${res.url} (${res.status})`, res.status === 200 && res.redirected && to.origin === new URL(base).origin && to.pathname === want.pathname, `status ${res.status}`);
  } catch (e) {
    check(`${from} redirects to ${base}`, false, e.cause?.code || e.message);
  }
}

// Our pages: status, language, H1.
const ours = [
  ['/', 'de', 'Die Technik hinter Ihrem'],
  ['/en/', 'en', 'The tech behind your course launch'],
  ['/impressum/', 'de', 'Impressum'],
  ['/datenschutz/', 'de', 'Datenschutzerklärung'],
  ['/en/legal-notice/', 'en', 'Legal notice (Impressum)'],
  ['/en/privacy/', 'en', 'Privacy policy'],
];
for (const [p, lang, h1] of ours) {
  const res = await fetch(base + p, { redirect: 'manual' });
  const html = await res.text();
  check(`${p}: ${res.status}, lang=${lang}, H1 "${h1}"`, res.status === 200 && html.includes(`<html lang="${lang}"`) && html.includes(h1), `status ${res.status}`);
}
{
  const res = await fetch(base + '/gibt-es-nicht-' + Date.now() + '/');
  const html = await res.text();
  check('unknown path: 404 with our 404 page', res.status === 404 && html.includes('Diese Seite gibt es nicht.'), `status ${res.status}`);
}

// Existing project sites must work as before (separate repos).
const portfolio = [
  ['/Webprojekte/', 'Iva Tsatskrialashvili - Marketing Automation Engineer in Graz', null],
  ['/Webprojekte/geoapp/', 'GeoAPP', null],
  ['/GeoAPP/', 'GeoAPP has moved', '/Webprojekte/geoapp/'],
  ['/KittyCats/', 'KittyCats has moved', '/Webprojekte/kittycats/'],
];
for (const [p, title, redirect] of portfolio) {
  const res = await fetch(base + p, { redirect: 'manual' });
  const html = await res.text();
  const t = (html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1]?.trim() || '';
  // The old project pages point at their new home by an absolute URL of their own repo
  // (github.io or the custom domain, both end at the same page).
  const target = redirect ? new RegExp(`url=https://(mrlololi\\.github\\.io|${new URL(base).host.replace(/\./g, '\\.')})${redirect}`) : null;
  const ok = res.status === 200 && t.includes(title) && (!target || target.test(html));
  check(`${p}: ${res.status} "${t}"${redirect ? ` -> ${redirect}` : ''}`, ok, `status ${res.status}, title "${t}"`);
}
{
  const res = await fetch(base + '/Webprojekte/kittycats/', { redirect: 'manual' });
  check(`/Webprojekte/kittycats/ (redirect target): ${res.status}`, res.status === 200);
}

// Browser: same-origin requests only on the live pages, plus a screenshot of the live home page.
const browser = await chromium.launch();
results.push(...(await network(browser, base)).map((r) => ({ ...r, name: `live ${r.name}` })));
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(base + '/', { waitUntil: 'load' });
await page.waitForTimeout(3500);
await mkdir(path.join(qaDir, 'shots'), { recursive: true });
await page.screenshot({ path: path.join(qaDir, 'shots', 'live-home-1280.png') });
const done = await page.$$eval('.run__done', (cs) => cs.every((c) => getComputedStyle(c).opacity === '1'));
check('live home: run log finished, no console errors', done && errors.length === 0, errors.join(' | '));
await browser.close();

for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.pass ? '' : `  -> ${r.details}`}`);
process.exit(results.every((r) => r.pass) ? 0 : 1);
