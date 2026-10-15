// Runs every QA check from brief section 8 and writes mrlololi-site/qa/report.md.
// Usage: npm run qa   (add --no-lighthouse to skip the slow part)
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium, repoRoot, qaDir } from './browsers.mjs';
import { startServer } from './serve.mjs';
import { checkOverflow } from './overflow.mjs';
import { checkBehaviour } from './behaviour.mjs';
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
  return [{ name: 'no horizontal scroll on 7 pages at 360/390/768/1024/1280/1440', pass: problems.length === 0, details: problems.join('\n') }];
});
await run('Screenshots', () => screenshots(browser, server.url));
await run('Motion, reduced motion, no JS, calculator', () => checkBehaviour(browser, server.url));
await run('Network', () => network(browser, server.url));
await run('Accessibility (axe)', () => accessibility(browser, server.url));
await run('Keyboard', () => keyboard(browser, server.url));
await run('Links', () => links(browser, server.url));
await run('Copy', () => copy(browser, server.url));
await run('JS budget', () => budget());
await browser.close();
await server.close();

if (!skipLighthouse) {
  const lhServer = await startServer({ root: repoRoot, rewriteOrigin: 'https://mrlololi.github.io' });
  await run('Lighthouse (mobile)', () => lighthouseCheck(lhServer.url));
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
