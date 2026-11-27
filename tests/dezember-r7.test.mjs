// R7 «Maskottchen still & Handy-Menü» (docs/PROMPT_R7_Maskottchen_still_2026-11-25.md):
// 1. Mascots stay silent (no speech bubbles, no live-region announcements); smooth reactions stay; lines kept under _altLines.
// 2. Below 800 px the three mascots appear small & static in the first screen of home DE/EN; H1, lead & primary button stay inside 390x844.
// 3. Phone menu opens at the top from the very first tap (even under throttled CPU/network), never jumps to #footer-nav, lists all 6 rows >= 48 px, traps focus while open, closes on link/Escape, keeps header visible.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { pages } from '../src/build.mjs';
import config from '../src/config.json' with { type: 'json' };
import de from '../src/content/de.mjs';
import en from '../src/content/en.mjs';
import { budget } from '../src/qa/checks.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const all = pages(config, { live: {} });
const byFile = Object.fromEntries(all.map((p) => [p.file, p.html]));

test('R7 static: speech lines archived under _altLines, zero .mbubble CSS, hero chip kept, jump link only in <noscript>', async () => {
  for (const t of [de, en]) {
    assert.equal(t.brand.lines, undefined, `${t.lang}: brand.lines removed from live config`);
    assert.ok(t.brand._altLines.logik.length >= 3 && t.brand._altLines.footer.length >= 2, `${t.lang}: _altLines preserved`);
  }
  const css = readFileSync(path.join(root, 'assets/css/main.css'), 'utf8');
  assert.ok(!/\.mbubble\b/.test(css), 'no .mbubble style in main.css');
  for (const f of ['index.html', 'en/index.html', 'launch-technik/index.html', '404.html']) {
    const h = byFile[f];
    assert.match(h, /<noscript><a class="site-nav__jump" href="#footer-nav">/, `${f}: jump link inside <noscript>`);
    assert.match(h, /<button class="site-nav__toggle" type="button" aria-expanded="false" aria-controls="site-nav-list">/, `${f}: toggle not hidden`);
    assert.match(h, /<\/header><script>\(\(\)=>\{/, `${f}: inline nav script right after </header>`);
    const say = JSON.parse(h.match(/<script type="application\/json" id="mascot-say">([\s\S]*?)<\/script>/)[1]);
    assert.equal(say.lines, undefined, `${f}: no speech lines in #mascot-say`);
  }
  assert.ok(byFile['index.html'].includes('Hallo, ich bin Iva'), 'DE hero chip kept');
  assert.ok(byFile['en/index.html'].includes("Hi, I&#39;m Iva") || byFile['en/index.html'].includes("Hi, I'm Iva"), 'EN hero chip kept');

  const [b] = await budget();
  const inlineNav = byFile['index.html'].match(/<\/header>(<script>[\s\S]*?<\/script>)/)[1];
  const inlineKb = gzipSync(inlineNav, { level: 9 }).length / 1024;
  const totalKb = Number(b.name.match(/JS ([\d.]+) KB/)[1]) + inlineKb;
  assert.ok(b.pass && totalKb <= 100, `JS + inline nav ${totalKb.toFixed(2)} KB gzip (<= 100 KB)`);
});

test('R7 browser: throttled phone menu opens at top on first tap (scrollY=0), focus trap, 6 rows >= 48px, Escape & link close', { timeout: 60000 }, async () => {
  const { chromium } = await import('../src/qa/browsers.mjs');
  const { startServer } = await import('../src/qa/serve.mjs');
  const server = await startServer({ root });
  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    // Throttle CPU & network AND delay main.js so the tap happens well before main.js ever runs.
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 250, downloadThroughput: 60 * 1024, uploadThroughput: 30 * 1024 });
    await page.route('**/assets/js/main.js', async (route) => {
      await new Promise((r) => setTimeout(r, 4000));
      await route.continue().catch(() => {});
    });
    await page.goto(`${server.url}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(100);
    // Tap «Menü» 100 ms after first paint: must open at the top, scrollY stays 0.
    await page.click('.site-nav__toggle');
    const open = await page.evaluate(() => {
      const nav = document.querySelector('.site-nav');
      const hdr = document.querySelector('.site-header');
      const list = document.querySelector('.site-nav__list');
      const items = [...list.querySelectorAll('a, button')].map((el) => ({
        text: el.textContent.trim(),
        h: Math.round(el.getBoundingClientRect().height),
      }));
      return {
        isOpen: nav.classList.contains('is-open'),
        expanded: document.querySelector('.site-nav__toggle').getAttribute('aria-expanded'),
        scrollY: Math.round(window.scrollY),
        jumpVisible: Boolean(document.querySelector('.site-nav__jump')?.getClientRects().length),
        listTop: Math.round(list.getBoundingClientRect().top),
        headerHidden: hdr.classList.contains('is-hidden'),
        items,
      };
    });
    assert.equal(open.isOpen, true);
    assert.equal(open.expanded, 'true');
    assert.equal(open.scrollY, 0, 'scroll position unchanged (never jumped to footer)');
    assert.equal(open.jumpVisible, false, 'jump link never visible with JS on');
    assert.ok(open.listTop <= 75, `dropdown opens at top (${open.listTop}px)`);
    assert.equal(open.headerHidden, false);
    assert.deepEqual(open.items.map((x) => x.text), ['Leistungen', 'Zum Ausprobieren', 'Über mich', 'Kontakt', 'EN', 'Bewegung pausieren']);
    assert.ok(open.items.every((x) => x.h >= 48), `every menu row >= 48px: ${JSON.stringify(open.items)}`);

    // Focus stays inside the menu while open (Tab wraps back to toggle).
    await page.focus('.site-nav__toggle');
    for (let i = 0; i < 7; i += 1) await page.keyboard.press('Tab');
    const wrapped = await page.evaluate(() => document.activeElement?.classList.contains('site-nav__toggle'));
    assert.equal(wrapped, true, 'Tab wraps inside open menu back to toggle');

    // Escape closes menu and returns focus to toggle.
    await page.keyboard.press('Escape');
    const esc = await page.evaluate(() => ({
      open: document.querySelector('.site-nav').classList.contains('is-open'),
      focusToggle: document.activeElement?.classList.contains('site-nav__toggle'),
    }));
    assert.deepEqual(esc, { open: false, focusToggle: true });

    // Reopen and tap a link -> closes menu.
    await page.click('.site-nav__toggle');
    await page.click('.site-nav__list a[href="#services"]');
    const afterLink = await page.evaluate(() => document.querySelector('.site-nav').classList.contains('is-open'));
    assert.equal(afterLink, false, 'clicking a link closes the phone menu');
    await ctx.close();
  } finally {
    await browser.close();
    await server.close();
  }
});

test('R7 browser: phone first screen shows 3 static mascots + H1/lead/CTA inside 390x844; tapping gives silent reaction (DE & EN); hidden on desktop', { timeout: 60000 }, async () => {
  const { chromium } = await import('../src/qa/browsers.mjs');
  const { startServer } = await import('../src/qa/serve.mjs');
  const server = await startServer({ root });
  const browser = await chromium.launch();
  try {
    for (const p of ['/', '/en/']) {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await ctx.addInitScript(() => {
        window.__cls = 0;
        new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
      });
      const page = await ctx.newPage();
      await page.goto(server.url + p, { waitUntil: 'load' });
      await page.waitForTimeout(1000);
      const first = await page.evaluate(() => {
        const box = (sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height) }; };
        const trio = document.querySelector('.hero__trio');
        const svgs = [...trio.querySelectorAll('svg.mascot')];
        return {
          cls: window.__cls,
          h1: box('#hero-title'),
          lead: box('.hero__lead'),
          cta: box('.hero__ctas .btn--primary'),
          trio: box('.hero__trio'),
          mascotWidths: svgs.map((s) => Math.round(s.getBoundingClientRect().width)),
          loadAnims: trio.getAnimations({ subtree: true }).length,
          role: trio.getAttribute('role'),
          label: trio.getAttribute('aria-label'),
        };
      });
      assert.equal(first.cls, 0, `${p}: CLS 0`);
      assert.ok(first.h1.bottom <= 844 && first.lead.bottom <= 844 && first.cta.bottom <= 844, `${p}: H1/lead/CTA inside 844px: ${JSON.stringify(first)}`);
      assert.ok(first.trio.bottom <= 844 && first.trio.h >= 44, `${p}: hero trio inside 844px and >=44px tall: ${JSON.stringify(first.trio)}`);
      assert.equal(first.mascotWidths.length, 3);
      assert.ok(first.mascotWidths.every((w) => w >= 40 && w <= 48), `${p}: mascot widths 40-48px: ${first.mascotWidths}`);
      assert.equal(first.loadAnims, 0, `${p}: static on load`);
      assert.equal(first.role, 'button');
      assert.match(first.label, /Logik.*Lösung.*Live/);

      // Tap the first mascot in hero__trio -> silent reaction, zero bubbles, zero live-region text.
      await page.locator('.hero__trio svg.mascot').first().click();
      await page.waitForTimeout(250);
      const reacted = await page.evaluate(() => ({
        moving: [...document.querySelectorAll('.hero__trio svg.mascot')].some((s) => s.dataset.jumping === 'true' || s.dataset.emo !== s.dataset.base),
        bubbles: document.querySelectorAll('.mbubble').length,
        live: document.querySelector('[data-mascot-live]')?.textContent || '',
      }));
      assert.deepEqual(reacted, { moving: true, bubbles: 0, live: '' }, `${p}: silent reaction on hero trio tap`);
      await ctx.close();
    }

    // Desktop (1280px): hero__trio is hidden; hero diagram mascot reacts silently.
    const dpage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await dpage.goto(`${server.url}/`, { waitUntil: 'load' });
    await dpage.waitForTimeout(1000);
    const desk = await dpage.evaluate(() => getComputedStyle(document.querySelector('.hero__trio')).display);
    assert.equal(desk, 'none', 'hero__trio hidden on desktop');
    await dpage.click('.mascot-spot--live .mascot-btn');
    await dpage.waitForTimeout(250);
    const dReact = await dpage.evaluate(() => ({
      moving: document.querySelector('.mascot-spot--live svg.mascot').dataset.jumping === 'true',
      bubbles: document.querySelectorAll('.mbubble').length,
      live: document.querySelector('[data-mascot-live]')?.textContent || '',
    }));
    assert.deepEqual(dReact, { moving: true, bubbles: 0, live: '' });
    await dpage.close();
  } finally {
    await browser.close();
    await server.close();
  }
});
