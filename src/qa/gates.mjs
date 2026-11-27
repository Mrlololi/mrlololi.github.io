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
//  8. «glatt» (rule 7 of design system 5.1): no frame-to-frame jump of a mascot, the run-log dot or an
//     entering element (src/qa/glatt.mjs).
// Usage: node src/qa/gates.mjs [main|wp|all] [--quick]   (--quick: 390 light + 1280 light only)
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from './browsers.mjs';
import { startBoth } from './serve-both.mjs';
import { glattGate } from './glatt.mjs';

export const MAIN_PAGES = ['/', '/en/', '/impressum/', '/datenschutz/', '/en/legal-notice/', '/launch-technik/', '/en/course-launch-tech/', '/404.html', '/danke/', '/qualitaet/', '/werkzeuge/ein-kauf/', '/musterbericht/technik-check/'];
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
          // Visible groups only: on /werkzeuge/ein-kauf/ the scene with Live folds away (display: none) while a
          // step is off (Iva 18.11.2026, no empty hole); a hidden group can be neither clicked nor focused.
          const groups = page.locator('[data-poke][role="button"]:visible');
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
    if (which !== 'wp') {
      // Stage 7b gate 6: pages that must not change, motion paused, pixel diff <= 0.1 % against the
      // baseline taken after the 7b tokens (node src/qa/gates.mjs --visual-baseline writes it).
      for (const r of await visualRegression(browser, server.url, { update: baselineMode })) check(r.name, r.pass, r.details);
      for (const r of await stage7bGates(browser, server.url, { quick })) check(r.name, r.pass, r.details);
    }
    // Gate «glatt» (design system 5.1 rule 7, 18.11.2026): every page of the chosen site(s) at 1280 (src/qa/glatt.mjs).
    if (!quick) for (const r of await glattGate(browser, server.url, pages)) check(r.name, r.pass, r.details);
  } finally {
    await browser.close();
    await server.close();
  }
  return results;
}

/* ---------- Stage 7b gates 1g, 3, 4, 5 (half 2) ---------- */
// Records, every 100 ms: [data-enter] elements (and the children of a stagger list) that are a quarter
// visible but still hidden (opacity < 0.99), with how long they have been so.
const ENTER_PROBE = () => {
  window.__hiddenLong = [];
  const since = new Map();
  setInterval(() => {
    const now = performance.now();
    for (const el of document.querySelectorAll('[data-enter]')) {
      for (const p of el.dataset.enter === 'stagger' ? [...el.children] : [el]) {
        const r = p.getBoundingClientRect();
        const vis = r.height > 0 ? Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0)) / r.height : 0;
        const hidden = Number(getComputedStyle(p).opacity) < 0.99;
        if (vis >= 0.25 && hidden) {
          if (!since.has(p)) since.set(p, now);
          if (now - since.get(p) > 1000) window.__hiddenLong.push(`${p.tagName.toLowerCase()}.${String(p.className).split(' ')[0]}#${p.id}`);
        } else since.delete(p);
      }
    }
  }, 100);
};

