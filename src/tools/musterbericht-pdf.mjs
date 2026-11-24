// Musterbericht Technik-Check (24.11.2026): prints /musterbericht/technik-check/ to
// musterbericht/technik-check.pdf (A4, printBackground, the print rules of assets/css/musterbericht.css), with the
// page header «Fiktives Beispiel» and the footer line and page count of the PDF Iva approved. Run after the build:
//   node src/build.mjs && node src/tools/musterbericht-pdf.mjs
import { statSync } from 'node:fs';
import path from 'node:path';
import { chromium, repoRoot } from '../qa/browsers.mjs';
import { startServer } from '../qa/serve.mjs';
import de from '../content/de.mjs';

const M = de.musterbericht;
const out = path.join(repoRoot, M.pdf.replace(/^\//, ''));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const small = 'font-family: Arial, sans-serif; font-size: 7pt; color: #6E6A78; width: 100%; padding: 0 18mm; display: flex; justify-content: space-between;';
const headerTemplate = `<div style="${small} justify-content: flex-end;"><span style="color: #8E3650; font-weight: 700; letter-spacing: 1pt; text-transform: uppercase;">${esc(M.pdfHeader)}</span></div>`;
const footerTemplate = `<div style="${small}"><span>${esc(M.pdfFooter)}</span><span>${esc(M.pdfPage).replace('{page}', '<span class="pageNumber"></span>').replace('{pages}', '<span class="totalPages"></span>')}</span></div>`;

const server = await startServer({ root: repoRoot });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  await page.goto(`${server.url}${M.path}`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: out, format: 'A4', printBackground: true, displayHeaderFooter: true, headerTemplate, footerTemplate, margin: { top: '18mm', right: '18mm', bottom: '20mm', left: '18mm' } });
  console.log(`pdf: ${path.relative(repoRoot, out)} (${Math.round(statSync(out).size / 1024)} KB)`);
} finally {
  await browser.close();
  await server.close();
}
