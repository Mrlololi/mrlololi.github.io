// Werkzeug «Ein Kauf» (docs/PROMPT_Werkzeug_Ein_Kauf_2026-11-13.md): /werkzeuge/ein-kauf/.
// Static half here; the browser half (hash, one step off, reset, no JS, CLS, phone widths) below with Playwright.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import config from '../src/config.json' with { type: 'json' };
import de from '../src/content/de.mjs';
import { kauf } from '../src/content/kerne/launch.de.mjs';
import { pages } from '../src/build.mjs';
import { sitemap } from '../src/templates/seo.mjs';
import { scan } from '../src/qa/wortfilter.mjs';
import { chromium } from '../src/qa/browsers.mjs';
import { startServer } from '../src/qa/serve.mjs';

const P = config.werkzeug_ein_kauf_path;
const built = pages(config, { articles: [] });
const by = Object.fromEntries(built.map((p) => [p.file, p.html]));
const html = by[`${P.slice(1)}index.html`];
const IDS = ['bestellung', 'zahlung', 'rechnung', 'markierung', 'zugang', 'willkommen'];
const root = new URL('../', import.meta.url);

test('the page: DE, one config value for the path, the six permanent anchors, sitemap, page date', () => {
  assert.equal(P, '/werkzeuge/ein-kauf/');
  assert.ok(html && /<html lang="de">/.test(html));
  assert.deepEqual(kauf.map((k) => k.id), IDS);
  for (const id of IDS) assert.equal((html.match(new RegExp(`<section class="ek-panel" id="${id}"`, 'g')) || []).length, 1, id);
  assert.match(sitemap(config), new RegExp(`<loc>${config.site_url}${P}</loc>\\s*<lastmod>${config.page_dates.ein_kauf}</lastmod>`));
  assert.match(html, new RegExp(`<link rel="canonical" href="${config.site_url}${P}">`));
  assert.ok(!Object.keys(by).some((f) => f.startsWith('en/') && f.includes('werkzeug')), 'no English page');
});

test('every panel: the label line, the buyer sentence as title, the invented mail with its label and the KI link', () => {
  for (const k of kauf) {
    const s = html.split(`<section class="ek-panel" id="${k.id}"`)[1].split('</section>')[0];
    assert.ok(s.includes(`<p class="ek-panel__label">${de.einKauf.label}</p>`), k.id);
    assert.ok(s.includes(`«${k.kaeuferinSatz}»`), k.id);
    assert.ok(s.includes('<figcaption class="label label--peach">erfundene Nachricht</figcaption>'), k.id);
    assert.ok(s.includes('href="/Webprojekte/ki-kundenservice/">So sortiert eine KI solche Mails vor</a>'), k.id);
    assert.ok(!s.includes(de.einKauf.rows.notfall), `${k.id}: «Was Sie in dem Moment tun» hidden until notfallId is set`);
    assert.deepEqual(k.flags, ['beispiel']);
    for (const w of ['Stripe', 'Quaderno', 'ActiveCampaign', 'Digistore', 'CopeCart', 'ablefy']) assert.ok(!s.includes(w), `${k.id}: ${w}`);
  }
});

test('exit: one priced exit from the package data, paket=check and quelle=ein-kauf; no price literal in the template', () => {
  const pkg = de.pricing.groups.flatMap((g) => g.items).find((i) => i.id === 'check');
  assert.ok(html.includes(`<a class="btn btn--primary" href="/?paket=check&amp;quelle=ein-kauf#contact">${pkg.name}, ${pkg.price.replace(/\s*fix$/, '')}</a>`));
  const tpl = readFileSync(new URL('src/templates/werkzeug-ein-kauf.mjs', root), 'utf8');
  assert.ok(!/\d+\s?€|290/.test(tpl));
  const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
  assert.equal((main.match(/€/g) || []).length, 1, 'one price in the page body (the JSON-LD priceRange «€€» aside)');
});

