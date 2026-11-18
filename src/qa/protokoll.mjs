// Qualität (docs/PROMPT_Qualitaet_und_Wortfilter_2026-11-17.md, part B): the measurement behind /qualitaet/.
// Run by Claude Code before every publish. It builds the site, runs npm test and the gates (main and
// Webprojekte), Lighthouse phone (3 runs per page, median), and on every page: axe (serious and critical),
// cookies after load and scroll (expected 0), requests to other origins (expected 0), CLS while scrolling,
// and three keyboard checks. Then it writes src/content/qualitaet.json and builds again.
// Pages: MAIN_PAGES of src/qa/gates.mjs plus every service page (DE and EN).
// Publishing order: commit the code first, then run this on the clean tree and commit qualitaet.json, so the
// page names the commit that was measured. On a tree with changes the page says so («lokale Änderungen»).
//   node src/qa/protokoll.mjs            the full run (about 1.5 hours)
//   node src/qa/protokoll.mjs --quick    layout preview only: no npm test / gates, 1 Lighthouse run, marked
//                                         quick (tests/qualitaet.test.mjs refuses a quick file)
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
import { chromium, repoRoot, qaDir } from './browsers.mjs';
import { startServer } from './serve.mjs';
import { lighthouseCheck } from './lighthouse.mjs';
import { MAIN_PAGES } from './gates.mjs';
import { budget } from './checks.mjs';
import config from '../config.json' with { type: 'json' };
import de from '../content/de.mjs';
import en from '../content/en.mjs';

const OUT = path.join(repoRoot, 'src/content/qualitaet.json');
const PERF_LIMIT = 95; // the gate of src/qa/lighthouse.mjs (performance >= 95 on every page)
const pkg = (name) => JSON.parse(readFileSync(path.join(repoRoot, 'node_modules', name, 'package.json'), 'utf8')).version;
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Vienna' }).format(new Date());
const git = (...a) => execFileSync('git', a, { cwd: repoRoot, encoding: 'utf8' }).trim();

export const PAGES = [...new Set([...MAIN_PAGES, ...de.services.pages.map((p) => p.path), ...en.services.pages.map((p) => p.path)])];

// Runs a command, returns its output (exit code ignored: the counts tell) and keeps the whole output in
// qa/protokoll-<name>.log for the report. Only npm needs a shell on Windows (npm.cmd); node runs without one,
// so a path with spaces («C:\Program Files\nodejs\node.exe») stays one argument.
function run(cmd, args, log, env = process.env, name = path.basename(args[args.length - 1] || cmd)) {
  return new Promise((resolve) => {
    log(`> ${cmd} ${args.join(' ')}`);
    const p = spawn(cmd, args, { cwd: repoRoot, env, shell: cmd === 'npm' && process.platform === 'win32' });
    let out = '';
    p.stdout.on('data', (d) => { out += d; });
    p.stderr.on('data', (d) => { out += d; });
    p.on('close', (code) => { writeFileSync(path.join(qaDir, `protokoll-${name.replace(/\W+/g, '-')}.log`), out); resolve({ code, out }); });
  });
}

// node --test summary: «ℹ tests 270», «ℹ pass 270», «ℹ fail 0».
export function testCounts(out) {
  const n = (k) => Number((out.match(new RegExp(`ℹ ${k} (\\d+)`)) || [])[1] ?? NaN);
  return { total: n('tests'), pass: n('pass'), fail: n('fail') };
}
// gates summary: «360/360 gates ok».
export function gateCounts(out) {
  const m = out.match(/(\d+)\/(\d+) gates ok/);
  return m ? { total: Number(m[2]), pass: Number(m[1]), fail: Number(m[2]) - Number(m[1]) } : { total: NaN, pass: NaN, fail: NaN };
}

