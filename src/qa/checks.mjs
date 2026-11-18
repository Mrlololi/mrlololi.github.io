// QA checks from brief section 8. Each returns { name, pass, details }.
import { mkdir, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { AxeBuilder } from '@axe-core/playwright';
import { repoRoot, projectRoot, qaDir } from './browsers.mjs';
import { PAGES } from './overflow.mjs';

const ok = (name, pass, details = '') => ({ name, pass: Boolean(pass), details });
const settle = async (page, p) => { if (p === '/' || p === '/en/') await page.waitForTimeout(3500); };

/* 1. Screenshots of every page at 375, 768, 1280, 1440 (full page). */
export async function screenshots(browser, base) {
  const out = path.join(qaDir, 'shots', 'pages');
  await mkdir(out, { recursive: true });
  let n = 0;
  for (const width of [375, 768, 1280, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: width < 800 ? 812 : 900 } });
    for (const p of PAGES) {
      await page.goto(base + p, { waitUntil: 'load' });
      await settle(page, p);
      // Scroll through once so lazy images load, then back to the top.
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)); }
        scrollTo(0, 0);
      });
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(out, `${p.replace(/\W+/g, '_')}-${width}.png`), fullPage: true });
      n++;
    }
    await page.close();
  }
  return [ok(`screenshots: ${n} full-page shots in qa/shots/pages`, true)];
}

/* 4. Network: every request on every page goes to the same origin. */
export async function network(browser, base) {
  const origin = new URL(base).origin;
  const foreign = [];
  const failed = [];
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('request', (r) => {
    const u = r.url();
    if (!u.startsWith('data:') && new URL(u).origin !== origin) foreign.push(u);
  });
  page.on('response', (r) => { if (r.status() >= 400 && !r.url().endsWith('/404.html')) failed.push(`${r.status()} ${r.url()}`); });
  for (const p of PAGES) {
    await page.goto(base + p, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
    });
    await page.waitForLoadState('networkidle');
  }
  await page.close();
  const blocked = ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net', 'unpkg.com'];
  return [
    ok(`network: only same-origin requests on all ${PAGES.length} pages`, foreign.length === 0, foreign.join(', ')),
    ok('network: no Google Fonts / CDN hosts', !foreign.some((u) => blocked.some((b) => u.includes(b)))),
    ok('network: no failed requests (404 page itself excluded)', failed.length === 0, failed.join(', ')),
  ];
}

