// Runs every QA check from brief section 8 and writes mrlololi-site/qa/report.md.
import config from '../config.json' with { type: 'json' };
// Usage: npm run qa   (add --no-lighthouse to skip the slow part)
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium, repoRoot, qaDir } from './browsers.mjs';
import { startServer } from './serve.mjs';
import { checkOverflow, PAGES, SERVICE_PAGES } from './overflow.mjs';
import { checkSeo } from './seo.mjs';
import { checkBehaviour } from './behaviour.mjs';
import { checkReviewFixes } from './review-fixes.mjs';
import { checkDemos } from './demos.mjs';
import { checkClickable } from './clickable.mjs';
import { checkFixes } from './fixes.mjs';
import { checkStage4 } from './stage4.mjs';
import { screenshots, network, accessibility, links, copy, keyboard, budget } from './checks.mjs';
import { lighthouseCheck } from './lighthouse.mjs';

const skipLighthouse = process.argv.includes('--no-lighthouse');
const server = await startServer({ root: repoRoot });
const browser = await chromium.launch();
const sections = [];
const run = async (title, fn) => {
  process.stdout.write(`${title}... `);
  const results = await fn();
  sections.push({ title, results });
  console.log(results.every((r) => r.pass) ? 'ok' : 'FAIL');
};

await run('Layout (no horizontal scroll)', async () => {
  const problems = await checkOverflow(browser, server.url);
  return [{ name: `no horizontal scroll on ${PAGES.length} pages at 360/390/768/1024/1280/1440, plus EN/DE 360-400 after main.js`, pass: problems.length === 0, details: problems.join('\n') }];
});
await run('Screenshots', () => screenshots(browser, server.url));
await run('Motion, reduced motion, no JS, calculator', () => checkBehaviour(browser, server.url));
await run('Final-review cases (late scripts, failed main.js, timing)', () => checkReviewFixes(browser, server.url));
await run('Stage 2 demos (motion, reduced motion, no JS, keyboard, mobile)', () => checkDemos(browser, server.url));
await run('Stage 3 clickable guard (DE, EN, 360, 1280)', () => checkClickable(browser, server.url));
await run('Fixes 21.10.2026 (footer, calculator, tooltips, reduced motion, keys)', () => checkFixes(browser, server.url));
await run('Stage 4 (replay, reduced motion, no JS, keyboard and Escape, phone tabs, mailto)', () => checkStage4(browser, server.url));
// Stage 5: canonical and reciprocal hreflang over the built pages.
await run('SEO (canonical, hreflang)', async () => {
  const r = await checkSeo(repoRoot);
  return [{ name: `seo: ${r.indexable} indexable pages with canonical and reciprocal hreflang`, pass: r.problems.length === 0, details: r.problems.join('\n') }];
});
await run('Network', () => network(browser, server.url));
await run('Accessibility (axe)', () => accessibility(browser, server.url));
await run('Keyboard', () => keyboard(browser, server.url));
await run('Links', () => links(browser, server.url));
await run('Copy', () => copy(browser, server.url));
await run('JS budget', () => budget());
await browser.close();
await server.close();

if (!skipLighthouse) {
  const lhServer = await startServer({ root: repoRoot, rewriteOrigin: config.site_url });
  await run('Lighthouse (mobile)', () => lighthouseCheck(lhServer.url, ['/', '/en/', ...SERVICE_PAGES]));
  await lhServer.close();
}

const lines = [`# QA report mrlololi`, '', `Run: ${new Date().toISOString()}`, ''];
for (const s of sections) {
  lines.push(`## ${s.title}`, '');
  for (const r of s.results) {
    lines.push(`- ${r.pass ? 'PASS' : 'FAIL'} ${r.name}`);
    if (r.details) lines.push('', '  ```', ...String(r.details).split('\n').map((l) => `  ${l}`), '  ```', '');
  }
  lines.push('');
}
await writeFile(path.join(qaDir, 'report.md'), lines.join('\n'), 'utf8');
const failed = sections.flatMap((s) => s.results).filter((r) => !r.pass);
console.log(`\n${failed.length ? `${failed.length} FAILED` : 'ALL PASSED'} -> ${path.join(qaDir, 'report.md')}`);
for (const f of failed) console.log(`FAIL ${f.name}\n     ${String(f.details).slice(0, 400)}`);
process.exit(failed.length ? 1 : 0);
