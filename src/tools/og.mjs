// Renders og-image-de.png and og-image-en.png (1200x630) from src/templates/og.mjs.
import path from 'node:path';
import { chromium, repoRoot } from '../qa/browsers.mjs';
import { startServer } from '../qa/serve.mjs';
import { ogHtml } from '../templates/og.mjs';
import de from '../content/de.mjs';
import en from '../content/en.mjs';

const server = await startServer({ root: repoRoot });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
for (const t of [de, en]) {
  await page.goto(`${server.url}/404.html`);
  await page.setContent(ogHtml(t), { waitUntil: 'load' });
  // The headline faces are font-display optional: load them explicitly before the screenshot.
  await page.evaluate(() => Promise.all(['680 60px "Bricolage Grotesque"', 'italic 500 60px "EB Garamond"', '400 19px "Atkinson Hyperlegible Next"'].map((f) => document.fonts.load(f))));
  await page.evaluate(() => document.fonts.ready);
  const file = path.join(repoRoot, `og-image-${t.lang}.png`);
  await page.screenshot({ path: file });
  console.log(`og: ${path.basename(file)}`);
}
await browser.close();
await server.close();