/* 5. axe-core: zero serious or critical issues per page.
   Stage 7b (design system 7.2 rule 1): also on the open states (one FAQ item open, the run-log tab open
   on step 1 and on its end frame, the phone menu open at 390 px, every demo on its end frame with
   motion paused), and an axe «incomplete» contrast node fails unless a pixel probe clears it: the
   element is drawn once with its text made transparent, and the worst background pixel behind it
   against the text colour must reach axe's expected ratio. */
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
const hex2 = (n) => n.toString(16).padStart(2, '0');
const lumOf = (r, g, b) => {
  const c = [r, g, b].map((x) => { const s = x / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrastOf = (a, b) => { const [x, y] = [lumOf(...a), lumOf(...b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// The worst ratio between the element's text colour and the pixels behind its text box.
export async function pixelProbe(page, selector) {
  // No auto-waiting: the node is found and changed in the page, the picture is a clip of the viewport.
  // The probed area is the text itself: the line boxes of its text (a Range), for an SVG <text> its
  // box, for a form control its content box (no border, no padding, so no select arrow). While the
  // picture is taken, every glyph of the node and its children is made transparent (HTML and SVG).
  const info = await page.evaluate((sel) => {
    const node = document.querySelector(sel);
    if (!node) return null;
    node.scrollIntoView({ block: 'center' });
    const cs = getComputedStyle(node);
    const svgText = node instanceof SVGElement;
    // The text colour as sRGB, whatever form the browser computes (rgb(), color(srgb ...), color-mix).
    const paint = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    paint.fillStyle = svgText ? cs.fill : cs.color;
    paint.fillRect(0, 0, 1, 1);
    const px = paint.getImageData(0, 0, 1, 1).data;
    const m = [null, px[0], px[1], px[2], px[3] / 255];
    // A transparent label over a drawing (the hero flow buttons): the visible words are the drawing's.
    const clear = Number(m[4]) === 0;
    // Text inside something that moves right now (a playing demo, the tool marquee) is probed on the
    // paused end frame instead (the same page is checked with motion paused, see accessibility()).
    const moving = Boolean(node.closest('[data-play="run"]')) || document.getAnimations().some((a) => a.playState === 'running' && a.effect?.target && (a.effect.target === node || a.effect.target.contains?.(node)) && a.effect.getComputedTiming?.().iterations === Infinity);
    // From here on: every glyph of the page transparent (an italic neighbour can reach into the box),
    // text decorations too, form text too, and everything that moves frozen where it is (the boxes
    // are measured and the picture is taken in the same frozen frame). Borders, drawn lines and
    // pictures stay: they are the background.
    const style = document.createElement('style');
    style.id = 'probe-style';
    style.textContent = '*, *::before, *::after { -webkit-text-fill-color: transparent !important; text-decoration-color: transparent !important; text-shadow: none !important; caret-color: transparent !important; animation-play-state: paused !important; transition: none !important; pointer-events: auto !important; } select, input, textarea, option { color: transparent !important; } text, tspan, textPath { fill: transparent !important; stroke: transparent !important; }';
    document.head.append(style);
    window.__probePaused = document.getAnimations().filter((a) => a.playState === 'running');
    window.__probePaused.forEach((a) => a.pause());
    let rects;
    if (svgText) {
      // The boxes of the glyphs themselves (the box of an SVG label can reach over its frame).
      rects = [];
      const ctm = node.getScreenCTM();
      for (let i = 0; i < node.getNumberOfChars(); i++) {
        const e = node.getExtentOfChar(i);
        const a = new DOMPoint(e.x, e.y).matrixTransform(ctm), b = new DOMPoint(e.x + e.width, e.y + e.height).matrixTransform(ctm);
        // The em box is taller than the letters: the middle of it (where the strokes are) is probed.
        const w = b.x - a.x, h = b.y - a.y;
        if (w >= 1 && h >= 1) rects.push(new DOMRect(a.x + w * 0.1, a.y + h * 0.2, w * 0.8, h * 0.6));
      }
    }
    else if (/^(SELECT|INPUT|TEXTAREA)$/.test(node.tagName)) {
      const r = node.getBoundingClientRect();
      const n = (p) => parseFloat(cs[p]) || 0;
      // The width of the words it shows (a select draws its arrow inside the content box).
      const words = node.tagName === 'SELECT' ? node.selectedOptions[0]?.textContent || '' : node.value || node.placeholder || '';
      const ctx = document.createElement('canvas').getContext('2d');
      ctx.font = cs.font;
      const left = r.left + n('borderLeftWidth') + n('paddingLeft');
      const inner = r.width - n('borderLeftWidth') - n('borderRightWidth') - n('paddingLeft') - n('paddingRight');
      // One text line in the middle (the rounded border reaches into the corners of the content box).
      const line = Math.min(r.height - n('borderTopWidth') - n('borderBottomWidth'), parseFloat(cs.fontSize) * 1.25);
      rects = [new DOMRect(left, r.top + (r.height - line) / 2, Math.min(inner - (node.tagName === 'SELECT' ? 24 : 0), ctx.measureText(words).width), line)];
    } else {
      // Text nodes only (an image or an icon inside the node is not the background of its text).
      rects = [];
      const walk = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
      for (let t = walk.nextNode(); t; t = walk.nextNode()) {
        if (!t.textContent.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(t);
        rects.push(...[...range.getClientRects()].filter((r) => r.width >= 1 && r.height >= 1));
      }
    }
    // Text that another layer covers (an open phone menu) is not on screen: nothing to read there.
    // A box counts only if its centre and its four corners show the node (a slider handle or another
    // layer over part of a label is in front of the text, not behind it).
    // Layers above the node that draw nothing (a transparent button over a drawn label) do not count.
    const paints = (el) => {
      const s = getComputedStyle(el);
      if (s.visibility !== 'visible' || Number(s.opacity) === 0) return false;
      if (/^(IMG|VIDEO|CANVAS|PICTURE)$/.test(el.tagName) || s.backgroundImage !== 'none') return true;
      if (!/rgba\(.*,\s*0\)$|transparent/.test(s.backgroundColor)) return true;
      if (el instanceof SVGGraphicsElement && !(el instanceof SVGSVGElement) && !(el instanceof SVGGElement)) return s.fill !== 'none' || s.stroke !== 'none';
      return false;
    };
    const mine = (x, y) => {
      for (const el of document.elementsFromPoint(Math.min(innerWidth - 1, Math.max(0, x)), Math.min(innerHeight - 1, Math.max(0, y)))) {
        if (el === node || node.contains(el) || el.contains(node)) return true;
        if (paints(el)) return false;
      }
      return false;
    };
    const visible = rects.filter((r) => [[0.5, 0.5], [0.1, 0.15], [0.9, 0.15], [0.1, 0.85], [0.9, 0.85]].every(([fx, fy]) => mine(r.left + r.width * fx, r.top + r.height * fy)));
    const covered = rects.length > 0 && visible.length === 0;
    rects = visible;
    const boxes = rects.map((r) => {
      const x = Math.max(0, r.left), y = Math.max(0, r.top);
      return { x, y, w: Math.min(r.right, innerWidth) - x, h: Math.min(r.bottom, innerHeight) - y };
    }).filter((b) => b.w >= 1 && b.h >= 1);
    return { fg: m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null, boxes, covered, clear, moving, empty: (rects.length === 0 && !covered) || boxes.length === 0, hidden: cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0 };
  }, selector).catch((e) => { if (process.env.AXE_TRACE) console.log('probe error', selector, e.message.slice(0, 200)); return null; });
  // Gone since axe ran (a section script replaced the node, e.g. the «Mein Weg» labels become buttons):
  // the new node is checked in the next state of the same page.
  if (!info) return { selector, ratio: null, gone: true };
  let worst = null;
  try {
    if (info.fg && !info.hidden && !info.moving && info.boxes.length) {
      await page.waitForTimeout(60);
      // One picture of the window, the boxes are read out of it.
      const sharp = (await import('sharp')).default;
      const png = await page.screenshot({ timeout: 15000 });
      const { data, info: raw } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      const k = raw.width / (await page.evaluate(() => innerWidth));
      for (const b of info.boxes) {
        const x0 = Math.floor(b.x * k), y0 = Math.floor(b.y * k), x1 = Math.min(raw.width, Math.ceil((b.x + b.w) * k)), y1 = Math.min(raw.height, Math.ceil((b.y + b.h) * k));
        for (let y = y0; y < y1; y++) {
          for (let x = x0; x < x1; x++) {
            const i = (y * raw.width + x) * raw.channels;
            const r = contrastOf(info.fg, [data[i], data[i + 1], data[i + 2]]);
            if (worst === null || r < worst) worst = r;
          }
        }
      }
    }
  } finally {
    await page.evaluate(() => { document.getElementById('probe-style')?.remove(); (window.__probePaused || []).forEach((a) => a.play()); window.__probePaused = []; }).catch(() => {});
  }
  return { selector, ratio: worst, fg: info.fg ? `#${info.fg.map(hex2).join('')}` : null, hidden: info.hidden, covered: info.covered, clear: info.clear, moving: info.moving, empty: info.empty };
}

// Known accessibility exceptions (none since 18.11.2026: the 404 caption «repariert» is ink now, Iva).
export const KNOWN_A11Y = [];

async function axeRun(page, label, results, probes) {
  if (process.env.AXE_TRACE) console.log(`axe: ${label}`);
  const r = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  // Known exceptions, each with Iva's decision and the stage that fixes it (printed on every run).
  for (const v of r.violations) {
    const known = v.nodes.filter((n) => KNOWN_A11Y.some((k) => k.rule === v.id && String(n.target).includes(k.target)));
    if (known.length) {
      v.nodes = v.nodes.filter((n) => !known.includes(n));
      probes.push(`${label}: known exception ${v.id} ${known.map((n) => n.target).join(', ')} (${KNOWN_A11Y.find((k) => k.rule === v.id).note})`);
    }
  }
  r.violations = r.violations.filter((v) => v.nodes.length);
  const bad = r.violations.filter((v) => ['serious', 'critical'].includes(v.impact));
  const other = r.violations.filter((v) => !['serious', 'critical'].includes(v.impact));
  results.push(ok(`axe ${label}: 0 serious/critical`, bad.length === 0,
    [...bad, ...other].map((v) => `${v.impact} ${v.id} (${v.nodes.length}): ${v.nodes[0]?.target}`).join(' | ')));
  // Incomplete contrast nodes: each must be cleared by the pixel probe.
  const nodes = r.incomplete.filter((v) => v.id === 'color-contrast').flatMap((v) => v.nodes);
  const open = [];
  for (const n of nodes) {
    const sel = Array.isArray(n.target) ? n.target.flat().join(' ') : String(n.target);
    const need = Number(n.any?.[0]?.data?.expectedContrastRatio?.replace?.(':1', '')) || 4.5;
    const pr = await pixelProbe(page, sel);
    const why = pr.gone ? 'replaced by its script since axe ran (checked in the next state)' : pr.moving ? 'moving now (checked on the paused end frame)' : pr.covered ? 'covered by another layer' : pr.hidden ? 'hidden' : pr.clear ? 'transparent label over a drawing' : pr.empty ? 'no visible text on screen' : null;
    probes.push(`${label} ${sel}: ${why || `worst ${pr.ratio ? pr.ratio.toFixed(2) : '?'}`} (need ${need})`);
    if (!why && !(pr.ratio >= need)) open.push(`${sel} ${pr.ratio ? pr.ratio.toFixed(2) : '?'} < ${need}`);
  }
  results.push(ok(`axe ${label}: 0 unresolved incomplete contrast nodes (${nodes.length} probed)`, open.length === 0, open.join(' | ')));
}

export async function accessibility(browser, base) {
  const results = [];
  const probes = [];
  for (const width of [390, 1280]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } }); // axe needs its own context
    const page = await ctx.newPage();
    for (const p of PAGES) {
      await page.goto(base + p, { waitUntil: 'load' });
      await settle(page, p);
      await axeRun(page, `${p} @${width}`, results, probes);
      // One FAQ item open (home and service pages).
      const faq = page.locator('details.faq__item, details.svc-faq__item, main details').first();
      if (await faq.count()) {
        await faq.evaluate((d) => { d.open = true; d.scrollIntoView({ block: 'center' }); });
        await page.waitForTimeout(1200);
        await axeRun(page, `${p} @${width} FAQ open`, results, probes);
      }
      // The run-log tab on step 1, then on its end frame (home only).
      if (await page.locator('#vtab-2').count()) {
        await page.locator('#vtab-2').click();
        await page.waitForTimeout(800);
        await axeRun(page, `${p} @${width} run-log step 1`, results, probes);
      }
      // The phone menu open.
      if (width === 390 && await page.locator('.site-nav__toggle:not([hidden])').count()) {
        await page.evaluate(() => scrollTo(0, 0));
        await page.locator('.site-nav__toggle').click();
        await page.waitForTimeout(400);
        await axeRun(page, `${p} @${width} menu open`, results, probes);
        await page.keyboard.press('Escape');
      }
    }
    await ctx.close();
    // Every demo (and the run-log) on its end frame: motion paused before the first script runs.
    const still = await browser.newContext({ viewport: { width, height: 900 } });
    await still.addInitScript(() => { try { localStorage.setItem('motion-paused', '1'); } catch { /* none */ } });
    const sp = await still.newPage();
    for (const p of PAGES) {
      await sp.goto(base + p, { waitUntil: 'load' });
      await settle(sp, p);
      await sp.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } scrollTo(0, 0); });
      await sp.waitForTimeout(500);
      if (await sp.locator('#vtab-2').count()) { await sp.locator('#vtab-2').click(); await sp.waitForTimeout(800); }
      await axeRun(sp, `${p} @${width} paused, end frames${await sp.locator('#vtab-2').count() ? ' + run-log end' : ''}`, results, probes);
    }
    await still.close();
  }
  // The hero eyebrow is always probed and logged (brief 7b item 1d).
  const ctx = await browser.newContext({ viewport: { width: 390, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${base}/`, { waitUntil: 'load' });
  const eyebrow = await pixelProbe(page, '.hero__eyebrow');
  await ctx.close();
  results.push(ok(`pixel probe hero eyebrow: worst ${eyebrow.ratio?.toFixed(2)} (text ${eyebrow.fg}), need 4.5`, eyebrow.ratio >= 4.5, probes.join('\n')));
  return results;
}

/* 7. Links: internal links and anchors resolve; external links answer 2xx/3xx. */
export async function links(browser, base) {
  const page = await browser.newPage();
  const internal = new Map();
  const external = new Set();
  for (const p of PAGES) {
    await page.goto(base + p, { waitUntil: 'load' });
    const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')));
    for (const h of hrefs) {
      if (/^(mailto|tel):/.test(h)) continue; // tel: only in the Impressum (Legal 29.10.2026)
      if (/^https?:/.test(h)) external.add(h); // absolute links (portfolio included) are checked live
      else internal.set(new URL(h, base + p).href, p);
    }
  }
  const broken = [];
  for (const [url, from] of internal) {
    const u = new URL(url);
    const res = await fetch(u.origin + u.pathname);
    if (res.status !== 200) { broken.push(`${from} -> ${u.pathname} (${res.status})`); continue; }
    if (u.hash) {
      await page.goto(u.origin + u.pathname, { waitUntil: 'load' });
      if (!(await page.$(`[id="${decodeURIComponent(u.hash.slice(1))}"]`))) broken.push(`${from} -> ${u.pathname}${u.hash} (anchor missing)`);
    }
  }
  await page.close();
  const ext = [];
  const known = [];
  const viaBrowser = await browser.newPage();
  for (const url of external) {
    try {
      const res = await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 (link check)', accept: 'text/html' } });
      if (res.status < 400) continue;
      // LinkedIn (999) and Cloudflare-protected sites (403) refuse scripts; ask a real browser engine.
      const r = await viaBrowser.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => null);
      const status = r?.status() ?? 0;
      if (status && status < 400) continue;
      if ([403, 429, 999].includes(res.status)) known.push(`${url} -> ${res.status} to scripts, ${status || 'no answer'} to headless Chromium (bot protection; check by hand)`);
      else ext.push(`${url} -> ${res.status}`);
    } catch (e) { ext.push(`${url} -> ${e.cause?.code || e.message}`); }
  }
  await viaBrowser.close();
  return [
    ok(`links: ${internal.size} internal links and anchors resolve`, broken.length === 0, broken.join(', ')),
    ok(`links: ${external.size} external links answer 2xx/3xx`, ext.length === 0, [...ext, ...known].join(', ')),
  ];
}

/* 8. Copy: no dashes or emoji in the output; visible text compared with CONTENT.md. */
export async function copy(browser, base) {
  const files = [];
  const walk = async (dir) => {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const f = path.join(dir, e.name);
      if (e.isDirectory() && !['node_modules', '.git', 'src', 'tests', 'vendor'].includes(e.name)) await walk(f);
      else if (/\.(html|css|js|xml|txt)$/.test(e.name)) files.push(f);
    }
  };
  await walk(repoRoot);
  const hits = [];
  const EMOJI = /(?![©®™])\p{Extended_Pictographic}/u;
  for (const f of files) {
    const text = await readFile(f, 'utf8');
    if (text.includes('–') || text.includes('—') || EMOJI.test(text)) hits.push(path.relative(repoRoot, f));
  }

  // Visible text of all pages vs sentences in CONTENT.md (sections 1 to 4).
  const page = await browser.newPage();
  let visible = '';
  for (const p of PAGES) {
    await page.goto(base + p, { waitUntil: 'load' });
    await settle(page, p);
    visible += ' ' + (await page.evaluate(() => {
      document.querySelectorAll('details').forEach((d) => { d.open = true; }); // FAQ and price details count too
      return document.body.innerText;
    }));
  }
  await page.close();
  const norm = (s) => s.replace(/[„“”"]/g, '"').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
  const haystack = norm(visible);
  const content = await readFile(path.join(projectRoot, 'CONTENT.md'), 'utf8');
  const body = content.split(/^## 1\. DEUTSCH/m)[1] ?? '';
  const sentences = [];
  for (let line of body.split('\n')) {
    line = line.trim();
    if (!/^(-|\d+\.)\s/.test(line) || /Claude Code|only if|placeholder|CONTACT_EMAIL\)|\(with image|Use exactly/i.test(line)) continue;
    line = line.replace(/^(-|\d+\.)\s+/, '')
      .replace(/^(Title|Description|H1|H2|H3|Lead|Intro|Primary button|Secondary link|Small line under buttons|Small line|Log title|Summary line|Replay button|Text|Button|Output sentence|Output|Note|Source|Quote|Paragraph \d|P\d|Tools line|Small link|Problem|Lösung|Fix|Title|Link|Links|Photo|Inputs|Small print|Below the groups):\s*/i, '');
    for (const part of line.split(/ \| | \/ /)) {
      for (const s of part.split(/(?<=[.?!])\s+(?=[A-ZÄÖÜ„"])/)) {
        const clean = norm(s.replace(/\{[a-z_]+\}/g, '').replace(/\(\d,\d s\)|\(\d\.\d s\)/, '').replace(/\*\*/g, ''));
        if (clean.length > 12 && !/[{}]|^\(|CONTACT_EMAIL|BOOKING_URL|UID_NUMBER/.test(clean)) sentences.push(clean);
      }
    }
  }
  const missing = [...new Set(sentences)].filter((s) => !haystack.includes(s.replace(/\s*\($/, '')));
  await mkdir(qaDir, { recursive: true });
  return [
    ok('copy: no en dash, em dash or emoji in HTML/CSS/JS/XML/TXT output', hits.length === 0, hits.join(', ')),
    ok(`copy: ${sentences.length} CONTENT.md sentences checked, ${missing.length} not found verbatim (review list)`, true, missing.join('\n')),
  ];
}

/* 10. Keyboard: tab order follows the page, focus is always visible and not hidden under the header. */
export async function keyboard(browser, base) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(base + '/', { waitUntil: 'load' });
  await page.waitForTimeout(3200);
  const stops = [];
  for (let i = 0; i < 80; i++) {
    await page.keyboard.press('Tab');
    const s = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const header = document.querySelector('.site-header').getBoundingClientRect();
      const inHeader = el.closest('.site-header');
      return {
        label: `${el.tagName.toLowerCase()} ${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30)}`,
        outline: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2,
        visible: r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight,
        // The skip link sits above the header on purpose (z-index), so it is never covered.
        covered: !inHeader && !el.matches('.skip') && r.top < header.bottom - 2 && getComputedStyle(document.querySelector('.site-header')).transform === 'none',
        // Layout position (offsetTop chain): scroll-driven transforms (docking drift, pins) and the
        // scrolling FAQ list do not count as the order going back up.
        y: (() => { let v = 0; for (let e = el; e; e = e.offsetParent) v += e.offsetTop; return v; })(),
        x: (() => { let v = 0; for (let e = el; e; e = e.offsetParent) v += e.offsetLeft; return v; })(),
      };
    });
    if (!s) break;
    stops.push(s);
  }
  const noOutline = stops.filter((s) => !s.outline).map((s) => s.label);
  const hidden = stops.filter((s) => !s.visible || s.covered).map((s) => s.label);
  let backwards = 0;
  const jumps = [];
  // Reading order: left to right, then down. Moving up into the next column to the right is fine.
  for (let i = 1; i < stops.length; i++) if (stops[i].y < stops[i - 1].y - 40 && stops[i].x <= stops[i - 1].x + 40) { backwards++; jumps.push(`${stops[i - 1].label} -> ${stops[i].label}`); }
  // Accordions and replay with keys.
  // The first question is open already on wide screens (FAQ box): try the second one.
  await page.focus('.faq__item:nth-child(2) summary');
  await page.keyboard.press('Space');
  const faqOpen = await page.$eval('.faq__item:nth-child(2)', (d) => d.open);
  await page.$eval('.screen', (el) => el.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(5200);
  await page.focus('.run__replay');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  const restarted = await page.$$eval('.run__done', (cs) => cs.some((c) => getComputedStyle(c).opacity !== '1'));
  await page.close();
  return [
    ok(`keyboard: ${stops.length} tab stops, all with a visible focus outline`, noOutline.length === 0, noOutline.join(', ')),
    ok('keyboard: focused element always on screen and not under the header', hidden.length === 0, hidden.join(', ')),
    ok('keyboard: tab order follows the page top to bottom', backwards <= 1, `${backwards} jumps back up: ${jumps.join(' | ')}`),
    ok('keyboard: Space opens a FAQ item, Enter replays the run', faqOpen && restarted),
  ];
}

/* Budget: total JS <= 100 KB gzip incl. GSAP and the mascot kit (Stage 7b). */
export async function budget() {
  const list = async (dir) => (await readdir(path.join(repoRoot, dir))).filter((f) => f.endsWith('.js')).map((f) => `${dir}/${f}`);
  // Stage 7b: the kit (assets/js/kit/*.js) counts too; icons.mjs there is build time only (never loaded).
  const own = [...await list('assets/js'), ...await list('assets/js/kit')];
  const files = ['assets/vendor/gsap.min.js', 'assets/vendor/ScrollTrigger.min.js', 'assets/vendor/SplitText.min.js', ...own];
  let total = 0;
  const parts = [];
  for (const f of files) {
    const kb = gzipSync(await readFile(path.join(repoRoot, f)), { level: 9 }).length / 1024;
    total += kb;
    parts.push(`${f.replace('assets/', '')} ${kb.toFixed(1)}`);
  }
  // Stage 7b budget (design system, brief 7b item 1b): all JS incl. the lazy section modules and the kit <= 100 KB.
  return [ok(`budget: JS ${total.toFixed(1)} KB gzip (limit 100)`, total <= 100, parts.join(', '))];
}