// One page in Chromium at 1280 x 900: axe, cookies, foreign requests, CLS while scrolling, keyboard.
async function pageChecks(browser, base, p) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(() => {
    window.__cls = 0;
    try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); } catch { /* none */ }
  });
  const page = await ctx.newPage();
  const origin = new URL(base).origin;
  const external = new Set();
  page.on('request', (r) => { const u = r.url(); if (/^https?:/.test(u) && new URL(u).origin !== origin) external.add(u); });
  await page.goto(base + p, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const h = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  for (let y = 0; y <= h; y += 300) { await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(50); }
  await page.waitForTimeout(500);
  const cls = await page.evaluate(() => window.__cls);
  const cookies = (await ctx.cookies()).length;
  await page.evaluate(() => scrollTo(0, 0));
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  const axeSerious = axe.violations.filter((v) => ['serious', 'critical'].includes(v.impact)).reduce((n, v) => n + v.nodes.length, 0);
  await ctx.close();
  const keyboard = await keyboardChecks(browser, base, p);
  return { page: p, cls: Number(cls.toFixed(4)), cookies, external: external.size, externalUrls: [...external], axeSerious, axeIds: axe.violations.map((v) => `${v.id}:${v.impact}`), keyboard };
}

// Three keyboard checks per page: (1) the first Tab reaches the skip link and Enter moves the focus into
// <main>; (2) every Tab stop shows a visible focus outline (at least 2 px); (3) Tab walks the whole page
// without a trap (it leaves the last control, the focus does not stick).
async function keyboardChecks(browser, base, p) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(base + p, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  await page.keyboard.press('Tab');
  const first = await page.evaluate(() => document.activeElement?.classList.contains('skip'));
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  const inMain = await page.evaluate(() => Boolean(document.activeElement?.closest('main')) || document.activeElement?.id === 'main');
  await page.evaluate(() => { document.activeElement?.blur(); scrollTo(0, 0); });
  const stops = [];
  let trapped = false;
  let last = null;
  let same = 0;
  for (let i = 0; i < 400; i++) {
    await page.keyboard.press('Tab');
    const s = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      const ring = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2) || /\d+px/.test(cs.boxShadow.replace(/rgba?\([^)]*\)/g, '')) && cs.boxShadow !== 'none';
      let host = el;
      // A group whose ring is drawn on its parent (:has(> summary:focus-visible)).
      if (!ring && el.parentElement) { const ps = getComputedStyle(el.parentElement); if (ps.outlineStyle !== 'none' && parseFloat(ps.outlineWidth) >= 2) host = el.parentElement; }
      const key = `${el.tagName}#${el.id}.${el.className?.baseVal ?? el.className}|${el.textContent?.trim().slice(0, 20)}|${Math.round(el.getBoundingClientRect().top + scrollY)}`;
      return { key, ring: ring || host !== el, label: `${el.tagName.toLowerCase()} ${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30)}` };
    });
    if (!s) break; // left the page: no trap
    if (stops.length && s.key === stops[0].key) break; // wrapped around to the first stop: no trap
    if (last === s.key) { same += 1; if (same > 2) { trapped = true; break; } } else same = 0;
    last = s.key;
    stops.push(s);
  }
  if (stops.length >= 400) trapped = true;
  await ctx.close();
  const noRing = stops.filter((s) => !s.ring).map((s) => s.label);
  return [
    { name: 'skip link first, Enter into main', pass: Boolean(first && inMain) },
    { name: `${stops.length} tab stops with a visible focus ring`, pass: noRing.length === 0, details: noRing.join(', ') },
    { name: 'no keyboard trap', pass: !trapped },
  ];
}

