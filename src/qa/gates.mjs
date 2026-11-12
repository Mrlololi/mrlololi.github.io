// Stage 7a (11.11.2026): test gates for mrlololi.com AND Webprojekte, so later stages cannot break
// the rules of «Ruhe und Maskottchen». One script for both repos: the main site runs it here
// (node src/qa/gates.mjs), Webprojekte calls it from its qa/gates.mjs. Both sites are served on one
// origin (src/qa/serve-both.mjs), like mrlololi.com and /Webprojekte/.
// Every page at 390 and 1280 px, light and dark:
//  1. CLS while scrolling: a buffered layout-shift observer, down and up in 200 px steps, total 0.
//  2. At most one big demo plays at any time (data-play="run" outside another running one).
// Once per page and width:
//  3. «Bewegung pausieren» set: no running CSS animation or WAAPI loop; reduced motion: no infinite one.
//  4. Every svg.mascot sits in a pokeable group (the hero ones have their own button, the reading
//     Logik in the FAQ answers a click); click and Enter give the reaction and the live-region line;
//     nothing focusable inside aria-hidden; no button inside a link.
// Once:
//  5. The pause carries over: set on mrlololi.com, open /Webprojekte/, still paused (and back).
//  6. Hub links to GeoAPP and Language Starter carry the language (DE and EN).
//  7. The vendored kit in Webprojekte equals the main site's (tools/sync-mrl-kit.mjs --check).
// Usage: node src/qa/gates.mjs [main|wp|all] [--quick]   (--quick: 390 light + 1280 light only)
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from './browsers.mjs';
import { startBoth } from './serve-both.mjs';

export const MAIN_PAGES = ['/', '/en/', '/impressum/', '/datenschutz/', '/en/legal-notice/', '/launch-technik/', '/en/course-launch-tech/', '/404.html', '/danke/'];
export const WP_PAGES = ['/Webprojekte/?lang=de', '/Webprojekte/?lang=en', '/Webprojekte/404.html', '/Webprojekte/geoapp/?lang=de', '/Webprojekte/language-starter/?ui=de', '/Webprojekte/language-starter/trainer/', '/Webprojekte/ki-kundenservice/'];
const SIZES = [{ w: 390, h: 800 }, { w: 1280, h: 900 }];
const SCHEMES = ['light', 'dark'];

// Records layout shifts from the start (buffered) and samples the running demos.
const PROBE = () => {
  window.__cls = 0;
  window.__shifts = [];
  window.__maxRun = 0;
  window.__runs = [];
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.hadRecentInput) continue;
        window.__cls += e.value;
        window.__shifts.push({ v: +e.value.toFixed(5), t: Math.round(e.startTime), src: (e.sources || []).map((s) => s.node ? `${s.node.nodeName}.${String(s.node.className?.baseVal ?? s.node.className ?? '').split(' ')[0]}` : '?').join(',') });
      }
    }).observe({ type: 'layout-shift', buffered: true });
  } catch { /* old browser */ }
  const sample = () => {
    const run = [...document.querySelectorAll('[data-play="run"]')].filter((el) => !el.parentElement?.closest('[data-play="run"]'));
    if (run.length > window.__maxRun) { window.__maxRun = run.length; window.__runs = run.map((el) => el.dataset.demo || el.className); }
  };
  setInterval(sample, 100);
};

async function scrollAll(page) {
  const h = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  for (let y = 0; y <= h; y += 200) { await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(60); }
  await page.waitForTimeout(400);
  for (let y = h; y >= 0; y -= 200) { await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(60); }
  await page.waitForTimeout(400);
}

