// Dev check: the outlined lockups next to the approved draft's CSS version (same fonts, local files).
// Writes mrlololi-site/qa/brand-compare.png.  Usage: node src/tools/brand-compare.mjs
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium, repoRoot, qaDir } from '../qa/browsers.mjs';
import { lockup, icon } from '../templates/brand.mjs';

const nm = pathToFileURL(path.join(repoRoot, 'node_modules')).href;
const C = { pink: '#F4C9D3', blue: '#BFD8EE', pist: '#CFE3C2' };
const draftIcon = (sw, ink = '#2B2A33') => `<svg viewBox="0 0 64 64" width="100%" height="100%"><g stroke="${ink}" stroke-width="${sw}"><circle cx="20" cy="32" r="13" fill="${C.pink}"/><circle cx="44" cy="32" r="13" fill="${C.pist}"/><circle cx="32" cy="32" r="13" fill="${C.blue}"/></g></svg>`;
const word = (px) => `<span class="wm" style="font-size:${px}px">mrlolol<span class="idot">ı<i></i></span></span>`;
const lock = (ic, px, sub) => `<div class="lockup"><span style="width:${ic}px;height:${ic}px;display:inline-flex">${draftIcon(3)}</span><span style="display:flex;flex-direction:column;align-items:flex-start;gap:2px">${word(px)}${sub ? `<span class="ser" style="font-size:${Math.round(px * 0.48)}px"><b style="color:#9C3F58;font-weight:inherit">Lo</b>gik, <b style="color:#2F6A9E;font-weight:inherit">Lö</b>sung, <b style="color:#3F6B31;font-weight:inherit">Li</b>ve.</span>` : ''}</span></div>`;

const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:B;src:url(${nm}/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-opsz-normal.woff2);font-weight:200 800}
@font-face{font-family:E;font-style:italic;font-weight:500;src:url(${nm}/@fontsource/eb-garamond/files/eb-garamond-latin-500-italic.woff2)}
body{margin:0;padding:24px;background:#fff;font:14px sans-serif;display:grid;grid-template-columns:auto auto;gap:24px 48px;align-items:center;justify-content:start}
.wm{font-family:B;font-weight:800;font-variation-settings:"opsz" 36;letter-spacing:-.03em;line-height:1;display:inline-flex;align-items:center;white-space:nowrap;color:#2B2A33}
.idot{position:relative;display:inline-block}.idot i{position:absolute;left:50%;top:-.04em;width:.3em;height:.3em;border-radius:50%;border:.06em solid #2B2A33;background:#CFE3C2;transform:translateX(-50%);box-sizing:border-box}
.ser{font-family:E;font-style:italic;font-weight:500;color:#2B2A33}.lockup{display:flex;align-items:center;gap:12px}
.t{background:#F4C9D3;padding:12px}.d{background:#2B2A33;padding:12px}
</style>
<div class="t">${lock(30, 22, false)}</div><div class="t">${lockup({ kind: 'header', style: 'height:19.4px;display:block' })}</div>
<div>${lock(64, 42, true)}</div><div>${lockup({ kind: 'full', lang: 'de', style: 'height:57px;display:block' })}</div>
<div></div><div>${lockup({ kind: 'full', lang: 'en', style: 'height:57px;display:block' })}</div>
<div></div><div>${lockup({ kind: 'full', lang: 'de', dark: true, bg: true, pad: 300, style: 'height:90px;display:block' })}</div>
<div></div><div style="display:flex;gap:12px;align-items:center">${icon({ style: 'width:64px' })}${icon({ small: true, style: 'width:16px' })}${icon({ small: true, style: 'width:32px' })}</div>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 520 }, deviceScaleFactor: 2 });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: path.join(qaDir, 'brand-compare.png') });
await browser.close();
console.log('qa/brand-compare.png');