export async function measure({ quick = false, log = console.log } = {}) {
  const env = { ...process.env };
  log('build');
  execFileSync(process.execPath, ['src/build.mjs'], { cwd: repoRoot, env, stdio: 'ignore' });
  // Only pages that are built (the very first run has no /qualitaet/ yet: it comes with the next run).
  const list = PAGES.filter((p) => existsSync(path.join(repoRoot, p.endsWith('/') ? `${p.slice(1)}index.html` : p.slice(1))));
  const server = await startServer({ root: repoRoot, rewriteOrigin: config.site_url });
  const runs = quick ? 1 : 3;
  let lh;
  try { lh = await lighthouseCheck(server.url, list, runs); } finally { await server.close(); }
  const server2 = await startServer({ root: repoRoot });
  const browser = await chromium.launch();
  const per = [];
  try {
    for (const p of list) {
      const r = await pageChecks(browser, server2.url, p);
      const l = lh.find((x) => x.page === p);
      per.push({ ...r, perf: l.scores.performance, a11y: l.scores.accessibility, best: l.scores['best-practices'], seo: l.scores.seo, lcp: Number(l.lcp.toFixed(2)), tbt: Math.round(l.tbt), clsLighthouse: l.cls });
      log(`${p}: perf ${l.scores.performance}, cls ${r.cls}/${l.cls}, axe ${r.axeSerious}, cookies ${r.cookies}, ext ${r.external}, keyboard ${r.keyboard.filter((k) => k.pass).length}/${r.keyboard.length}`);
    }
  } finally { await browser.close(); await server2.close(); }
  const chromiumVersion = await (async () => { const b = await chromium.launch(); const v = b.version(); await b.close(); return v; })();
  const [budgetCheck] = await budget();
  const kb = per.flatMap((x) => x.keyboard);
  const formFile = path.join(qaDir, 'form-live/last.json');
  const form = existsSync(formFile) ? JSON.parse(readFileSync(formFile, 'utf8')) : null;
  const dirty = git('status', '--porcelain', '--untracked-files=no').split('\n').filter(Boolean).filter((l) => !/src\/content\/qualitaet\.json|qualitaet\/index\.html|sitemap\.xml/.test(l)).length > 0;
  const data = {
    about: 'Written by src/qa/protokoll.mjs; the build renders /qualitaet/ only from this file. Never edit by hand.',
    measured: today(),
    measuredAt: new Date().toISOString(),
    commit: git('rev-parse', '--short', 'HEAD'),
    dirty,
    ...(quick ? { quick: true } : {}),
    tools: { lighthouse: pkg('lighthouse'), playwright: pkg('playwright'), chromium: chromiumVersion, axe: pkg('axe-core'), node: process.version.slice(1) },
    lighthouseRuns: runs,
    tests: { total: null, pass: null, fail: null },
    gates: { total: null, pass: null, fail: null },
    summary: {
      pages: per.length,
      perfLimit: PERF_LIMIT,
      perfMin: Math.min(...per.map((x) => x.perf)),
      perfMax: Math.max(...per.map((x) => x.perf)),
      clsMax: Math.max(...per.map((x) => Math.max(x.cls, x.clsLighthouse))),
      keyboardPassed: kb.filter((k) => k.pass).length,
      keyboardTotal: kb.length,
      axeSerious: per.reduce((n, x) => n + x.axeSerious, 0),
      cookies: per.reduce((n, x) => n + x.cookies, 0),
      external: per.reduce((n, x) => n + x.external, 0),
      budget: budgetCheck.name.replace(/^budget: /, ''),
      budgetOk: budgetCheck.pass,
    },
    // Only a test that reached the mailbox counts (qa/form-live/last.json with inbox: true, after Iva confirmed it).
    form_live: form?.inbox ? form.date : null,
    pages: per,
  };
  // The measured values first (the page is built from them), then npm test and the gates over that build;
  // PROTOKOLL_RUNNING tells tests/qualitaet.test.mjs that the two counts are being measured right now.
  const write = () => {
    writeFileSync(OUT, `${JSON.stringify(data, null, 2)}\n`);
    execFileSync(process.execPath, ['src/build.mjs'], { cwd: repoRoot, env, stdio: 'ignore' });
  };
  write();
  if (!quick) {
    const runEnv = { ...process.env, PROTOKOLL_RUNNING: '1' };
    data.tests = testCounts((await run('npm', ['test'], log, runEnv)).out);
    log(`npm test: ${data.tests.pass}/${data.tests.total}`);
    data.gates = gateCounts((await run(process.execPath, ['src/qa/gates.mjs', 'all'], log, runEnv)).out);
    log(`gates: ${data.gates.pass}/${data.gates.total}`);
    write();
  }
  log(`written ${path.relative(repoRoot, OUT)}`);
  return data;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const d = await measure({ quick: process.argv.includes('--quick') });
  console.log(JSON.stringify({ measured: d.measured, commit: d.commit, dirty: d.dirty, tests: d.tests, gates: d.gates, summary: d.summary, form_live: d.form_live }, null, 2));
}
