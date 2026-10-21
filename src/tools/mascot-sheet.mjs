// Dev check: every mascot in every pose (idle, think, wow, joy, wave), on light and on the dark footer.
// Writes mrlololi-site/qa/mascots-sheet.png.  Usage: node src/tools/mascot-sheet.mjs
import path from 'node:path';
import { chromium, qaDir } from '../qa/browsers.mjs';
import { MASCOTS, EMOTIONS, mascotSvg } from '../../assets/js/mascot-art.js';

const cell = (i, e) => `<div class="c">${mascotSvg(i, e, 'class="mascot"')}<span>${e}</span></div>`;
const rows = MASCOTS.map((m, i) => `<div class="n">${m.name}</div>${EMOTIONS.map((e) => cell(i, e)).join('')}`).join('');
const dark = MASCOTS.map((m, i) => cell(i, 'wave')).join('');
const html = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;padding:24px;font:600 14px Arial,sans-serif;color:#2B2A33;background:linear-gradient(135deg,#FBE4EA,#ECE6F8)}
.g{display:grid;grid-template-columns:80px repeat(5,120px);gap:12px;align-items:center}
.c{display:flex;flex-direction:column;align-items:center;gap:4px;font-weight:400;font-size:12px}
.mascot{width:110px;height:auto;overflow:visible}.n{font-size:15px}
.dk{margin-top:20px;display:flex;gap:16px;padding:16px;background:#2B2A33;border-radius:16px;color:#F3EEF0;width:max-content}
.dk .o{stroke:#F3EEF0}.dk .m-shadow{fill:#fff;opacity:.14}
</style><div class="g">${rows}</div><div class="dk">${dark}</div>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 780, height: 700 }, deviceScaleFactor: 2 });
await page.setContent(html);
await page.screenshot({ path: path.join(qaDir, 'mascots-sheet.png'), fullPage: true });
await browser.close();
console.log('qa/mascots-sheet.png');