export async function stage7bGates(browser, base, { quick = false } = {}) {
  const out = [];
  const check = (name, pass, details = '') => out.push({ name, pass: Boolean(pass), details });
  const ctxFor = async (w, { paused = false, reduced = false, js = true } = {}) => {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, reducedMotion: reduced ? 'reduce' : 'no-preference', javaScriptEnabled: js });
    if (paused) await ctx.addInitScript(() => { try { localStorage.setItem('motion-paused', '1'); } catch { /* none */ } });
    if (js) await ctx.addInitScript(ENTER_PROBE);
    if (js) await ctx.addInitScript(PROBE);
    return ctx;
  };
  const widths = quick ? [390] : [390, 1280];
  // Gate 3: entrances.
  for (const p of ['/', '/launch-technik/', '/impressum/']) {
    for (const w of widths) {
      const ctx = await ctxFor(w);
      const page = await ctx.newPage();
      await page.goto(base + p, { waitUntil: 'load' });
      await page.waitForTimeout(1500);
      const first = await page.evaluate(() => [...document.querySelectorAll('[data-enter]')].filter((el) => el.getBoundingClientRect().top < innerHeight).map((el) => el.tagName));
      // Slow down, jump to the bottom, up again, a jump to the contact form.
      const h = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
      const lowOpacity = [];
      for (let y = 0; y <= h; y += 300) {
        await page.evaluate((v) => scrollTo(0, v), y);
        await page.waitForTimeout(250);
        if (w < 800) {
          const faded = await page.evaluate(() => [...document.querySelectorAll('[data-enter], [data-enter="stagger"] > *')].filter((el) => {
            const b = el.getBoundingClientRect();
            return b.height > 0 && b.bottom > 0 && b.top < innerHeight && Number(getComputedStyle(el).opacity) < 0.99;
          }).map((el) => el.tagName + '.' + String(el.className).split(' ')[0]));
          if (faded.length) lowOpacity.push(...faded);
        }
      }
      if (w < 800) check(`entrances, phone (${w}px): zero opacity < 1 while scrolling: ${p}`, lowOpacity.length === 0, [...new Set(lowOpacity)].slice(0, 5).join(' '));
      await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(600);
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await page.waitForTimeout(1500);
      for (let y = h; y >= 0; y -= 600) { await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(150); }
      await page.evaluate(() => { const c = document.getElementById('contact') || document.getElementById('svc-contact'); c?.scrollIntoView(); });
      await page.waitForTimeout(1500);
      const r = await page.evaluate(() => ({
        hidden: [...new Set(window.__hiddenLong)],
        lead: document.querySelector('p.hero__lead') ? document.querySelector('p.hero__lead').getAnimations().length + (document.querySelector('p.hero__lead').hasAttribute('data-entered') ? 1 : 0) : 0,
        entered: document.querySelectorAll('[data-entered]').length,
        firstEntered: [...document.querySelectorAll('[data-enter]')].filter((el) => el.hasAttribute('data-entered') && el.closest('.hero')).length,
      }));
      check(`entrances: nothing stays hidden while a quarter is visible for 1 s: ${p} ${w}`, r.hidden.length === 0, r.hidden.slice(0, 5).join(' '));
      check(`entrances: the LCP lead never animates, nothing of the first screen enters: ${p} ${w}`, r.lead === 0 && r.firstEntered === 0, JSON.stringify({ ...r, hidden: r.hidden.length, first }));
      await ctx.close();
    }
    // Reduced motion, paused, no JS: the end frame (every [data-enter] fully shown, nothing entered).
    for (const mode of ['reduced', 'paused', 'nojs']) {
      const ctx = await ctxFor(1280, { reduced: mode === 'reduced', paused: mode === 'paused', js: mode !== 'nojs' });
      const page = await ctx.newPage();
      await page.goto(base + p, { waitUntil: 'load' });
      await page.waitForTimeout(1200);
      const h = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y <= h; y += 600) { await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(80); }
      await page.waitForTimeout(700);
      const bad = await page.evaluate(() => [...document.querySelectorAll('[data-enter], [data-enter="stagger"] > *')].filter((el) => Number(getComputedStyle(el).opacity) < 0.99 || el.hasAttribute('data-entered') || el.getAnimations().length).map((el) => el.tagName + '.' + String(el.className).split(' ')[0]));
      check(`entrances, ${mode}: the end frame, nothing hidden, nothing entered: ${p}`, bad.length === 0, bad.slice(0, 5).join(' '));
      await ctx.close();
    }
  }
  // Gate 4: the run-log story. R3 (December release): the run-log lives on /werkzeuge/ein-kauf/ only (home has the
  // teaser card). The stage keeps its height while each of the six steps is switched off, one step at a time, and
  // nothing runs once it rests (also with the global pause).
  for (const w of widths) {
    const ctx = await ctxFor(w);
    const page = await ctx.newPage();
    await page.goto(base + '/werkzeuge/ein-kauf/', { waitUntil: 'load' });
    await page.waitForFunction(() => document.documentElement.classList.contains('ek-ready'), null, { timeout: 8000 }).catch(() => {});
    await page.mouse.move(1, 1);
    const ids = await page.evaluate(() => [...document.querySelectorAll('.ek-switch')].map((b) => b.dataset.step));
    const hs = new Set(); let maxPressed = 0;
    for (const id of ids) {
      await page.click(`.ek-switch[data-step="${id}"]`);
      await page.waitForTimeout(400);
      const r = await page.evaluate(() => ({ h: Math.round(document.querySelector('.rl__scene').getBoundingClientRect().height), pressed: document.querySelectorAll('.ek-switch[aria-pressed="true"]').length }));
      hs.add(r.h); maxPressed = Math.max(maxPressed, r.pressed);
    }
    check(`run-log ${w}: stage height constant over the six steps`, ids.length === 6 && hs.size === 1, [...hs].join(','));
    check(`run-log ${w}: one step off at a time`, maxPressed === 1, String(maxPressed));
    await page.waitForTimeout(2500);
    const running = await page.evaluate(() => document.querySelector('.rl').getAnimations({ subtree: true }).filter((a) => a.playState === 'running' && a.effect?.getComputedTiming().iterations === Infinity).length);
    check(`run-log ${w}: nothing loops once it rests`, running === 0, String(running));
    await ctx.close();
    const still = await ctxFor(w, { paused: true });
    const sp = await still.newPage();
    await sp.goto(base + '/werkzeuge/ein-kauf/', { waitUntil: 'load' });
    await sp.waitForTimeout(2500);
    const e = await sp.evaluate(() => { const rl = document.querySelector('.rl'); return { anims: rl.getAnimations({ subtree: true }).filter((a) => a.playState === 'running').length, summary: getComputedStyle(rl.querySelector('.rl__summary')).visibility }; });
    check(`run-log ${w}, paused: at rest, nothing running`, e.anims === 0 && e.summary === 'visible', JSON.stringify(e));
    await still.close();
  }
  // Gate 5: the conductor (1280: the process block and the hero line).
  {
    const ctx = await ctxFor(1280);
    const page = await ctx.newPage();
    await page.goto(base + '/', { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    const play = (sel) => page.evaluate((s) => document.querySelector(s)?.dataset.play, sel);
    const waitFor = async (sel, v, ms) => { const t = Date.now(); while (Date.now() - t < ms) { if (await play(sel) === v) return true; await page.waitForTimeout(100); } return false; };
    const steady = async (sel, ms) => { const t = Date.now(); while (Date.now() - t < ms) { if (await play(sel) === 'run') return false; await page.waitForTimeout(100); } return true; };
    const P = '.steps-wrap';
    await page.evaluate(() => document.querySelector('.steps-wrap').scrollIntoView({ block: 'center' }));
    await page.mouse.move(1, 1);
    const ran = await waitFor(P, 'run', 6000);
    // Pointer inside: the round finishes, then no new round while it stays.
    const box = await page.locator(P).boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await waitFor(P, 'end', 8000);
    const heldPointer = await steady(P, 6500);
    await page.mouse.move(1, 1);
    const resumed = await waitFor(P, 'run', 7000);
    check('conductor: the pointer inside holds the loop (no new round), leaving lets it go on', ran && heldPointer && resumed, JSON.stringify({ ran, heldPointer, resumed }));
    // A text selection inside holds it too.
    await waitFor(P, 'end', 8000);
    await page.evaluate(() => { const s = document.querySelector('.steps-wrap .step__title'); const r = document.createRange(); r.selectNodeContents(s); getSelection().removeAllRanges(); getSelection().addRange(r); });
    const heldSel = await steady(P, 6500);
    await page.evaluate(() => getSelection().removeAllRanges());
    check('conductor: a text selection inside holds the loop', heldSel);
    // Focus inside (the hero flow buttons).
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(500);
    const H = '.hero__flow';
    await waitFor(H, 'end', 9000);
    await page.evaluate(() => document.querySelector('.hf__btn--1')?.focus());
    const heldFocus = await steady(H, 6500);
    await page.evaluate(() => document.activeElement?.blur());
    check('conductor: the focus inside holds the loop', heldFocus);
    // A claim silences the running loop for its length.
    await page.evaluate(() => document.querySelector('.steps-wrap').scrollIntoView({ block: 'center' }));
    await waitFor(P, 'run', 9000);
    await page.evaluate(() => import('/assets/js/kit/motion.js').then((m) => { window.__release = m.stage.claim(document.querySelector('#faq') || document.body, 3000); }));
    await page.waitForTimeout(700);
    const silenced = (await play(P)) === 'end' && await steady(P, 2000);
    check('conductor: a claim fades the running loop to its end frame and holds it', silenced);
    // Three rounds, then still (the process block, left on screen).
    await page.evaluate(() => { scrollTo(0, 0); });
    await page.waitForTimeout(1500);
    await page.evaluate(() => document.querySelector('.steps-wrap').scrollIntoView({ block: 'center' }));
    let runs = 0; let last = null; const t0 = Date.now();
    while (Date.now() - t0 < 60000) {
      const v = await play(P);
      if (v === 'run' && last !== 'run') runs++;
      last = v;
      await page.waitForTimeout(100);
    }
    check('conductor: three rounds, then the end frame', runs === 3 && last === 'end', `${runs} rounds, now ${last}`);
    await ctx.close();
  }
  // Gate 1g: one story at a time while scrolling the whole page, sampled every 100 ms (R3: no run-log tab on home).
  for (const w of widths) {
    for (const p of ['/', '/en/']) {
      const ctx = await ctxFor(w);
      const page = await ctx.newPage();
      await page.goto(base + p, { waitUntil: 'load' });
      await page.waitForTimeout(1200);
      // R3: home has no run-log tab any more; the scroll through the whole page stays.
      await page.waitForTimeout(5000);
      await scrollAll(page);
      const r = await page.evaluate(() => ({ maxRun: window.__maxRun, runs: window.__runs }));
      check(`one story at a time: ${p} ${w}`, r.maxRun <= 1, r.runs.join(', '));
      await ctx.close();
    }
  }
  return out;
}

/* ---------- Stage 7b gate 6: visual regression ---------- */
export const STILL_PAGES = ['/impressum/', '/datenschutz/', '/danke/', '/404.html'];
const BASE_DIR = path.resolve(fileURLToPath(new URL('../../../qa/s7b-baseline/', import.meta.url)));
const baselineMode = process.argv.includes('--visual-baseline');

export async function visualRegression(browser, base, { update = false, pages = STILL_PAGES, limit = 0.001 } = {}) {
  const { mkdirSync, writeFileSync, readFileSync } = await import('node:fs');
  const sharp = (await import('sharp')).default;
  mkdirSync(BASE_DIR, { recursive: true });
  const out = [];
  for (const p of pages) {
    for (const w of [390, 1280]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'no-preference' });
      await ctx.addInitScript(() => { try { localStorage.setItem('motion-paused', '1'); } catch { /* none */ } });
      const page = await ctx.newPage();
      await page.goto(base + p, { waitUntil: 'load' });
      await page.waitForTimeout(1500);
      const png = await page.screenshot({ fullPage: true, animations: 'disabled' });
      await ctx.close();
      const file = path.join(BASE_DIR, `${p.replace(/\W+/g, '_') || 'home'}-${w}.png`);
      if (update || !existsSync(file)) { writeFileSync(file, png); out.push({ name: `visual baseline written: ${p} ${w}`, pass: true, details: file }); continue; }
      const [a, b] = await Promise.all([png, readFileSync(file)].map((x) => sharp(x).removeAlpha().raw().toBuffer({ resolveWithObject: true })));
      if (a.info.width !== b.info.width || a.info.height !== b.info.height) {
        writeFileSync(file.replace(/\.png$/, '.now.png'), png);
        out.push({ name: `visual: ${p} ${w} unchanged`, pass: false, details: `size ${a.info.width}x${a.info.height}, baseline ${b.info.width}x${b.info.height}` });
        continue;
      }
      let diff = 0;
      for (let i = 0; i < a.data.length; i += 3) if (Math.abs(a.data[i] - b.data[i]) > 16 || Math.abs(a.data[i + 1] - b.data[i + 1]) > 16 || Math.abs(a.data[i + 2] - b.data[i + 2]) > 16) diff++;
      const share = diff / (a.data.length / 3);
      if (share > limit) writeFileSync(file.replace(/\.png$/, '.now.png'), png);
      out.push({ name: `visual: ${p} ${w} unchanged (diff ${(share * 100).toFixed(3)} %, limit ${limit * 100} %)`, pass: share <= limit, details: share > limit ? file.replace(/\.png$/, '.now.png') : '' });
    }
  }
  return out;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (baselineMode && !['main', 'wp', 'all'].some((x) => process.argv.includes(x))) {
    // Only the baseline of gate 6: node src/qa/gates.mjs --visual-baseline
    const server = await startBoth(8795);
    const browser = await chromium.launch();
    for (const r of await visualRegression(browser, server.url, { update: true })) console.log(r.name);
    await browser.close(); await server.close();
    process.exit(0);
  }
  const which = ['main', 'wp', 'all'].find((x) => process.argv.includes(x)) || 'all';
  const results = await runGates({ which, quick: process.argv.includes('--quick') });
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} gates ok`);
  process.exit(failed.length ? 1 : 0);
}
