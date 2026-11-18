// Gate «glatt» (design system 5.1 rule 7, Iva 18.11.2026): smooth, never abrupt.
// Every animation frame the transform and opacity of every mascot part, the run-log dot and every entering
// element are sampled during: an idle loop restart, each mascot reaction, a double click within 150 ms,
// hover in and out within 100 ms, and scrolling away mid-entrance. A frame-to-frame step above 8 px
// translate, 6° rotate, 0.04 scale or 0.25 opacity fails (per frame at 60 fps). Motion paused and reduced motion are not
// exercised (their instant switch to the end frame is allowed, rule 3).
// Run by src/qa/gates.mjs (all pages of the chosen site(s), at 1280); alone:
//   node src/qa/glatt.mjs [main|wp|all] [--frames <dir>]   (--frames: a strip of frames per failing scenario)
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const GLATT_LIMITS = { translate: 8, rotate: 6, scale: 0.04, opacity: 0.25 };
// The parts of rule 7: each mascot, its [data-part] groups and the waving arm, the run-log dot, every
// entering element. Only what is inside the window counts (an element revealed above it is not seen).
export const GLATT_SELECTOR = 'svg.mascot, svg.mascot [data-part], svg.mascot .m-wave, .rl__car, .rl__dot, [data-enter], [data-enter="stagger"] > *';

// Runs in the page (addInitScript): one requestAnimationFrame loop that compares each sampled element with
// its own previous frame.
export const GLATT_PROBE = ({ sel, limits }) => {
  const prev = new Map();
  const ids = new WeakMap();
  let n = 0;
  window.__glatt = { on: false, scenario: '', fails: [], frames: 0 };
  const name = (el) => {
    if (!ids.has(el)) {
      const cls = String(el.className?.baseVal ?? el.className ?? '').split(' ')[0];
      const owner = el.closest?.('svg.mascot');
      const who = owner ? `mascot${owner.dataset.mascot}${owner === el ? '' : ' '}` : '';
      ids.set(el, `${who}${owner === el ? '' : el.tagName.toLowerCase()}${el.dataset?.part ? `[${el.dataset.part}]` : ''}${cls ? `.${cls}` : ''}#${++n}`);
    }
    return ids.get(el);
  };
  // What the visitor sees: the element's opacity times that of every ancestor (a picture that fades out
  // as a whole hides its parts too).
  const seenOpacity = (el, cs) => { let o = Number(cs.opacity); for (let p = el.parentElement; p && o > 0.001; p = p.parentElement) o *= Number(getComputedStyle(p).opacity); return o; };
  const read = (el) => {
    const cs = getComputedStyle(el);
    let m = cs.transform && cs.transform !== 'none' ? new DOMMatrixReadOnly(cs.transform) : null;
    if (!m && el.transform?.baseVal?.numberOfItems) {
      const c = el.transform.baseVal.consolidate();
      if (c) m = DOMMatrixReadOnly.fromMatrix(c.matrix);
    }
    m ??= new DOMMatrixReadOnly();
    const r = el.getBoundingClientRect();
    const inView = r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
    return { tx: m.e, ty: m.f, rot: Math.atan2(m.b, m.a) * 180 / Math.PI, sx: Math.hypot(m.a, m.b), sy: Math.hypot(m.c, m.d), op: seenOpacity(el, cs), shown: inView && cs.display !== 'none' && cs.visibility !== 'hidden' };
  };
  let list = [];
  let lastT = 0;
  const frame = (t) => {
    const g = window.__glatt;
    // Limits are per frame at 60 fps: a frame the browser dropped (dt above 1.5 frames, e.g. while the test
    // jumps the scroll position) is judged by its speed, not by the size of one long step.
    const per = lastT ? Math.max(1, (t - lastT) / (1000 / 60) / 1.5) : 1;
    lastT = t;
    if (g.on) {
      if (g.frames % 15 === 0) list = [...document.querySelectorAll(sel)];
      g.frames += 1;
      for (const el of list) {
        if (!el.isConnected) { prev.delete(el); continue; }
        const now = read(el);
        const was = prev.get(el);
        prev.set(el, now);
        if (!was || !now.shown || !was.shown) continue;
        if (now.op < 0.05 && was.op < 0.05) continue; // invisible in both frames
        const seen = Math.min(now.op, was.op) >= 0.05; // a move is only seen when the element is visible in both frames
        let rot = Math.abs(now.rot - was.rot);
        if (rot > 180) rot = 360 - rot;
        const steps = { translate: Math.hypot(now.tx - was.tx, now.ty - was.ty), rotate: rot, scale: Math.max(Math.abs(now.sx - was.sx), Math.abs(now.sy - was.sy)), opacity: Math.abs(now.op - was.op) };
        if (!seen) { steps.translate = 0; steps.rotate = 0; steps.scale = 0; }
        for (const [k, v] of Object.entries(steps)) {
          if (v / per > limits[k] && g.fails.length < 300) g.fails.push({ scenario: g.scenario, el: name(el), kind: k, step: Number(v.toFixed(3)), t: Math.round(performance.now()) });
        }
      }
    } else prev.clear();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
};

// pages: paths; frames: a folder for a strip of 12 frames (every 50 ms) of each failing scenario.
export async function glattGate(browser, base, pages, { log = () => {}, width = 1280, frames = null } = {}) {
  const out = [];
  for (const p of pages) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'no-preference' });
    await ctx.addInitScript(GLATT_PROBE, { sel: GLATT_SELECTOR, limits: GLATT_LIMITS });
    const page = await ctx.newPage();
    const scenario = (s) => page.evaluate((v) => { window.__glatt.scenario = v; window.__glatt.on = true; }, s);
    const off = () => page.evaluate(() => { window.__glatt.on = false; });
    await page.goto(base + p, { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    // 1. Idle loops restarting: stay on the first screen past a full round and its rest, then walk down.
    await scenario('idle loop restart');
    await page.waitForTimeout(8000);
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 700) { await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(900); }
    await off();
    // 2.-4. Every mascot group (at most 6 per page): a reaction, a double click within 150 ms, hover in and out.
    const groups = await page.evaluate(() => [...document.querySelectorAll('[data-poke], .mascot-btn')].slice(0, 6).map((g, i) => { g.dataset.glatt = String(i); return i; }));
    for (const i of groups) {
      const g = page.locator(`[data-glatt="${i}"]`);
      if (!(await g.isVisible().catch(() => false))) continue;
      await g.scrollIntoViewIfNeeded().catch(() => {});
      await page.waitForTimeout(400);
      const box = await g.boundingBox();
      if (!box) continue;
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      await scenario('mascot reaction');
      await page.mouse.click(cx, cy);
      await page.waitForTimeout(2600);
      await scenario('double click within 150 ms');
      await page.mouse.click(cx, cy);
      await page.waitForTimeout(120);
      await page.mouse.click(cx, cy);
      if (frames) await strip(page, frames, `${p}-dbl-${i}`, box);
      await page.waitForTimeout(2800);
      await scenario('hover in and out within 100 ms');
      await page.mouse.move(cx, cy);
      await page.waitForTimeout(80);
      await page.mouse.move(2, 2);
      await page.waitForTimeout(1200);
      await off();
    }
    // 5. Scrolling away mid-entrance (a fresh load, so nothing below the first screen has entered yet). The
    // reload starts a new probe: keep what scenarios 1 to 4 found first.
    const first = await page.evaluate(() => ({ fails: window.__glatt.fails, frames: window.__glatt.frames }));
    await page.goto(base + p, { waitUntil: 'load' });
    await page.waitForTimeout(1200);
    const targets = await page.evaluate(() => [...document.querySelectorAll('[data-enter]')].filter((el) => el.getBoundingClientRect().top > innerHeight).slice(0, 4).map((el) => Math.round(el.getBoundingClientRect().top + scrollY)));
    await scenario('scrolling away mid-entrance');
    for (const top of targets) {
      await page.evaluate((v) => scrollTo(0, v - innerHeight * 0.7), top);
      await page.waitForTimeout(150);
      await page.evaluate(() => scrollTo(0, 0));
      await page.waitForTimeout(700);
    }
    await off();
    const last = await page.evaluate(() => window.__glatt);
    const r = { fails: [...first.fails, ...last.fails], frames: first.frames + last.frames };
    const by = new Map();
    for (const f of r.fails) {
      const k = `${f.scenario}: ${f.el.replace(/#\d+$/, '')} ${f.kind}`;
      if (!by.has(k) || by.get(k).step < f.step) by.set(k, { ...f, key: k });
    }
    const lines = [...by.values()].map((f) => `${f.key} ${f.step}`);
    out.push({ name: `glatt ${p} ${width}: no frame-to-frame jump (${r.frames} frames)`, pass: lines.length === 0, details: lines.slice(0, 14).join(' | '), fails: r.fails, kinds: lines });
    log(`${lines.length ? 'FAIL' : 'ok  '} glatt ${p}: ${lines.length ? lines.join(' | ') : `${r.frames} frames`}`);
    await ctx.close();
  }
  return out;
}

