// Stage 6 layout gate and demo rules in Chromium (brief section 5):
// - 390 and 1440 px, DE and EN: no a/button/input/summary/select under 44 x 44 px, no horizontal
//   overflow, no text with an effective opacity under 0.7, no mascot under 40 px (56 px for the
//   acting ones; 40 px only for Logik in the FAQ);
// - reduced motion: no autoplay, every demo in its end frame, the replay buttons there;
// - no JS: every demo in its end frame (card 3 never shows «fehlgeschlagen»);
// - 320 px and 200 % text: no horizontal overflow;
// - autoplay: at most two automatic plays per demo, one demo at a time.
// Usage: node src/qa/stage6.mjs (exit code 1 on failure). Also run by tests/stage6-browser.test.mjs.
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { chromium } from './browsers.mjs';
import { startServer } from './serve.mjs';

const PAGES = ['/', '/en/', '/ki-antwortentwuerfe/', '/en/ai-reply-drafts/', '/launch-technik/', '/diese-seite-gibt-es-nicht/'];
const SHOW_ALL = '#references,#projects,#about,#faq{content-visibility:visible!important}';

async function walk(page) {
  const h = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h + 900; y += 450) { await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(50); }
}

// Runs in the page: everything the gate measures.
function measure() {
  const out = { small: [], overflow: 0, faint: [], mascots: [], contrast: [], clipped: [] };
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return false;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') return false;
    if (el.closest('.sr-only, [hidden], template, [aria-hidden="true"] .sr-only')) return false;
    // The skip link waits above the window until it gets focus.
    if (el.classList.contains('skip')) return false;
    return true;
  };
  const name = (el) => `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? `.${el.className.trim().split(/\s+/).join('.')}` : ''} «${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30)}»`;
  for (const el of document.querySelectorAll('a, button, input, summary, select, textarea')) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 43.5 || r.height < 43.5) out.small.push(`${name(el)} ${Math.round(r.width)}x${Math.round(r.height)}`);
  }
  out.overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
  const opacity = (el) => { let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) o *= Number(getComputedStyle(e).opacity); return o; };
  const walker = document.createTreeWalker(document.querySelector('main') || document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const el = n.parentElement;
    if (!n.textContent.trim() || seen.has(el) || !visible(el)) continue;
    seen.add(el);
    const o = opacity(el);
    if (o < 0.7) out.faint.push(`${name(el)} ${o.toFixed(2)}`);
  }
  // The drawn size without transforms (a start frame may scale a mascot down on purpose).
  for (const m of document.querySelectorAll('svg.mascot')) {
    if (!m.getBoundingClientRect().width || getComputedStyle(m).visibility === 'hidden') continue;
    const host = m.ownerSVGElement;
    const r = { width: host ? m.width.baseVal.value * (host.clientWidth / host.viewBox.baseVal.width) : parseFloat(getComputedStyle(m).width) };
    const min = m.classList.contains('faq__logik') ? 40 : 56;
    if (r.width < min - 0.5) out.mascots.push(`${m.getAttribute('class')} ${r.width.toFixed(1)} < ${min}`);
  }
  // Stage 6b: small labels and quiet lines on pastel reach 4.5:1 (against the worst colour behind them).
  const rgb = (c) => (c.match(/[\d.]+/g) || []).map(Number);
  const lum = ([r, g, b]) => [r, g, b].map((v) => v / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const backs = (el) => {
    // Layers from the element up: solid colours blend, a gradient gives each of its colours.
    const layers = [];
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      const grad = cs.backgroundImage.includes('gradient') ? (cs.backgroundImage.match(/rgba?\([^)]+\)/g) || []).map(rgb) : null;
      const c = rgb(cs.backgroundColor);
      if (grad && grad.length) { layers.push({ grad }); break; }
      if ((c[3] ?? 1) > 0) { layers.push({ c }); if ((c[3] ?? 1) >= 1) break; }
    }
    let bases = [[255, 255, 255]];
    for (const l of layers.reverse()) {
      if (l.grad) bases = l.grad.map((g) => g.slice(0, 3));
      else { const a = l.c[3] ?? 1; bases = bases.map((b) => b.map((v, i) => l.c[i] * a + v * (1 - a))); }
    }
    return bases;
  };
  for (const el of document.querySelectorAll('.label, .small, .hero__micro, .refs__note, .fd-was, .vid__scene, .vid__time, .ref__honest, .ref__line, .notdo-line, .path__story, .proj__shows, .row__line')) {
    if (!visible(el) || !el.textContent.trim()) continue;
    const fg = rgb(getComputedStyle(el).color);
    const worst = Math.min(...backs(el).map((b) => ratio(fg.slice(0, 3), b)));
    if (worst < 4.5) out.contrast.push(`${name(el)} ${worst.toFixed(2)}`);
  }
  for (const b of document.querySelectorAll('.kisteps__btn, .chip, .btn')) {
    if (visible(b) && b.scrollWidth > b.clientWidth + 1) out.clipped.push(`${name(b)} ${b.scrollWidth}>${b.clientWidth}`);
  }
  return out;
}

