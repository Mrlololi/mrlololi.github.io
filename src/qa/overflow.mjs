// Quick check: no horizontal scroll on any page at the brief's widths.
// Usage: node src/qa/overflow.mjs  (exit code 1 on failure)
import { pathToFileURL } from 'node:url';
import { chromium, repoRoot } from './browsers.mjs';
import { startServer } from './serve.mjs';

export const PAGES = ['/', '/en/', '/impressum/', '/datenschutz/', '/en/legal-notice/', '/en/privacy/', '/404.html'];
export const WIDTHS = [360, 390, 768, 1024, 1280, 1440];

export async function checkOverflow(browser, base) {
  const problems = [];
  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    for (const p of PAGES) {
      await page.goto(base + p, { waitUntil: 'load' });
      const r = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const wide = [...document.querySelectorAll('body *')]
          .filter((el) => el.getBoundingClientRect().right > vw + 1 && getComputedStyle(el).position !== 'fixed')
          .slice(0, 3)
          .map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`);
        return { sw: document.documentElement.scrollWidth, vw, wide };
      });
      if (r.sw > r.vw) problems.push(`${p} @${width}: scrollWidth ${r.sw} > ${r.vw} (${r.wide.join(', ')})`);
    }
    await page.close();
  }
  return problems;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = await startServer({ root: repoRoot });
  const browser = await chromium.launch();
  const problems = await checkOverflow(browser, server.url);
  await browser.close();
  await server.close();
  console.log(problems.length ? problems.join('\n') : 'overflow: none at 360-1440 px on 7 pages');
  process.exit(problems.length ? 1 : 0);
}
