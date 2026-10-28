// Internal preview (Mascots v2, 28.10.2026): every mascot in every emotion at 36, 72 and 160 px, on
// paper, pink and the dark footer colour. Writes ../docs/mascots-v2-preview.html (not deployed) and
// a screenshot of it to ../qa/mascots-v2-preview.png.  Usage: node src/tools/mascot-preview.mjs
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium, qaDir, repoRoot } from '../qa/browsers.mjs';
import { MASCOTS, EMOTIONS, mascotSvg } from '../../assets/js/mascot-art.js';

const BGS = [['paper', 'Papier', '#FDF8F4'], ['pink', 'Rosa', '#F4C9D3'], ['dark', 'Dunkel (Footer)', '#2B2A33']];
const SIZES = [36, 72, 160];

// Per emotion: 160 px on the left, 72 and 36 px stacked on the right.
let n = 0;
const one = (i, e, dark, px) => `<div class="s" style="width:${px}px">${mascotSvg(i, e, `class="mascot${dark ? ' mascot--on-dark' : ''}" aria-hidden="true" focusable="false"`, `-${++n}`)}</div>`;
const cell = (i, e, dark) => `<figure>${one(i, e, dark, SIZES[2])}<div class="sm">${one(i, e, dark, SIZES[1])}${one(i, e, dark, SIZES[0])}</div><figcaption>${e}</figcaption></figure>`;
const panel = ([key, label, bg]) => `<section class="bg bg--${key}" style="background:${bg}"><h2>${label}</h2>${MASCOTS.map((m, i) => `<div class="row"><h3>${m.name}</h3>${EMOTIONS.map((e) => cell(i, e, key === 'dark')).join('')}</div>`).join('')}</section>`;

const html = `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Maskottchen v2: Vorschau</title>
<meta name="robots" content="noindex">
<style>
  body { margin: 0; padding: 24px; font: 14px/1.4 Arial, sans-serif; color: #2B2A33; background: #FDF8F4; }
  h1 { font-size: 20px; margin: 0 0 4px; } p { margin: 0 0 20px; color: #4A4753; }
  .bg { border-radius: 20px; padding: 16px 20px; margin-bottom: 20px; }
  .bg h2 { font-size: 15px; margin: 0 0 8px; }
  .row { display: flex; align-items: flex-end; gap: 18px; padding: 10px 0; border-top: 1px solid rgb(43 42 51 / 0.08); overflow-x: auto; }
  .row h3 { width: 70px; flex: none; margin: 0 0 24px; font-size: 14px; }
  figure { margin: 0; display: grid; grid-template-columns: auto auto; align-items: end; gap: 6px 10px; }
  .sm { display: flex; flex-direction: column; align-items: center; gap: 10px; }
  figcaption { grid-column: 1 / -1; text-align: center; font-size: 12px; color: #4A4753; }
  .mascot { display: block; width: 100%; height: auto; overflow: visible; }
  .bg--dark { color: #F3EEF0; } .bg--dark figcaption { color: #F3EEF0; } .bg--dark .row { border-color: rgb(255 255 255 / 0.12); }
  .mascot--on-dark .o { stroke: #F3EEF0; } .mascot--on-dark .m-shadow { fill: #fff; opacity: 0.14; }
</style></head>
<body>
<h1>Maskottchen v2: Logik, Lösung, Live</h1>
<p>Interne Vorschau, nicht veröffentlicht. Jede Emotion in 36, 72 und 160 px (36 px ist die Größe im Hero).</p>
${BGS.map(panel).join('\n')}
</body></html>
`;

const file = path.resolve(repoRoot, '../docs/mascots-v2-preview.html');
await writeFile(file, html);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1500, height: 900 }, deviceScaleFactor: 1 });
await page.setContent(html);
await page.screenshot({ path: path.join(qaDir, 'mascots-v2-preview.png'), fullPage: true });
// A close-up of the 36 and 72 px sizes on paper, at 2x, to judge readability.
const small = await page.$('.bg--paper');
await small.screenshot({ path: path.join(qaDir, 'mascots-v2-paper.png') });
await browser.close();
console.log(`${path.relative(repoRoot, file)}, qa/mascots-v2-preview.png`);
