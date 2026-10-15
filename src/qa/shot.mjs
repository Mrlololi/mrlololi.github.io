// Dev helper: screenshot one page at one width into mrlololi-site/qa/shots/dev/.
// Usage: node src/qa/shot.mjs /en/ 390 [full|viewport] [waitMs] [reduce]
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium, repoRoot, qaDir } from './browsers.mjs';
import { startServer } from './serve.mjs';

const [p = '/', w = '1280', mode = 'viewport', wait = '3500', reduce] = process.argv.slice(2);
const out = path.join(qaDir, 'shots', 'dev');
await mkdir(out, { recursive: true });
const server = await startServer({ root: repoRoot });
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: +w, height: +w < 800 ? 844 : 900 },
  reducedMotion: reduce ? 'reduce' : 'no-preference',
});
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(server.url + p, { waitUntil: 'load' });
await page.waitForTimeout(+wait);
const file = path.join(out, `${p.replace(/\W+/g, '_') || 'home'}-${w}-${mode}${reduce ? '-reduce' : ''}.png`);
await page.screenshot({ path: file, fullPage: mode === 'full' });
await browser.close();
await server.close();
console.log(file);
if (errors.length) console.log('console errors:\n' + errors.join('\n'));
