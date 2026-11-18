// Stage 7b-S: the rendered HTML of the Webprojekte pages (Playwright, JS on) with a German and an English
// browser locale: canonical, title, <html lang> and og:url equal the server HTML. Every <loc> of both
// sitemaps answers 200 locally.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chromium } from '../src/qa/browsers.mjs';
import { startBoth } from '../src/qa/serve-both.mjs';
import config from '../src/config.json' with { type: 'json' };

const PAGES = ['/Webprojekte/', '/Webprojekte/geoapp/', '/Webprojekte/language-starter/'];
const signals = () => ({
  canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
  title: document.title,
  lang: document.documentElement.lang,
  ogUrl: document.querySelector('meta[property="og:url"]')?.getAttribute('content') ?? null,
});

test('Webprojekte: rendered canonical, title, html lang and og:url equal the server HTML (DE and EN locale)', { timeout: 300000 }, async () => {
  const server = await startBoth(8798);
  const browser = await chromium.launch();
  const report = [];
  try {
    for (const p of PAGES) {
      const raw = await (await fetch(server.url + p)).text();
      const ctx0 = await browser.newContext({ javaScriptEnabled: false });
      const page0 = await ctx0.newPage();
      await page0.setContent(raw);
      const want = await page0.evaluate(signals);
      await ctx0.close();
      for (const locale of ['de-DE', 'en-GB']) {
        const ctx = await browser.newContext({ locale, viewport: { width: 1280, height: 900 } });
        const page = await ctx.newPage();
        await page.goto(server.url + p, { waitUntil: 'load' });
        await page.waitForTimeout(1500);
        const got = await page.evaluate(signals);
        report.push(`${p} ${locale}: ${JSON.stringify(got)}`);
        assert.deepEqual(got, want, `${p} ${locale}`);
        await ctx.close();
      }
    }
  } finally {
    await browser.close();
    await server.close();
    console.log(report.join('\n'));
  }
});

test('every <loc> of both sitemaps answers 200 locally', { timeout: 120000 }, async () => {
  const server = await startBoth(8799);
  try {
    const main = readFileSync(new URL('../sitemap.xml', import.meta.url), 'utf8');
    const wp = readFileSync(new URL('../../../webprojekte/site/sitemap.xml', import.meta.url), 'utf8');
    const locs = [...`${main}${wp}`.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(config.site_url, ''));
    assert.ok(locs.length >= 20, `${locs.length}`);
    for (const l of locs) {
      assert.ok(!l.includes('?'), l);
      const res = await fetch(server.url + l);
      assert.equal(res.status, 200, l);
    }
  } finally {
    await server.close();
  }
});