export async function checkStage6(browser, base) {
  const results = [];
  const check = (name, pass, details = '') => { results.push({ name, pass: Boolean(pass), details }); if (process.env.S6_VERBOSE) console.log(pass ? 'ok  ' : 'FAIL', name, pass ? '' : details); };

  // 1. Layout gate with JS, after every section has loaded and the demos have settled.
  const log = (...a) => { if (process.env.S6_VERBOSE) console.log('..', ...a); };
  for (const width of process.env.S6_SKIP_LAYOUT ? [] : [390, 1440]) {
    for (const p of PAGES) {
      if (process.env.S6_VERBOSE) console.log('..', p, width);
      const page = await browser.newPage({ viewport: { width, height: 860 } });
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(base + p, { waitUntil: 'load' });
      await walk(page);
      await page.addStyleTag({ content: SHOW_ALL });
      await page.waitForTimeout(5200);
      const m = await page.evaluate(measure);
      const tag = `${p} @${width}`;
      check(`${tag}: targets at least 44 x 44 px`, !m.small.length, m.small.join('; '));
      check(`${tag}: no horizontal overflow`, m.overflow <= 0, `${m.overflow}px`);
      check(`${tag}: no text under opacity 0.7`, !m.faint.length, m.faint.join('; '));
      check(`${tag}: no mascot under its minimum`, !m.mascots.length, m.mascots.join('; '));
      check(`${tag}: small labels and quiet lines at least 4.5:1`, !m.contrast.length, m.contrast.join('; '));
      check(`${tag}: no button or chip text clipped`, !m.clipped.length, m.clipped.join('; '));
      check(`${tag}: no script errors`, !errors.length, errors.join('; '));
      await page.close();
    }
  }

  // 2. Reduced motion: end frames, no autoplay, the replay buttons are there.
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    for (const p of ['/', '/ki-antwortentwuerfe/', '/diese-seite-gibt-es-nicht/']) {
      const page = await ctx.newPage();
      log('reduced', p);
      await page.goto(base + p, { waitUntil: 'load' });
      await page.evaluate(() => { window.__runs = 0; document.addEventListener('demo:run', () => { window.__runs += 1; }, true); });
      await walk(page);
      await page.waitForTimeout(1500);
      const r = await page.evaluate(() => ({
        frames: [...document.querySelectorAll('[data-demo]')].map((d) => d.dataset.play || 'none'),
        hidden: [...document.querySelectorAll('[data-demo] .replay')].filter((b) => b.hidden).length,
        runs: window.__runs,
      }));
      check(`reduced motion ${p}: every demo in its end frame`, r.frames.every((f) => f === 'end' || f === 'none'), r.frames.join(','));
      check(`reduced motion ${p}: no autoplay`, r.runs === 0, String(r.runs));
      check(`reduced motion ${p}: replay buttons shown`, r.hidden === 0, String(r.hidden));
      if (p === '/') {
        // The button steps through the frames: broken, then solved again.
        const card = page.locator('.fixdemo--rate');
        log('reduced: click');
        await card.scrollIntoViewIfNeeded();
        await card.locator('.replay').click();
        const a = await card.getAttribute('data-play');
        await card.locator('.replay').click();
        const b = await card.getAttribute('data-play');
        check('reduced motion: the replay button steps start -> end', a === 'start' && b === 'end', `${a} -> ${b}`);
      }
      await page.close();
    }
    await ctx.close();
  }

  log('no js');
  // 3. No JS: the HTML is the end frame.
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(base + '/', { waitUntil: 'load' });
    // (no addStyleTag here: it waits for a load event that never comes without JS)
    const r = await page.evaluate(() => ({
      attrs: document.querySelectorAll('[data-play]').length,
      card3: document.querySelector('.fixdemo--rate .fixdemo__art').innerText,
      checks: [...document.querySelectorAll('.hf__check')].map((c) => getComputedStyle(c).opacity),
      count: document.querySelector('.sig__n').textContent,
    }));
    check('no JS: no demo state set', r.attrs === 0, String(r.attrs));
    check('no JS: card 3 solved (quiet «Rate 2 fehlgeschlagen», then «Rate 2 bezahlt»; no red «Kartenzahlung fehlgeschlagen»)', /Rate 2 fehlgeschlagen[\s\S]*Rate 2 bezahlt/.test(r.card3) && !/Kartenzahlung/.test(r.card3), r.card3);
    check('no JS: hero line lit', r.checks.every((o) => o === '1'), r.checks.join(','));
    check('no JS: 47/47', r.count === '47', r.count);
    await page.close();
    await ctx.close();
  }

  log('reflow');
  // 4. Reflow: 320 px and 200 % text.
  for (const [w, zoom] of [[320, false], [1280, true]]) {
    for (const p of ['/', '/en/', '/ki-antwortentwuerfe/']) {
      const page = await browser.newPage({ viewport: { width: w, height: 800 } });
      await page.goto(base + p, { waitUntil: 'load' });
      if (zoom) await page.addStyleTag({ content: 'html{font-size:200%!important}' });
      await walk(page);
      await page.addStyleTag({ content: SHOW_ALL });
      await page.waitForTimeout(300);
      const o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check(`${p} ${zoom ? '200 % text' : '320 px'}: no horizontal overflow`, o <= 0, `${o}px`);
      await page.close();
    }
  }

  log('autoplay');
  // 5. Autoplay: at most two automatic plays per demo, one demo at a time.
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(base + '/', { waitUntil: 'load' });
    await page.evaluate(() => {
      window.__runs = {};
      window.__maxRunning = 0;
      document.addEventListener('demo:run', (e) => { const k = e.target.dataset.demo; window.__runs[k] = (window.__runs[k] || 0) + 1; }, true);
      setInterval(() => { window.__maxRunning = Math.max(window.__maxRunning, document.querySelectorAll('[data-play="run"]:not(:has([data-play="run"]))').length); }, 50);
    });
    for (let i = 0; i < 4; i += 1) {
      await page.evaluate(() => document.querySelector('.pcs').scrollIntoView({ block: 'center' }));
      await page.waitForTimeout(6000);
      await page.evaluate(() => scrollTo(0, document.querySelector('#about').offsetTop));
      await page.waitForTimeout(600);
    }
    const r = await page.evaluate(() => ({ runs: window.__runs, max: window.__maxRunning }));
    const card = r.runs.problems || 0;
    check('autoplay: the problem chain plays, at most twice in four visits', card >= 1 && card <= 2, JSON.stringify(r.runs));
    check('autoplay: one demo at a time', r.max <= 1, String(r.max));
    // The start frame is set only off-screen: on entry the card is never «solved» first.
    await page.evaluate(() => scrollTo(0, 0));
    await page.close();
  }
  // 6. Three cards in view: they play one after the other and all end solved.
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(base + '/', { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    await page.evaluate(() => document.querySelector('.pcs').scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(16500);
    const frames = await page.evaluate(() => [...document.querySelectorAll('.fixdemo')].map((f) => f.dataset.play));
    check('problem cards: all three play in turn and end solved', frames.every((f) => f === 'end'), frames.join(','));
    const pairs = await page.evaluate(() => [...document.querySelectorAll('.fixdemo')].map((f) => {
      const was = f.querySelector('.fd-was');
      return was && getComputedStyle(was).visibility === 'visible' && getComputedStyle(was).opacity === '1';
    }));
    check('problem cards: the end frame keeps the quiet «before» next to the «after»', pairs.every(Boolean), pairs.join(','));
    const text = await page.evaluate(() => document.querySelector('.fixdemo--rate .fixdemo__art').innerText);
    check('problem card 3 ends «Rate 2 fehlgeschlagen» -> «Rate 2 bezahlt»', /Rate 2 fehlgeschlagen[\s\S]*Rate 2 bezahlt/.test(text), text);
    await page.close();
  }
  return results;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const server = await startServer({ root });
  const browser = await chromium.launch();
  const results = await checkStage6(browser, server.url);
  await browser.close();
  await server.close();
  for (const r of results) console.log(`${r.pass ? 'ok  ' : 'FAIL'} ${r.name}${r.pass ? '' : `: ${r.details}`}`);
  const failed = results.filter((r) => !r.pass).length;
  console.log(`${results.length - failed}/${results.length} passed`);
  process.exitCode = failed ? 1 : 0;
}
