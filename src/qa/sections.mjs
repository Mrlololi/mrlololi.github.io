// Dev helper: screenshot every top-level section of a page separately.
// Usage: node src/qa/sections.mjs /en/ 1280 [waitMs] [reduce]
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium, repoRoot, qaDir } from './browsers.mjs';
import { startServer } from './serve.mjs';

const [p = '/', w = '1280', wait = '3500', reduce] = process.argv.slice(2);
const out = path.join(qaDir, 'shots', 'dev', 'sections');
await mkdir(out, { recursive: true });
const server = await startServer({ root: repoRoot });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: +w, height: 900 }, reducedMotion: reduce ? 'reduce' : 'no-preference' });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(server.url + p, { waitUntil: 'load' });
await page.waitForTimeout(+wait);
const ids = await page.$$eval('main > section', (els) => els.map((e, i) => e.id || `s${i}`));
for (const id of ids) {
  const el = page.locator(`main > section${/^s\d+$/.test(id) ? `:nth-of-type(${+id.slice(1) + 1})` : `#${id}`}`);
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const file = path.join(out, `${p.replace(/\W+/g, '_')}-${w}-${id}.png`);
  await el.screenshot({ path: file });
  console.log(file);
}
await browser.close();
await server.close();
if (errors.length) console.log('console errors:\n' + errors.join('\n'));
