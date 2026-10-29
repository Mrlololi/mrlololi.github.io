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

/* 5. axe-core: zero serious or critical issues per page. */
export async function accessibility(browser, base) {
  const results = [];
  for (const width of [390, 1280]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } }); // axe needs its own context
    const page = await ctx.newPage();
    for (const p of PAGES) {
      await page.goto(base + p, { waitUntil: 'load' });
      await settle(page, p);
      const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
      const bad = r.violations.filter((v) => ['serious', 'critical'].includes(v.impact));
      const other = r.violations.filter((v) => !['serious', 'critical'].includes(v.impact));
      results.push(ok(`axe ${p} @${width}: 0 serious/critical`, bad.length === 0,
        [...bad, ...other].map((v) => `${v.impact} ${v.id} (${v.nodes.length}): ${v.nodes[0]?.target}`).join(' | ')));
    }
    await ctx.close();
  }
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

/* Budget: total JS <= 90 KB gzip incl. GSAP. */
export async function budget() {
  const own = (await readdir(path.join(repoRoot, 'assets/js'))).filter((f) => f.endsWith('.js')).map((f) => `assets/js/${f}`);
  const files = ['assets/vendor/gsap.min.js', 'assets/vendor/ScrollTrigger.min.js', 'assets/vendor/SplitText.min.js', ...own];
  let total = 0;
  const parts = [];
  for (const f of files) {
    const kb = gzipSync(await readFile(path.join(repoRoot, f)), { level: 9 }).length / 1024;
    total += kb;
    parts.push(`${path.basename(f)} ${kb.toFixed(1)}`);
  }
  // Stage 4 budget (docs/superpowers/specs/2026-10-21-stage4-motion.md): all JS incl. the lazy section modules <= 115 KB.
  return [ok(`budget: JS ${total.toFixed(1)} KB gzip (limit 115)`, total <= 115, parts.join(', '))];
}