export async function runGates({ which = 'all', quick = false, log = console.log } = {}) {
  const pages = which === 'main' ? MAIN_PAGES : which === 'wp' ? WP_PAGES : [...MAIN_PAGES, ...WP_PAGES];
  const server = await startBoth(8795);
  const browser = await chromium.launch();
  const results = [];
  const check = (name, pass, details = '') => { results.push({ name, pass, details }); log(`${pass ? 'ok  ' : 'FAIL'} ${name}${details ? ` (${details})` : ''}`); };
  const open = async (p, { w, h, scheme = 'light', reduced = false, paused = false, locale = 'de-DE' }) => {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: scheme, reducedMotion: reduced ? 'reduce' : 'no-preference', locale });
    await ctx.addInitScript(PROBE);
    if (paused) await ctx.addInitScript(() => { try { localStorage.setItem('motion-paused', '1'); } catch { /* none */ } });
    const page = await ctx.newPage();
    await page.goto(server.url + p, { waitUntil: 'load' });
    await page.waitForTimeout(1200);
    return { ctx, page };
  };
  try {
    for (const p of pages) {
      for (const size of SIZES) {
        for (const scheme of SCHEMES) {
          if (quick && scheme === 'dark') continue;
          const tag = `${p} ${size.w} ${scheme}`;
          const { ctx, page } = await open(p, { ...size, scheme });
          await scrollAll(page);
          const r = await page.evaluate(() => ({ cls: window.__cls, shifts: window.__shifts, maxRun: window.__maxRun, runs: window.__runs }));
          check(`CLS 0 while scrolling: ${tag}`, r.cls === 0, r.cls ? `${r.cls.toFixed(5)} ${JSON.stringify(r.shifts.slice(0, 4))}` : '');
          check(`one demo at a time: ${tag}`, r.maxRun <= 1, r.maxRun > 1 ? r.runs.join(', ') : '');
          await ctx.close();
        }
        const tag = `${p} ${size.w}`;
        // 3. Paused: nothing loops. Reduced motion: nothing infinite.
        for (const mode of ['paused', 'reduced']) {
          const { ctx, page } = await open(p, { ...size, paused: mode === 'paused', reduced: mode === 'reduced' });
          await scrollAll(page);
          await page.waitForTimeout(800);
          const anims = await page.evaluate((m) => document.getAnimations().filter((a) => a.playState === 'running').filter((a) => {
            const it = a.effect?.getTiming?.().iterations;
            return m === 'paused' ? (a.constructor.name === 'CSSAnimation' || it === Infinity) : it === Infinity;
          }).map((a) => `${a.constructor.name}:${a.animationName || ''}:${a.effect?.target?.className?.baseVal ?? a.effect?.target?.className ?? ''}`), mode);
          check(`${mode}: no running loop: ${tag}`, anims.length === 0, anims.slice(0, 5).join(' | '));
          if (mode === 'paused') {
            const run = await page.evaluate(() => document.querySelectorAll('[data-play="run"]').length);
            check(`paused: no demo plays: ${tag}`, run === 0, String(run));
          }
          await ctx.close();
        }
        // 4. Mascots.
        {
          const { ctx, page } = await open(p, size);
          const m = await page.evaluate(() => {
            const all = [...document.querySelectorAll('svg.mascot')];
            const loose = all.filter((s) => !s.closest('[data-poke]') && !s.closest('.mascot-spot') && !s.classList.contains('faq__logik') && !s.closest('.faq__chat, .faq'));
            const focusables = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
            const hiddenFocus = [...document.querySelectorAll('[aria-hidden="true"]')].flatMap((h) => [...h.querySelectorAll(focusables)]).filter((x) => !x.closest('[hidden]') && x.getAttribute('tabindex') !== '-1');
            const btnInLink = document.querySelectorAll('a button, a [role="button"], button a').length;
            // Groups on screen only (a thank-you panel waits hidden until a form is sent).
            const groups = [...document.querySelectorAll('[data-poke][role="button"]')].filter((g) => g.getClientRects().length).map((g) => {
              const r = g.getBoundingClientRect();
              return { name: g.getAttribute('aria-label'), w: r.width, h: r.height };
            });
            return { count: all.length, loose: loose.length, hiddenFocus: hiddenFocus.map((x) => x.outerHTML.slice(0, 60)), btnInLink, groups };
          });
          if (m.count) {
            check(`mascots in groups: ${tag}`, m.loose === 0, `${m.loose} of ${m.count}`);
            check(`mascot groups named, 44 px: ${tag}`, m.groups.length > 0 && m.groups.every((g) => g.name && g.w >= 44 && g.h >= 44), JSON.stringify(m.groups.filter((g) => !g.name || g.w < 44 || g.h < 44)));
          }
          check(`nothing focusable in aria-hidden: ${tag}`, m.hiddenFocus.length === 0, m.hiddenFocus.join(' | '));
          check(`no button inside a link: ${tag}`, m.btnInLink === 0, String(m.btnInLink));
          // Click and Enter on the footer group (every page has it) and the first other group.
          const groups = page.locator('[data-poke][role="button"]');
          const n = await groups.count();
          for (const i of [...new Set([0, n - 1])].filter((x) => x >= 0 && x < n)) {
            for (const how of ['click', 'Enter']) {
              const g = groups.nth(i);
              await g.scrollIntoViewIfNeeded();
              await page.evaluate(() => { const l = document.querySelector('[data-mascot-live]'); if (l) l.textContent = ''; });
              if (how === 'click') await g.click({ position: { x: 22, y: 22 } }); else { await g.focus(); await page.keyboard.press('Enter'); }
              await page.waitForTimeout(250);
              const r = await g.evaluate((el) => ({
                moving: [...el.querySelectorAll('svg.mascot')].some((s) => s.dataset.jumping === 'true' || s.dataset.emo !== s.dataset.base),
                bubble: Boolean(el.querySelector('.mbubble') || el.parentElement?.querySelector('.mbubble')),
                live: document.querySelector('[data-mascot-live]')?.textContent || '',
              }));
              check(`mascot ${how} reacts (${i}): ${tag}`, r.moving && r.bubble && r.live.length > 3, JSON.stringify(r));
              await page.waitForTimeout(1700);
            }
          }
          await ctx.close();
        }
      }
    }
    if (which !== 'main') {
      // 5. The pause carries over between the two sites (one origin, one key).
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await ctx.newPage();
      await page.goto(`${server.url}/`, { waitUntil: 'load' });
      await page.waitForTimeout(1200);
      await page.locator('.site-footer .motion-toggle').click();
      await page.goto(`${server.url}/Webprojekte/?lang=de`, { waitUntil: 'load' });
      await page.waitForTimeout(800);
      const wp = await page.evaluate(() => ({ attr: document.documentElement.dataset.motion, pressed: document.querySelector('.motion-toggle')?.getAttribute('aria-pressed') }));
      check('pause carries over: mrlololi.com -> /Webprojekte/', wp.attr === 'paused' && wp.pressed === 'true', JSON.stringify(wp));
      await page.locator('.site-footer .motion-toggle').click();
      await page.goto(`${server.url}/`, { waitUntil: 'load' });
      await page.waitForTimeout(1200);
      const main = await page.evaluate(() => ({ attr: document.documentElement.dataset.motion, pressed: document.querySelector('.site-footer .motion-toggle')?.getAttribute('aria-pressed') }));
      check('play carries back: /Webprojekte/ -> mrlololi.com', main.attr === 'on' && main.pressed === 'false', JSON.stringify(main));
      // 6. Hub links carry the language.
      for (const lang of ['de', 'en']) {
        await page.goto(`${server.url}/Webprojekte/?lang=${lang}`, { waitUntil: 'load' });
        await page.waitForTimeout(500);
        const bad = await page.evaluate((l) => [...document.querySelectorAll('a[href*="geoapp/"], a[href*="language-starter/"]')]
          .filter((a) => !a.closest('[aria-current]') && a.getAttribute('aria-current') !== 'page')
          .map((a) => a.getAttribute('href'))
          .filter((h) => !(h.includes(`lang=${l}`) || h.includes(`ui=${l}`))), lang);
        check(`hub links carry the language (${lang})`, bad.length === 0, bad.join(' '));
      }
      await ctx.close();
      // 7. The vendored kit is the main site's.
      const tool = path.resolve(fileURLToPath(new URL('../../../../webprojekte/site/tools/sync-mrl-kit.mjs', import.meta.url)));
      let ok = false; let out = '';
      if (existsSync(tool)) { try { out = execFileSync(process.execPath, [tool, '--check'], { encoding: 'utf8' }); ok = true; } catch (e) { out = String(e.stderr || e.message); } }
      check('Webprojekte mrl-kit equals the main kit', ok, out.trim());
    }
  } finally {
    await browser.close();
    await server.close();
  }
  return results;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const which = ['main', 'wp', 'all'].find((x) => process.argv.includes(x)) || 'all';
  const results = await runGates({ which, quick: process.argv.includes('--quick') });
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} gates ok`);
  process.exit(failed.length ? 1 : 0);
}
