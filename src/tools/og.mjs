// Renders og-image-de.png and og-image-en.png (1200x630) from src/templates/og.mjs, plus a 2x
// source of each for Iva in ../docs/brand-export/ (not deployed).
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium, repoRoot } from '../qa/browsers.mjs';
import { startServer } from '../qa/serve.mjs';
import { ogHtml } from '../templates/og.mjs';
import de from '../content/de.mjs';
import en from '../content/en.mjs';

const server = await startServer({ root: repoRoot });
const browser = await chromium.launch();
const exportDir = path.resolve(repoRoot, '../docs/brand-export');
await mkdir(exportDir, { recursive: true });
for (const [t, scale] of [[de, 1], [en, 1], [de, 2], [en, 2]]) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: scale });
  await page.goto(`${server.url}/404.html`);
  await page.setContent(ogHtml(t), { waitUntil: 'load' });
  // The headline faces are font-display optional: load them explicitly before the screenshot.
  await page.evaluate(() => Promise.all(['680 60px "Bricolage Grotesque"', 'italic 500 60px "EB Garamond"', '400 19px "Atkinson Hyperlegible Next"'].map((f) => document.fonts.load(f))));
  await page.evaluate(() => document.fonts.ready);
  const file = scale === 1 ? path.join(repoRoot, `og-image-${t.lang}.png`) : path.join(exportDir, `og-source-${t.lang}@2x.png`);
  await page.screenshot({ path: file });
  console.log(`og: ${path.basename(file)}`);
  await page.close();
}
await browser.close();
await server.close();