test('head: title, description 120-160, WebApplication and BreadcrumbList; the home links the page under the run-log', () => {
  assert.match(html, /<title>Ein Kauf: Was, wenn ein Teil fehlt\? \| mrlololi<\/title>/);
  const d = de.einKauf.description.length;
  assert.ok(d >= 120 && d <= 160, d);
  assert.match(html, /"@type":"WebApplication","name":"Ein Kauf: Was, wenn ein Teil fehlt\?","url":"https:\/\/mrlololi.com\/werkzeuge\/ein-kauf\/","applicationCategory":"BusinessApplication"/);
  assert.match(html, /"isAccessibleForFree":true,"inLanguage":"de","author":\{"@id":"https:\/\/mrlololi.com\/#iva"\}/);
  assert.match(html, /"@type":"BreadcrumbList"/);
  assert.ok(by['index.html'].includes(`<a class="text-link rl-toollink" href="${P}">Was passiert, wenn ein Schritt fehlt? Selbst ausprobieren</a>`));
});

test('word check on the page text (Wortfilter lists for /werkzeuge/ein-kauf/ and the tool scope)', () => {
  assert.deepEqual(scan([{ page: P, html }], de), []);
});

test('in a browser: zugang off on load, the hash opens its step, one step at a time, reset, no JS, CLS 0, 360/390 px', { timeout: 300000 }, async () => {
  const server = await startServer({ root: fileURLToPath(root) });
  const browser = await chromium.launch();
  try {
    const open = async (hash = '', { js = true, w = 1280 } = {}) => {
      const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, javaScriptEnabled: js });
      await ctx.addInitScript(() => { window.__cls = 0; try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); } catch { /* none */ } });
      const page = await ctx.newPage();
      await page.goto(server.url + P + hash, { waitUntil: 'load' });
      await page.waitForTimeout(js ? 800 : 200);
      return { ctx, page };
    };
    const state = (page) => page.evaluate(() => ({
      pressed: [...document.querySelectorAll('.ek-switch[aria-pressed="true"]')].map((b) => b.dataset.step),
      active: [...document.querySelectorAll('.ek-panel.is-active')].map((p) => p.id || 'intact'),
      off: document.querySelector('.rl--kauf').dataset.off || null,
      fehlt: [...document.querySelectorAll('.rl__log.is-off')].map((l) => l.dataset.id),
      fehltText: getComputedStyle(document.querySelector('.rl__log.is-off .rl__fehlt') || document.body).display,
      kommt: [...document.querySelectorAll('.rl__log.is-missing')].map((l) => l.dataset.id),
    }));
    {
      const { ctx, page } = await open();
      let s = await state(page);
      assert.deepEqual([s.pressed, s.active, s.off, s.fehlt], [['zugang'], ['zugang'], 'zugang', ['zugang']]);
      assert.notEqual(s.fehltText, 'none', '«fehlt» shown as text, not colour alone');
      await page.click('.ek-switch[data-step="zahlung"]');
      s = await state(page);
      assert.deepEqual([s.pressed, s.active, s.off], [['zahlung'], ['zahlung'], 'zahlung'], 'switching another one restores the first');
      assert.deepEqual(s.kommt, ['rechnung', 'markierung', 'zugang', 'willkommen']);
      assert.ok(page.url().endsWith('#zahlung'));
      for (const id of IDS) { await page.click(`.ek-switch[data-step="${id}"]`); await page.waitForTimeout(120); }
      await page.click('.ek-reset');
      s = await state(page);
      assert.deepEqual([s.pressed, s.active, s.off, s.fehlt], [[], ['intact'], null, []]);
      assert.equal(await page.textContent('.rl__summary'), '6 Schritte, 0 Fehler (vereinfachtes Beispiel)');
      assert.equal(await page.evaluate(() => window.__cls), 0, 'CLS 0 while switching all six');
      await ctx.close();
    }
    {
      const { ctx, page } = await open('#rechnung');
      assert.deepEqual((await state(page)).pressed, ['rechnung']);
      await ctx.close();
    }
    {
      const { ctx, page } = await open('', { js: false });
      const r = await page.evaluate(() => ({ panels: [...document.querySelectorAll('.ek-panel')].filter((p) => getComputedStyle(p).display !== 'none' && getComputedStyle(p).visibility !== 'hidden').map((p) => p.id), switches: getComputedStyle(document.querySelector('.ek-switches')).display }));
      assert.deepEqual(r.panels, IDS, 'no JS: the six sections in order');
      assert.equal(r.switches, 'none');
      await ctx.close();
    }
    for (const w of [360, 390]) {
      const { ctx, page } = await open('', { w });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `no horizontal scroll at ${w}`);
      await ctx.close();
    }
  } finally {
    await browser.close();
    await server.close();
  }
});
