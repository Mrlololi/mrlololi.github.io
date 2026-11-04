// Stage 6 layout gate and demo rules in Chromium (brief section 5):
// - 390 and 1440 px, DE and EN: no a/button/input/summary/select under 44 x 44 px, no horizontal
//   overflow, no text with an effective opacity under 0.7, no mascot under 40 px (56 px for the
//   acting ones; 40 px only for Logik in the FAQ);
// - reduced motion: no autoplay, every demo in its end frame, the pause buttons step the frames;
// - no JS: every demo in its end frame (card 3 never shows «fehlgeschlagen»);
// - 320 px and 200 % text: no horizontal overflow;
// - Stage 6c: every demo runs within 3 s of coming into view, loops while visible, runs again after
//   leaving and coming back, stays paused with its button (also after a reload), one at a time;
// - Stage 6d/6e: reveals never leave a section empty (jump to the bottom, then up step by step),
//   the quote stack is spread at 60 %, the FAQ types before it answers, the marquees move, the
//   slider follows mouse, touch and keys, the run-log loads only on its button and then plays;
// - 30.10.2026: the contact form (Make hook mocked), the price chains and the problem cards: no
//   picture rests longer than about 3 s while in view; the run-log timing.
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
    // The contact form's honeypot sits off-screen on purpose (not focusable, aria-hidden).
    if (el.closest('.hp')) return false;
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
    const fading = () => { for (let e = el; e && e.nodeType === 1; e = e.parentElement) if (e.getAnimations?.().some((a) => a.playState === 'running')) return true; return false; };
    if (o < 0.7 && !fading()) out.faint.push(`${name(el)} ${o.toFixed(2)}`);
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
        // Card buttons rest while the three cards loop as one row (1100 px and up).
        hidden: [...document.querySelectorAll('.loopctl')].filter((b) => (b.hidden || b.hasAttribute('data-wait')) && !(innerWidth >= 1100 && b.classList.contains('loopctl--card')) && !b.closest('.tools__in, .aboutrow')).length,
        runs: window.__runs,
      }));
      check(`reduced motion ${p}: every demo in its end frame`, r.frames.every((f) => f === 'end' || f === 'none'), r.frames.join(','));
      check(`reduced motion ${p}: no autoplay`, r.runs === 0, String(r.runs));
      check(`reduced motion ${p}: the buttons are there (as «Nächster Schritt»)`, r.hidden === 0, String(r.hidden));
      if (p === '/') {
        // The button steps through the frames: broken, then solved again.
        const card = page.locator('.fixdemo--rate');
        const btn = page.locator('.pcs__ctl .loopctl');
        log('reduced: click');
        await btn.scrollIntoViewIfNeeded();
        await btn.click();
        const a = await card.getAttribute('data-play');
        await btn.click();
        const b = await card.getAttribute('data-play');
        const label = await btn.locator('.loopctl__text').textContent();
        check('reduced motion: the button steps start -> end («Nächster Schritt»)', a === 'start' && b === 'end' && label === 'Nächster Schritt', `${a} -> ${b}, ${label}`);
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

  log('loops');
  // 5. Stage 6c: every demo runs within 3 s of coming into view, loops, comes back, pauses.
  const DEMOS = (w) => [
    ['/', w >= 1100 ? '.pcs' : '.fixdemo--signup', w >= 1100 ? 21000 : 9000],
    ['/', '.pkgs-wrap', 12000],
    ['/', '.more', 12000],
    ['/', '.steps-wrap', 9000],
    ['/ki-antwortentwuerfe/', '.kidemo', 14000],
  ];
  for (const w of [1440, 390]) {
    for (const [path, sel, cycle] of DEMOS(w)) {
      const page = await browser.newPage({ viewport: { width: w, height: 860 } });
      await page.goto(base + path, { waitUntil: 'load' });
      await page.waitForTimeout(600);
      await page.evaluate((x) => { window.__runs = 0; window.__max = 0; document.querySelector(x).addEventListener('demo:run', () => { window.__runs += 1; }); setInterval(() => { window.__max = Math.max(window.__max, [...document.querySelectorAll('[data-demo][data-play="run"]')].filter((d) => !d.parentElement.closest('[data-demo][data-play="run"]')).length); }, 60); }, sel);
      const state = () => page.evaluate((x) => document.querySelector(x).dataset.play, sel);
      const waitRun = async (ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await state() === 'run') return (Date.now() - t0) / 1000; await page.waitForTimeout(100); } return null; };
      await page.evaluate((x) => document.querySelector(x).scrollIntoView({ block: 'center' }), sel);
      const first = await waitRun(3000);
      check(`loop ${path} ${sel} @${w}: runs within 3 s`, first != null, String(first));
      await page.waitForTimeout(cycle);
      const runs = await page.evaluate(() => window.__runs);
      check(`loop ${path} ${sel} @${w}: loops while visible`, runs >= 2, String(runs));
      await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(800);
      await page.evaluate((x) => document.querySelector(x).scrollIntoView({ block: 'center' }), sel);
      const again = await waitRun(3000);
      check(`loop ${path} ${sel} @${w}: runs again after coming back`, again != null, String(again));
      const max = await page.evaluate(() => window.__max);
      check(`loop ${path} ${sel} @${w}: one demo at a time`, max <= 1, String(max));
      // Pause: it stops on its end frame and stays paused, also after a reload (for the visit).
      const btn = await page.evaluateHandle((x) => { const d = document.querySelector(x); return d.querySelector(':scope > .loopctl') || d.querySelector('.kidemo__controls .loopctl') || d.parentElement.querySelector('.pcs__ctl .loopctl') || d.querySelector('.tariff__ctl .loopctl') || d.querySelector('.more__head .loopctl'); }, sel);
      await btn.asElement().scrollIntoViewIfNeeded();
      await btn.asElement().click();
      await page.evaluate((x) => document.querySelector(x).scrollIntoView({ block: 'center' }), sel);
      const r0 = await page.evaluate(() => window.__runs);
      await page.waitForTimeout(3500);
      const p1 = { runs: await page.evaluate(() => window.__runs), play: await state(), label: await btn.asElement().evaluate((b) => b.querySelector('.loopctl__text').textContent) };
      check(`loop ${path} ${sel} @${w}: the pause button stops it`, p1.runs === r0 && p1.play === 'end' && /Abspielen|Play/.test(p1.label), JSON.stringify(p1));
      await page.reload({ waitUntil: 'load' });
      await page.evaluate((x) => document.querySelector(x).scrollIntoView({ block: 'center' }), sel);
      const still = await waitRun(3000);
      check(`loop ${path} ${sel} @${w}: still paused after a reload`, still == null, String(still));
      await page.evaluate(() => sessionStorage.clear());
      await page.close();
    }
  }
  // The hero line and the 404 scene: they play from CSS on load, then loop; away and back runs again.
  for (const [path, sel] of [['/', '.hero__flow'], ['/diese-seite-gibt-es-nicht/', '.nf__scene']]) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(base + path, { waitUntil: 'load' });
    await page.waitForTimeout(9000);
    const runs1 = await page.evaluate((x) => document.querySelector(x).dataset.play, sel);
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(700);
    await page.evaluate(() => scrollTo(0, 0));
    let again = null;
    for (let i = 0; i < 30 && again == null; i += 1) { if (await page.evaluate((x) => document.querySelector(x).dataset.play, sel) === 'run') again = i * 0.1; await page.waitForTimeout(100); }
    check(`loop ${path} ${sel}: loops after its first play and runs again after coming back`, runs1 != null && again != null, `${runs1}, ${again}`);
    await page.close();
  }

  log('marquees, slider, run-log, faq, quotes, reveals');
  // 6. The marquees move and have their buttons.
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(base + '/', { waitUntil: 'load' });
    for (const sel of ['.tools__in']) {
      await page.evaluate((x) => document.querySelector(x).scrollIntoView({ block: 'center' }), sel);
      await page.waitForTimeout(900);
      const x1 = await page.evaluate((x) => document.querySelector(`${x} .marquee__track`).getBoundingClientRect().left, sel);
      await page.waitForTimeout(1200);
      const x2 = await page.evaluate((x) => document.querySelector(`${x} .marquee__track`).getBoundingClientRect().left, sel);
      const btn = await page.evaluate((x) => { const b = document.querySelector(`${x} > .loopctl`); const r = b.getBoundingClientRect(); return !b.hidden && !b.hasAttribute('data-wait') && r.width >= 44 && r.height >= 44; }, sel);
      check(`${sel}: the row moves and has its pause button`, x2 < x1 - 2 && btn, `${x1} -> ${x2}, button ${btn}`);
    }
    // Price pictures: each one runs during its chain (Stage 6f: the two chains one at a time).
    const seen = new Set();
    for (const chain of ['.pkgs-wrap', '.more']) {
      await page.evaluate((x) => document.querySelector(x).scrollIntoView({ block: 'center' }), chain);
      for (let i = 0; i < 50; i += 1) {
        for (const k of await page.evaluate(() => [...document.querySelectorAll('.tariff .viz, .tariff .days')].filter((v) => v.dataset.play === 'run').map((v) => v.className))) seen.add(k);
        await page.waitForTimeout(200);
      }
    }
    check('price pictures: every picture moves (checkout, list, launch, One-Pager, KI, 30 days)', seen.size >= 6, [...seen].join(' | '));
    await page.close();
  }
  // The slider: mouse, touch and keys.
  for (const touch of [false, true]) {
    const ctx = await browser.newContext({ viewport: touch ? { width: 390, height: 844 } : { width: 1440, height: 900 }, hasTouch: touch, isMobile: touch });
    const page = await ctx.newPage();
    await page.goto(base + '/', { waitUntil: 'load' });
    await page.locator('.ba').scrollIntoViewIfNeeded();
    await page.waitForSelector('.ba.is-ready');
    await page.waitForTimeout(1600);
    const b = await page.locator('.ba__stage').boundingBox();
    const y = b.y + b.height / 2;
    if (touch) {
      const id = 7;
      const ev = (type, x) => page.locator('.ba__stage').dispatchEvent(type, { pointerId: id, pointerType: 'touch', isPrimary: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: x, clientY: y, bubbles: true });
      await ev('pointerdown', b.x + b.width * 0.5);
      await ev('pointermove', b.x + b.width * 0.8);
      await ev('pointerup', b.x + b.width * 0.8);
    } else {
      await page.mouse.move(b.x + b.width * 0.5, y);
      await page.mouse.down();
      await page.mouse.move(b.x + b.width * 0.8, y, { steps: 6 });
      await page.mouse.up();
    }
    const v1 = Number(await page.locator('.ba__range').inputValue());
    check(`slider: ${touch ? 'touch' : 'mouse'} drag moves the divider`, v1 >= 75, String(v1));
    if (!touch) {
      await page.locator('.ba__range').focus();
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowLeft');
      const v2 = Number(await page.locator('.ba__range').inputValue());
      const now = await page.locator('.ba__range').getAttribute('aria-valuenow');
      check('slider: arrow keys move it, aria-valuenow follows', v2 === v1 - 2 && now === String(v2), `${v1} -> ${v2}, ${now}`);
    }
    await page.close();
    await ctx.close();
  }
  // Stage 6f: the run-log is the second tab of the video frame. Tabs by keyboard, runlog.js only on
  // the tab, auto start after about 4 s, forward only (1 s a step, 4 s hold), up to 3 rounds, then still.
  for (const w of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 } });
    const files = [];
    page.on('request', (r) => { if (/runlog\.js/.test(r.url())) files.push(r.url()); });
    await page.goto(base + '/', { waitUntil: 'load' });
    await page.evaluate(() => document.querySelector('.vtabs').scrollIntoView({ block: 'start' }));
    await page.waitForFunction(() => document.querySelector('.vtabs.is-ready'), null, { timeout: 8000 }).catch(() => {});
    check(`run-log @${w}: runlog.js does not load before its tab`, files.length === 0, files.join(' '));
    await page.focus('#vtab-1');
    await page.keyboard.press('ArrowRight');
    const k1 = await page.evaluate(() => ({ sel: document.querySelector('#vtab-2').getAttribute('aria-selected'), focus: document.activeElement.id, p1: document.querySelector('#vpanel-1').hidden, p2: document.querySelector('#vpanel-2').hidden, ti: document.querySelector('#vtab-1').tabIndex }));
    await page.keyboard.press('Home');
    const k2 = await page.evaluate(() => document.activeElement.id + ' ' + document.querySelector('#vtab-1').getAttribute('aria-selected'));
    await page.keyboard.press('End');
    check(`run-log @${w}: tabs by keyboard (arrows, Home, End), aria-selected, one panel, roving tabindex`, k1.sel === 'true' && k1.focus === 'vtab-2' && k1.p1 && !k1.p2 && k1.ti === -1 && k2 === 'vtab-1 true' && files.length === 1, JSON.stringify({ ...k1, k2, files: files.length }));
    await page.mouse.move(2, 2);
    await page.evaluate(() => document.activeElement.blur());
    const seq = await page.evaluate(async () => {
      const r = document.querySelector('.rl');
      const out = [];
      let last = null;
      const t0 = performance.now();
      while (performance.now() - t0 < (innerWidth > 1000 ? 39000 : 16000)) {
        const st = r.dataset.step;
        const lit = r.querySelectorAll('.rl__step.is-current').length;
        if (st !== last) { out.push([Number(st), Math.round(performance.now() - t0), lit]); last = st; }
        await new Promise((res) => setTimeout(res, 40));
      }
      return out;
    });
    const steps = seq.map((x) => x[0]);
    const firstRun = seq.find((x) => x[0] === 0)?.[1] ?? null;
    // Forward only: each change is +1, or a reset to -1 after the last step.
    const forward = seq.slice(1).every((x, i) => x[0] === seq[i][0] + 1 || (x[0] === -1 && seq[i][0] === 5));
    const oneLit = seq.every((x) => x[0] < 0 || x[2] === 1);
    check(`run-log @${w}: starts by itself after about 4 s, forward only, one step lit at a time`, firstRun != null && firstRun >= 4000 && firstRun <= 6500 && forward && oneLit, JSON.stringify({ firstRun, forward, oneLit, steps: steps.join(',') }));
    if (w > 1000) {
      const rounds = steps.slice(steps.indexOf(-1)).filter((x) => x === 5).length;
      const still = await page.evaluate(() => document.querySelector('.rl').dataset.step);
      check('run-log: up to three rounds, then it stays on the end frame', rounds === 3 && still === '5', `${rounds} ${still}`);
    }
    // A visitor's own name and «Anmelden»: the story runs with it; the result is announced afterwards.
    await page.fill('#rl-name', 'Mia');
    await page.click('.rl__go');
    await page.waitForTimeout(7600);
    const own = await page.evaluate(() => ({ name: [...document.querySelectorAll('.rl__name')].every((n) => n.textContent === 'Mia'), status: document.querySelector('.rl__status').textContent, step: document.querySelector('.rl').dataset.step }));
    check(`run-log @${w}: «Anmelden» runs it with the typed name, the result is announced (polite)`, own.name && own.status.length > 5 && own.step === '5', JSON.stringify(own));
    // Zurück / Weiter by hand.
    await page.click('.rl__back');
    const back = await page.evaluate(() => document.querySelector('.rl').dataset.step);
    await page.click('.rl__next');
    const next = await page.evaluate(() => document.querySelector('.rl').dataset.step);
    check(`run-log @${w}: Zurück and Weiter step by hand`, back === '4' && next === '5', `${back} ${next}`);
    // Phones: one step visible in a fixed stage, no height change over the round.
    if (w < 600) {
      const h = await page.evaluate(async () => {
        const st = document.querySelector('.rl__stage');
        const hs = new Set();
        document.querySelector('.rl__again').click();
        for (let i = 0; i < 40; i += 1) { hs.add(Math.round(st.getBoundingClientRect().height)); await new Promise((r) => setTimeout(r, 200)); }
        return { hs: [...hs], visible: [...document.querySelectorAll('.rl__step')].filter((x) => getComputedStyle(x).visibility === 'visible').length };
      });
      check('run-log @390: one step at a time in a fixed stage (no height change)', h.hs.length === 1 && h.visible === 1, JSON.stringify(h));
    }
    // The video pauses when the other tab opens (DE has the video).
    await page.close();
  }
  // Reduced motion: the run-log tab shows the end frame, nothing plays, Zurück / Weiter work.
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(base + '/', { waitUntil: 'load' });
    await page.evaluate(() => document.querySelector('.vtabs').scrollIntoView({ block: 'start' }));
    await page.click('#vtab-2');
    await page.waitForTimeout(5500);
    const r = await page.evaluate(() => document.querySelector('.rl').dataset.step);
    await page.click('.rl__back');
    const b2 = await page.evaluate(() => document.querySelector('.rl').dataset.step);
    check('run-log, reduced motion: the end frame, no autoplay, Zurück works', r === '5' && b2 === '4', `${r} ${b2}`);
    await ctx.close();
  }
  // FAQ: Logik types (three dots), then the answer.
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(base + '/', { waitUntil: 'load' });
    await page.locator('#faq').scrollIntoViewIfNeeded();
    await page.waitForSelector('.faqbox.is-chat');
    await page.locator('#faq summary').nth(3).click();
    await page.waitForTimeout(150);
    const dots = await page.evaluate(() => Boolean(document.querySelector('.faq__chat .bubble--typing .faq__dots')) && !document.querySelector('.faq__chat .bubble--iva'));
    const logik = await page.evaluate(() => document.querySelector('.faq__chat .bubble--typing .faq__logik')?.getBoundingClientRect().width || 0);
    await page.waitForTimeout(1000);
    const answer = await page.evaluate(() => document.querySelector('.faq__chat .bubble--iva')?.textContent || '');
    check('FAQ: Logik (40 px) types with three dots, then the answer', dots && logik >= 39.5 && answer.length > 20, `${dots} ${logik} ${answer.slice(0, 30)}`);
    const listFits = await page.evaluate(() => { const l = document.querySelector('.faq__list'); return l.scrollHeight <= l.clientHeight + 1 && getComputedStyle(l).overflowY !== 'auto'; });
    check('FAQ: every question visible (no inner scroll box)', listFits, String(listFits));
    await page.close();
  }
  // References: the quote stack is fully spread (no overlap) when its centre is at 60 %.
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(base + '/', { waitUntil: 'load' });
    await walk(page);
    await page.addStyleTag({ content: SHOW_ALL });
    const box = await page.evaluate(() => { const r = document.querySelector('.qcards').getBoundingClientRect(); return { top: r.top + scrollY, h: r.height }; });
    await page.evaluate((v) => scrollTo(0, v), box.top + box.h / 2 - 900 * 0.6);
    await page.waitForTimeout(1500);
    const rects = await page.evaluate(() => [...document.querySelectorAll('.qcard')].map((c) => { const r = c.getBoundingClientRect(); return [r.left, r.right]; }));
    const apart = rects.every((r, i) => i === 0 || r[0] >= rects[i - 1][1] - 12);
    check('references: the quote stack is spread and readable at 60 %', apart, JSON.stringify(rects.map((r) => r.map(Math.round))));
    await page.close();
  }
  // Reveals (Stage 6e): jump to the bottom, then up step by step: every [data-enter] is visible.
  for (const w of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width: w, height: 860 } });
    await page.goto(base + '/', { waitUntil: 'load' });
    await page.waitForTimeout(2500);
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(800);
    const H = await page.evaluate(() => document.body.scrollHeight);
    for (let yy = H; yy > 0; yy -= 700) { await page.evaluate((v) => scrollTo(0, v), yy); await page.waitForTimeout(250); }
    await page.addStyleTag({ content: SHOW_ALL });
    await page.waitForTimeout(900);
    const hidden = await page.evaluate(() => [...document.querySelectorAll('[data-enter], [data-enter="stagger"] > *')].filter((el) => {
      let o = 1;
      for (let e = el; e && e.nodeType === 1; e = e.parentElement) o *= Number(getComputedStyle(e).opacity);
      const lines = [...el.querySelectorAll('[class*="line"]')].filter((l) => l.parentElement?.style.overflow === 'clip' || getComputedStyle(l.parentElement).overflow === 'clip');
      const pushed = lines.some((l) => l.getBoundingClientRect().top - l.parentElement.getBoundingClientRect().top > 2);
      return o < 0.99 || pushed;
    }).map((el) => el.id || el.className || el.tagName));
    check(`reveals @${w}: nothing stays hidden after a jump to the bottom and back up`, hidden.length === 0, hidden.join(', '));
    await page.close();
  }
  log('contact form');
  // 7. Kontaktformular 30.10.2026 (Make hook mocked): validation, honeypot, exact payload, success,
  // error and timeout, keyboard only, 390 and 1440 px, DE and EN, reduced motion, no other requests.
  const KEYS = ['consent', 'elapsed_ms', 'email', 'lang', 'name', 'page', 'plattform', 'problem', 'start', 'termin', 'text', 'was', 'website'];
  const formPage = async ({ width = 1440, lang = '', mode = 'ok', reduced = false } = {}) => {
    const ctx = await browser.newContext({ viewport: { width, height: 860 }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
    const page = await ctx.newPage();
    const posts = [];
    const foreign = [];
    page.on('request', (r) => { const u = new URL(r.url()); if (u.origin !== new URL(base).origin && !/hook\.eu1\.make\.com/.test(u.host)) foreign.push(r.url()); });
    await page.route('https://hook.eu1.make.com/**', async (route) => {
      const req = route.request();
      if (req.method() === 'POST') posts.push({ body: JSON.parse(req.postData()), type: req.headers()['content-type'] });
      const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type' };
      if (mode === 'fail') return route.fulfill({ status: 500, body: 'error', headers });
      if (mode === 'slow') { await new Promise((r) => setTimeout(r, 11500)); return route.fulfill({ status: 200, body: 'Accepted', headers }).catch(() => {}); }
      return route.fulfill({ status: 200, body: 'Accepted', headers });
    });
    await page.goto(`${base}/${lang}`, { waitUntil: 'load' });
    await page.evaluate(() => document.getElementById('contact').scrollIntoView());
    await page.waitForFunction(() => !document.querySelector('.contact__copy').hidden, null, { timeout: 15000 });
    await page.evaluate(() => document.querySelector('.contact__form').scrollIntoView({ block: 'start' }));
    return { ctx, page, posts, foreign };
  };
  const fillForm = async (page) => {
    await page.fill('#cf-name', 'Anna Test');
    await page.fill('#cf-email', 'anna@example.com');
    await page.fill('#cf-text', 'Bitte um Rückruf');
    await page.check('#cf-consent');
  };
  for (const [width, lang] of [[1440, ''], [390, 'en/']]) {
    const tag = `contact form ${lang ? 'EN' : 'DE'} @${width}`;
    const { ctx, page, posts, foreign } = await formPage({ width, lang });
    // Empty: three messages, linked to their fields, focus on the first; nothing is sent.
    await page.click('.contact__send');
    const v = await page.evaluate(() => [...document.querySelectorAll('[aria-invalid="true"]')].map((el) => ({ id: el.id, msg: document.getElementById(el.getAttribute('aria-describedby'))?.textContent || '' })).concat({ focus: document.activeElement.className, links: document.querySelectorAll('.contact__errsum a').length }));
    check(`${tag}: empty submit marks name, e-mail, consent (aria-invalid + message), an error summary with three links takes the focus, nothing sent`, v.length === 4 && v.slice(0, 3).every((x) => x.msg.length > 5) && v[3].focus === 'contact__errsum' && v[3].links === 3 && posts.length === 0, JSON.stringify(v));
    await page.click('.contact__errsum a');
    const jumped = await page.evaluate(() => document.activeElement.id);
    check(`${tag}: a link in the summary moves the focus to its field`, jumped === 'cf-name', jumped);
    await page.fill('#cf-name', 'Anna');
    await page.fill('#cf-email', 'anna@beispiel');
    await page.check('#cf-consent');
    await page.click('.contact__send');
    const bad = await page.evaluate(() => document.querySelector('#cf-email').getAttribute('aria-invalid') === 'true' && !document.querySelector('#cf-email-err').hidden);
    check(`${tag}: an incomplete e-mail address blocks sending`, bad && posts.length === 0, String(bad));
    // The honeypot: off-screen, not in the tab order, hidden from screen readers.
    const hp = await page.evaluate(() => { const i = document.getElementById('cf-website'); const r = i.getBoundingClientRect(); return { tab: i.tabIndex, ac: i.getAttribute('autocomplete'), aria: i.getAttribute('aria-hidden'), off: r.right <= 0 || r.bottom <= 0 }; });
    check(`${tag}: honeypot off-screen, tabindex -1, autocomplete off, aria-hidden`, hp.tab === -1 && hp.ac === 'off' && hp.aria === 'true' && hp.off, JSON.stringify(hp));
    await page.fill('#cf-email', 'anna@example.com');
    await page.click('.contact__send');
    await page.waitForSelector('.contact__done:not([hidden])', { timeout: 5000 }).catch(() => {});
    const done = await page.evaluate(() => { const d = document.querySelector('.contact__done'); const m = d.querySelector('svg.mascot'); return { shown: !d.hidden, focus: document.activeElement === d, role: d.getAttribute('role'), text: d.textContent.trim(), form: document.querySelector('.contact__form').hidden, mascot: m ? m.getBoundingClientRect().width : 0 }; });
    check(`${tag}: success replaces the form with Live (at least 56 px) and the thank-you, focus on it (role=status)`, done.shown && done.focus && done.role === 'status' && done.form && done.mascot >= 55.5 && /Anna/.test(done.text), JSON.stringify(done));
    const p = posts[0]?.body || {};
    check(`${tag}: one POST, JSON, exactly the agreed fields`, posts.length === 1 && /application\/json/.test(posts[0].type) && JSON.stringify(Object.keys(p).sort()) === JSON.stringify(KEYS), JSON.stringify(Object.keys(p)));
    check(`${tag}: payload values (consent true, honeypot empty, lang, page, elapsed_ms, the sentence values)`, p.consent === true && p.website === '' && p.lang === (lang ? 'en' : 'de') && String(p.page).startsWith(base) && Number.isFinite(p.elapsed_ms) && p.elapsed_ms > 0 && p.was === (lang ? 'an online course' : 'einen Onlinekurs') && p.plattform === 'Leadpages' && p.name === 'Anna', JSON.stringify(p));
    check(`${tag}: no other third-party request`, foreign.length === 0, foreign.join(' '));
    await ctx.close();
  }
  // Keyboard only: Tab from the last select reaches name, e-mail, text, consent, then the button (never the honeypot); Enter sends.
  {
    const { ctx, page, posts } = await formPage();
    await page.focus('#brief-start');
    const order = [];
    for (let i = 0; i < 8; i += 1) { await page.keyboard.press('Tab'); order.push(await page.evaluate(() => document.activeElement.id || document.activeElement.className)); }
    check('contact form: keyboard order package, name, e-mail, time, text, consent, (privacy link), send; never the honeypot', order.slice(0, 6).join() === 'cf-paket,cf-name,cf-email,cf-termin,cf-text,cf-consent' && !order.includes('cf-website'), order.join(' > '));
    await page.focus('#cf-name');
    await page.keyboard.type('Kim Tastatur');
    await page.keyboard.press('Tab');
    await page.keyboard.type('kim@example.com');
    await page.focus('#cf-consent');
    await page.keyboard.press('Space');
    await page.focus('#cf-email');
    await page.keyboard.press('Enter');
    await page.waitForSelector('.contact__done:not([hidden])', { timeout: 5000 }).catch(() => {});
    const focused = await page.evaluate(() => document.activeElement.classList.contains('contact__done'));
    check('contact form: keyboard only, Enter sends and the panel takes the focus', posts.length === 1 && focused, `${posts.length} ${focused}`);
    await ctx.close();
  }
  // Error (HTTP 500) and timeout (10 s): the form stays filled, the message and the mail fallback appear.
  for (const mode of ['fail', 'slow']) {
    const { ctx, page } = await formPage({ width: mode === 'fail' ? 390 : 1440, mode });
    await fillForm(page);
    await page.click('.contact__send');
    const sending = await page.evaluate(() => { const b = document.querySelector('.contact__send'); return b.disabled && /gesendet/.test(b.textContent); });
    await page.waitForSelector('.contact__failed:not([hidden])', { timeout: 13000 }).catch(() => {});
    const e = await page.evaluate(() => ({
      shown: !document.querySelector('.contact__failed').hidden,
      focus: document.activeElement.classList.contains('contact__failed'),
      name: document.querySelector('#cf-name').value,
      text: document.querySelector('#cf-text').value,
      mailto: /body=/.test(document.querySelector('.brief__open').href) && getComputedStyle(document.querySelector('.brief__open')).display !== 'none',
      copy: !document.querySelector('.contact__copy').hidden && getComputedStyle(document.querySelector('.contact__copy')).display !== 'none',
      fallback: getComputedStyle(document.querySelector('.contact__fallback')).display !== 'none',
      button: !document.querySelector('.contact__send').disabled && document.querySelector('.contact__send').textContent === 'Anfrage senden',
      success: !document.querySelector('.contact__done').hidden,
    }));
    check(`contact form ${mode === 'fail' ? 'HTTP 500' : 'timeout 10 s'}: «Wird gesendet…» while sending; then the message with «E-Mail öffnen» (prefilled), «Text kopieren» and the fallback line; the form stays filled`, sending && e.shown && e.focus && e.name === 'Anna Test' && e.text === 'Bitte um Rückruf' && e.mailto && e.copy && e.fallback && e.button && !e.success, JSON.stringify({ sending, ...e }));
    await ctx.close();
  }
  // Before any error the mail fallback stays out of sight; reduced motion: the panel still comes, without animation.
  {
    const { ctx, page, posts } = await formPage({ reduced: true });
    const quiet = await page.evaluate(() => getComputedStyle(document.querySelector('.contact__alt')).display === 'none');
    check('contact form: «E-Mail öffnen» and «Öffnet sich nichts?» only in the error state', quiet, String(quiet));
    await fillForm(page);
    await page.click('.contact__send');
    await page.waitForSelector('.contact__done:not([hidden])', { timeout: 5000 }).catch(() => {});
    const anim = await page.evaluate(() => getComputedStyle(document.querySelector('.contact__done')).animationName);
    check('contact form, reduced motion: sent, the panel shows without animation', posts.length === 1 && anim === 'none', anim);
    await ctx.close();
  }
  // No JS: the form fields stay hidden, «E-Mail öffnen» is the way.
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(base + '/', { waitUntil: 'load' });
    const r = await page.evaluate(() => ({ fields: getComputedStyle(document.querySelector('.contact__fields')).display, send: getComputedStyle(document.querySelector('.contact__submit')).display, open: getComputedStyle(document.querySelector('.brief__open')).display }));
    check('contact form, no JS: the form is there (it posts natively) and «E-Mail öffnen» too', r.fields !== 'none' && r.send !== 'none' && r.open !== 'none', JSON.stringify(r));
    await ctx.close();
  }
  // Stage 6f: after each round at least 2.5 s on the end frame; every picture of a chain runs each round.
  for (const [w, sel, parts] of [[1440, '.pkgs-wrap', '.viz, .days'], [390, '.pkgs-wrap', '.viz, .days'], [1440, '.more', '.viz'], [1440, '.pcs', '.fixdemo'], [1440, '.steps-wrap', null]]) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 } });
    await page.goto(base + '/', { waitUntil: 'load' });
    await page.evaluate((x) => document.querySelector(x).scrollIntoView({ block: 'center' }), sel);
    await page.waitForTimeout(1500);
    const m = await page.evaluate(async ({ sel, parts }) => {
      const root = document.querySelector(sel);
      const els = parts ? [...root.querySelectorAll(parts)] : [];
      const runs = els.map(() => 0); const was = els.map(() => false);
      let endAt = null; const rests = []; let last = root.dataset.play;
      const t0 = performance.now();
      while (performance.now() - t0 < 20000) {
        const now = performance.now();
        const p = root.dataset.play;
        if (p !== last) { if (p === 'end') endAt = now; if (last === 'end' && endAt != null && p !== 'end') rests.push(Math.round(now - endAt)); last = p; }
        els.forEach((el, i) => { const r = el.dataset.play === 'run'; if (r && !was[i]) runs[i] += 1; was[i] = r; });
        await new Promise((r) => setTimeout(r, 40));
      }
      return { rests, runs };
    }, { sel, parts });
    check(`rest ${sel} @${w}: at least 2.5 s on the end frame after each round; every picture runs each round`, m.rests.length >= 1 && m.rests.every((x) => x >= 2400) && m.runs.every((x) => x >= 1), JSON.stringify(m));
    await page.close();
  }
  // KI card: the same height over three rounds (±2 px).
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(base + '/', { waitUntil: 'load' });
    await page.evaluate(() => document.querySelector('.more').scrollIntoView({ block: 'center' }));
    const hs = await page.evaluate(async () => {
      const v = document.querySelector('.viz--chat');
      let runs = 0; let was = false; const out = [];
      const t0 = performance.now();
      while (performance.now() - t0 < 26000 && runs < 4) {
        const r = v.dataset.play === 'run'; if (r && !was) runs += 1; was = r;
        out.push(v.getBoundingClientRect().height);
        await new Promise((res) => setTimeout(res, 60));
      }
      return { min: Math.min(...out), max: Math.max(...out), runs };
    });
    check('KI card: height constant over three rounds (±2 px)', hs.runs >= 3 && hs.max - hs.min <= 2, JSON.stringify(hs));
    await page.close();
  }
  // ?paket=check#contact: the package chosen, the form in view, the focus on the name (DE desktop, EN phone).
  for (const [w, lang] of [[1440, ''], [390, 'en/']]) {
    const page = await browser.newPage({ viewport: { width: w, height: 860 } });
    await page.goto(`${base}/${lang}?paket=check#contact`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__cfReady === true, null, { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1500);
    const r = await page.evaluate(() => { const n = document.querySelector('#cf-name').getBoundingClientRect(); return { paket: document.querySelector('#cf-paket').value, focus: document.activeElement.id, inView: n.top >= 0 && n.bottom <= innerHeight, nojs: !!document.querySelector('input[name="nojs"]') }; });
    check(`?paket=check @${w}: package preselected, name focused and in view, nojs removed`, r.paket === 'check' && r.focus === 'cf-name' && r.inView && !r.nojs, JSON.stringify(r));
    await page.close();
  }
  // The inline guard: with JS on but before contact.js, a click on «Anfrage senden» does not navigate.
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.route('**/assets/js/contact.js*', () => new Promise(() => {}));
    let navs = 0;
    page.on('framenavigated', (fr) => { if (fr === page.mainFrame()) navs += 1; });
    await page.goto(base + '/', { waitUntil: 'load' });
    await page.evaluate(() => document.getElementById('contact').scrollIntoView());
    await page.fill('#cf-name', 'A');
    await page.fill('#cf-email', 'a@example.com');
    await page.check('#cf-consent');
    await page.click('.contact__send');
    await page.waitForTimeout(1200);
    check('contact form: a click before contact.js has loaded does not navigate (no 405)', navs === 1 && page.url().startsWith(base), `${navs} ${page.url()}`);
    await page.close();
  }
  // Without JS: the form posts natively to the hook (nojs=1) and lands on /danke/.
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
    const page = await ctx.newPage();
    const posted = [];
    await page.route('https://hook.eu1.make.com/**', (route) => { posted.push(route.request().postData()); return route.fulfill({ status: 302, headers: { location: `${base}/danke/` } }); });
    await page.goto(base + '/', { waitUntil: 'load' });
    await page.fill('#cf-name', 'Ohne JS');
    await page.fill('#cf-email', 'nojs@example.com');
    await page.check('#cf-consent');
    await Promise.all([page.waitForURL('**/danke/', { timeout: 8000 }).catch(() => {}), page.click('.contact__send')]);
    const body = posted[0] || '';
    check('contact form, no JS: native post with nojs=1, lang, page, the payload names, consent=true; lands on /danke/', /nojs=1/.test(body) && /lang=de/.test(body) && /was=/.test(body) && /plattform=/.test(body) && /consent=true/.test(body) && page.url().endsWith('/danke/'), `${body.slice(0, 160)} -> ${page.url()}`);
    await ctx.close();
  }
  // The global pause: everything stops on its end frame, it is remembered, and it comes back.
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(base + '/', { waitUntil: 'load' });
    await page.evaluate(() => { try { localStorage.removeItem('motion-paused'); } catch {} });
    await page.evaluate(() => document.querySelector('.motion-toggle').scrollIntoView({ block: 'center' }));
    await page.waitForFunction(() => !document.querySelector('.motion-toggle').hidden);
    await page.click('.motion-toggle');
    await page.evaluate(() => { window.__r = 0; document.addEventListener('demo:run', () => { window.__r += 1; }, true); document.querySelector('.pkgs-wrap').scrollIntoView({ block: 'center' }); });
    await page.waitForTimeout(4000);
    const p1 = await page.evaluate(() => ({ runs: window.__r, running: document.querySelectorAll('[data-play="run"]').length, stored: localStorage.getItem('motion-paused'), label: document.querySelector('.motion-toggle').textContent }));
    await page.reload({ waitUntil: 'load' });
    await page.evaluate(() => { window.__r = 0; document.addEventListener('demo:run', () => { window.__r += 1; }, true); document.querySelector('.pkgs-wrap').scrollIntoView({ block: 'center' }); });
    await page.waitForTimeout(3500);
    const p2 = await page.evaluate(() => window.__r);
    check('global «Bewegung pausieren»: no demo runs, remembered after a reload', p1.runs === 0 && p1.running === 0 && p1.stored === '1' && /abspielen/i.test(p1.label) && p2 === 0, JSON.stringify({ ...p1, p2 }));
    await page.evaluate(() => document.querySelector('.motion-toggle').click());
    await page.evaluate(() => document.querySelector('.pkgs-wrap').scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(3500);
    const p3 = await page.evaluate(() => window.__r);
    check('global pause off again: demos run again', p3 >= 1, String(p3));
    await page.evaluate(() => { try { localStorage.removeItem('motion-paused'); } catch {} });
    await page.close();
  }
  // The timeline draws on phones too (390 px).
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(base + '/', { waitUntil: 'load' });
    await walk(page);
    await page.addStyleTag({ content: SHOW_ALL });
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.evaluate(() => document.querySelector('.path').scrollIntoView({ block: 'center' }));
    const seen = await page.evaluate(async () => {
      const p = document.querySelector('.path');
      const vals = new Set();
      for (let i = 0; i < 40; i += 1) { vals.add(getComputedStyle(p).getPropertyValue('--draw').trim()); await new Promise((r) => setTimeout(r, 80)); }
      return [...vals];
    });
    check('timeline @390: draws (values between 0 and 1 seen)', seen.some((v) => Number(v) > 0 && Number(v) < 1) && seen.includes('1.000'), seen.slice(0, 8).join(','));
    await page.close();
  }
  // Nothing shifts when the pause buttons appear (phone, first screen and while the modules load).
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(base + '/', { waitUntil: 'load' });
    await page.evaluate(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); });
    await page.waitForTimeout(5000);
    const r = await page.evaluate(() => ({ cls: window.__cls, gone: [...document.querySelectorAll('.loopctl')].filter((b) => b.hidden).length }));
    check('phone: CLS under 0.05 on the first screen, no pause button that pops in', r.cls < 0.05 && r.gone === 0, JSON.stringify(r));
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
