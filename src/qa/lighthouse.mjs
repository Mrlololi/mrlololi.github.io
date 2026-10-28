// Lighthouse (mobile, default simulated throttling) on / and /en/ using Playwright's Chromium.
// The local server rewrites the site_url origin (https://mrlololi.com) to its own origin so canonical,
// hreflang and og:url point at the page being tested, as they will on GitHub Pages.
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { chromium, qaDir } from './browsers.mjs';

export async function lighthouseCheck(base, pages = ['/', '/en/']) {
  const out = path.join(qaDir, 'lighthouse');
  await mkdir(out, { recursive: true });
  const chrome = await chromeLauncher.launch({ chromePath: chromium.executablePath(), chromeFlags: ['--headless=new', '--no-sandbox'] });
  const results = [];
  try {
    for (const p of pages) {
      const runnerResult = await lighthouse(base + p, { port: chrome.port, output: 'html', logLevel: 'error' });
      const lhr = runnerResult.lhr;
      const scores = Object.fromEntries(Object.entries(lhr.categories).map(([k, c]) => [k, Math.round(c.score * 100)]));
      const lcp = lhr.audits['largest-contentful-paint'].numericValue / 1000;
      const cls = lhr.audits['cumulative-layout-shift'].numericValue;
      await writeFile(path.join(out, `lighthouse${p.replace(/\W+/g, '_')}.html`), runnerResult.report);
      const failing = Object.values(lhr.audits)
        .filter((a) => a.score !== null && a.score < 0.9 && a.scoreDisplayMode === 'binary')
        .map((a) => a.id);
      const shifts = (lhr.audits['layout-shifts']?.details?.items || [])
        .map((i) => `shift ${i.score?.toFixed(3)} ${i.node?.selector || ''} ${i.node?.snippet?.slice(0, 80) || ''}`);
      const lcpEl = lhr.audits['largest-contentful-paint-element']?.details?.items || [];
      const lcpInfo = lcpEl.flatMap((block) => (block.items || []).map((i) => i.node ? `LCP element ${i.node.selector}` : `${i.phase}: ${Math.round(i.timing)} ms`));
      const opportunities = ['render-blocking-insight', 'render-blocking-resources', 'font-display-insight', 'network-dependency-tree-insight', 'lcp-discovery-insight']
        .filter((id) => lhr.audits[id] && lhr.audits[id].score !== null && lhr.audits[id].score < 1)
        .map((id) => `${id}: ${lhr.audits[id].displayValue || ''}`);
      failing.push(...shifts, ...lcpInfo, ...opportunities);
      results.push({
        name: `lighthouse ${p}: perf ${scores.performance}, a11y ${scores.accessibility}, best ${scores['best-practices']}, seo ${scores.seo}; LCP ${lcp.toFixed(2)} s, CLS ${cls.toFixed(3)}`,
        // Stage 4 target: performance >= 90 (was 95); the other categories stay >= 95; LCP in Google's «good» range.
        pass: scores.performance >= 90 && [scores.accessibility, scores['best-practices'], scores.seo].every((s) => s >= 95) && lcp < 2.5 && cls < 0.05,
        details: failing.join('\n'),
        scores, lcp, cls,
      });
    }
  } finally {
    await chrome.kill();
  }
  return results;
}