// A strip of 12 frames, every 50 ms, of the area around a mascot group (for the before/after report).
async function strip(page, dir, tag, box) {
  mkdirSync(dir, { recursive: true });
  const clip = { x: Math.max(0, box.x - 40), y: Math.max(0, box.y - 60), width: Math.min(box.width + 80, 1200), height: Math.min(box.height + 100, 800) };
  for (let k = 0; k < 12; k++) {
    await page.screenshot({ path: path.join(dir, `${tag.replace(/\W+/g, '_')}-${String(k).padStart(2, '0')}.png`), clip, animations: 'allow' });
    await page.waitForTimeout(50);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { chromium } = await import('./browsers.mjs');
  const { startBoth } = await import('./serve-both.mjs');
  // The page lists of gates.mjs, read as text (gates.mjs imports this file, so no import back).
  const src = (await import('node:fs')).readFileSync(new URL('./gates.mjs', import.meta.url), 'utf8');
  const list_ = (name) => JSON.parse(src.slice(src.indexOf(`export const ${name} = `)).match(/^[^=]*= (\[[^\]]*\]);/)[1].replace(/'/g, '"'));
  const MAIN_PAGES = list_('MAIN_PAGES');
  const WP_PAGES = list_('WP_PAGES');
  const w = ['main', 'wp', 'all'].find((x) => process.argv.includes(x)) || 'all';
  const fi = process.argv.indexOf('--frames');
  const frames = fi > 0 ? path.resolve(process.argv[fi + 1]) : null;
  const pi = process.argv.indexOf('--pages');
  const list = pi > 0 ? process.argv[pi + 1].split(',') : w === 'main' ? MAIN_PAGES : w === 'wp' ? WP_PAGES : [...MAIN_PAGES, ...WP_PAGES];
  const server = await startBoth(8797);
  const browser = await chromium.launch();
  const res = await glattGate(browser, server.url, list, { log: console.log, frames });
  await browser.close();
  await server.close();
  console.log(`\n${res.filter((r) => r.pass).length}/${res.length} pages glatt`);
  process.exit(res.every((r) => r.pass) ? 0 : 1);
}
