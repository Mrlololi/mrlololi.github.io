// Measures size-adjust / ascent / descent overrides so a local Arial fallback
// takes the same space as the web fonts (keeps CLS low during font swap).
// Usage: node src/tools/fallback-metrics.mjs  -> prints @font-face values for main.css
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium, repoRoot } from '../qa/browsers.mjs';

const fonts = {
  'Bricolage Grotesque': { file: 'bricolage-grotesque-latin.woff2', weight: 680, sample: 'Die Technik hinter Ihrem Kurs-Launch. Gebaut, getestet, betreut.' },
  'Atkinson Hyperlegible Next': { file: 'atkinson-hyperlegible-next-latin.woff2', weight: 400, sample: 'Ich verbinde Formulare, ActiveCampaign, Zapier, Checkout und Mitgliederbereich so, dass beim Cart-Open nichts bricht.' },
};

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<!doctype html><canvas id="c"></canvas>');

for (const [family, f] of Object.entries(fonts)) {
  const b64 = (await readFile(path.join(repoRoot, 'assets/fonts', f.file))).toString('base64');
  const m = await page.evaluate(async ({ family, b64, weight, sample }) => {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const face = new FontFace(`${family} M`, bytes.buffer, { weight: '200 800' });
    await face.load();
    document.fonts.add(face);
    const ctx = document.getElementById('c').getContext('2d');
    ctx.font = `${weight} 100px "${family} M"`;
    const t = ctx.measureText(sample);
    const tm = ctx.measureText('Hg');
    ctx.font = `${weight >= 600 ? 700 : 400} 100px Arial`;
    const a = ctx.measureText(sample);
    return { w: t.width, aw: a.width, asc: tm.fontBoundingBoxAscent, desc: tm.fontBoundingBoxDescent };
  }, { family, b64, weight: f.weight, sample: f.sample });
  const s = m.w / m.aw;
  const pct = (v) => `${(v * 100).toFixed(2)}%`;
  console.log(`/* ${family} */ size-adjust: ${pct(s)}; ascent-override: ${pct(m.asc / 100 / s)}; descent-override: ${pct(m.desc / 100 / s)}; line-gap-override: 0%;`);
}
await browser.close();
