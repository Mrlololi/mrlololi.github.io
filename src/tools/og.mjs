// Renders og-image-de.png and og-image-en.png (1200x630) from src/templates/og.mjs, plus a 2x
// source of each for Iva in ../docs/brand-export/ (not deployed).
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium, repoRoot } from '../qa/browsers.mjs';
import { startServer } from '../qa/serve.mjs';
import { ogHtml, ogPageHtml, ogToolHtml, ogReportHtml } from '../templates/og.mjs';
import { icon } from '../../assets/js/kit/icons.mjs';
import { RUNLOG_ICONS } from '../templates/runlog.mjs';
import de from '../content/de.mjs';
import en from '../content/en.mjs';

const server = await startServer({ root: repoRoot });
const browser = await chromium.launch();
const exportDir = path.resolve(repoRoot, '../docs/brand-export');
await mkdir(exportDir, { recursive: true });
const fontsReady = (page) => page.evaluate(() => Promise.all(['680 60px "Bricolage Grotesque"', '750 34px "Bricolage Grotesque"', 'italic 500 60px "EB Garamond"', '400 19px "Atkinson Hyperlegible Next"'].map((f) => document.fonts.load(f))).then(() => document.fonts.ready));

// Werkzeug «Ein Kauf»: assets/og/de-ein-kauf.png (title and the run-log rail, step 5 off). --only-tools: only this.
{
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.goto(`${server.url}/404.html`);
  await page.setContent(ogToolHtml(de, de.einKauf.h1, RUNLOG_ICONS, 4, icon), { waitUntil: 'load' });
  await fontsReady(page);
  await mkdir(path.join(repoRoot, 'assets/og'), { recursive: true });
  await page.screenshot({ path: path.join(repoRoot, 'assets/og/de-ein-kauf.png') });
  console.log('og: assets/og/de-ein-kauf.png');
  await page.close();
}
// Musterbericht Technik-Check: assets/og/de-musterbericht.png (title, the label, a small table). Also under --only-tools.
{
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.goto(`${server.url}/404.html`);
  await page.setContent(ogReportHtml(de), { waitUntil: 'load' });
  await fontsReady(page);
  await page.screenshot({ path: path.join(repoRoot, 'assets/og/de-musterbericht.png') });
  console.log('og: assets/og/de-musterbericht.png');
  await page.close();
}
if (process.argv.includes('--only-tools')) { await browser.close(); await server.close(); process.exit(0); }
// Stage 5: one card per service page, assets/og/<lang>-<key>.png (--only-pages skips the home cards).
await mkdir(path.join(repoRoot, 'assets/og'), { recursive: true });
for (const t of process.argv.includes('--only-home') ? [] : [de, en]) {
  const prices = Object.fromEntries(t.pricing.groups.flatMap((g) => g.items).map((it) => [it.id, it.price]));
  for (const s of t.services.pages) {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
    await page.goto(`${server.url}/404.html`);
    await page.setContent(ogPageHtml(t, s.h1, prices[s.packages[0]]), { waitUntil: 'load' });
    await fontsReady(page);
    const file = path.join(repoRoot, `assets/og/${t.lang}-${s.key}.png`);
    await page.screenshot({ path: file });
    console.log(`og: assets/og/${path.basename(file)}`);
    await page.close();
  }
}
for (const [t, scale] of process.argv.includes('--only-pages') ? [] : [[de, 1], [en, 1], [de, 2], [en, 2]]) {
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
