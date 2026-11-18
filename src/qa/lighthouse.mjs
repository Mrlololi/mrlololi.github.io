// Lighthouse (mobile, default simulated throttling) on / and /en/ using Playwright's Chromium.
// The local server rewrites the site_url origin (https://mrlololi.com) to its own origin so canonical,
// hreflang and og:url point at the page being tested, as they will on GitHub Pages.
// Stage 7b (12.11.2026): every page is run three times and the median counts (performance, TBT, LCP
// and CLS each by its own median); every run is printed. Limits for every page, home included:
// performance >= 95, TBT <= 100 ms, LCP < 2.5 s, CLS 0; accessibility, best practices, SEO >= 95.
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { chromium, qaDir } from './browsers.mjs';

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

export async function lighthouseCheck(base, pages = ['/', '/en/'], runs = 3) {
  const out = path.join(qaDir, 'lighthouse');
  await mkdir(out, { recursive: true });
  const chrome = await chromeLauncher.launch({ chromePath: chromium.executablePath(), chromeFlags: ['--headless=new', '--no-sandbox'] });
  const results = [];
  try {
    for (const p of pages) {
      const all = [];
      let runnerResult = null;
      for (let i = 0; i < runs; i++) {
        runnerResult = await lighthouse(base + p, { port: chrome.port, output: 'html', logLevel: 'error' });
        const l = runnerResult.lhr;
        const run = {
          scores: Object.fromEntries(Object.entries(l.categories).map(([k, c]) => [k, Math.round(c.score * 100)])),
          lcp: l.audits['largest-contentful-paint'].numericValue / 1000,
          cls: l.audits['cumulative-layout-shift'].numericValue,
          tbt: l.audits['total-blocking-time'].numericValue,
        };
        all.push(run);
        console.log(`  ${p} run ${i + 1}: perf ${run.scores.performance}, LCP ${run.lcp.toFixed(2)} s, TBT ${Math.round(run.tbt)} ms, CLS ${run.cls.toFixed(4)}`);
      }
      const lhr = runnerResult.lhr;
      const scores = Object.fromEntries(Object.keys(all[0].scores).map((k) => [k, median(all.map((r) => r.scores[k]))]));
      const lcp = median(all.map((r) => r.lcp));
      const cls = median(all.map((r) => r.cls));
      const tbt = median(all.map((r) => r.tbt));
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
        page: p,
        name: `lighthouse ${p} (median of ${runs}): perf ${scores.performance}, a11y ${scores.accessibility}, best ${scores['best-practices']}, seo ${scores.seo}; LCP ${lcp.toFixed(2)} s, TBT ${Math.round(tbt)} ms, CLS ${cls.toFixed(3)}`,
        // Stage 7b: performance >= 95 on every page (the home pages had 90 since Stage 4); the other
        // categories >= 95; TBT <= 100 ms; LCP in Google's «good» range; CLS exactly 0.
        pass: scores.performance >= 95 && [scores.accessibility, scores['best-practices'], scores.seo].every((s) => s >= 95) && tbt <= 100 && lcp < 2.5 && cls === 0,
        details: failing.join('\n'),
        scores, lcp, cls, tbt, runs: all,
      });
    }
  } finally {
    await chrome.kill();
  }
  // Qualität 17.11.2026: the medians also as JSON (qa/lighthouse/lighthouse.json), read by src/qa/protokoll.mjs.
  await writeFile(path.join(out, 'lighthouse.json'), `${JSON.stringify(results.map(({ page, scores, lcp, cls, tbt, runs: r, pass }) => ({ page, scores, lcp, cls, tbt, runs: r, pass })), null, 2)}
`);
  return results;
}
