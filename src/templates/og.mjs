import { esc, seconds, accent } from './util.mjs';
import { lockup } from './brand.mjs';
import { MASCOTS, mascotSvg } from '../../assets/js/mascot-art.js';

// 1200x630 social image (colour variant B): the large lockup with the tagline, name, the hero
// promise and a completed run-log excerpt. The three mascots (v2, flat) stand next to the lockup;
// the 3D versions replace them later (docs/PROMPT_Mascots_v2_2026-10-28.md, D).
// Rendered by src/tools/og.mjs on the local server, so fonts load from /assets/fonts.
export function ogHtml(t) {
  const steps = [t.run.steps[0], t.run.steps[2], t.run.steps[3], t.run.steps[5]]
    .map(
      (s) => `<li><span class="dot"><svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" fill="#4E8A3E"/><path d="M5.6 10.3l2.9 2.9 5.9-6.4" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span>${esc(s.text)}</span><span class="t">${seconds(s.seconds, t.locale)}</span></li>`
    )
    .join('');
  return `<!doctype html>
<html lang="${t.lang}"><head><meta charset="utf-8"><link rel="stylesheet" href="/assets/css/main.css">
<style>
  html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: linear-gradient(135deg, #F4C9D3, #DCD3F0); }
  .og { box-sizing: border-box; width: 1200px; height: 630px; padding: 64px 72px; display: grid; grid-template-columns: 1fr 470px; gap: 56px; align-items: center; }
  .top { display: flex; align-items: flex-end; gap: 28px; }
  .mark { display: block; height: 92px; width: auto; }
  .crew { display: flex; align-items: flex-end; gap: 4px; margin-bottom: -6px; }
  .crew svg { display: block; width: 66px; height: auto; overflow: visible; }
  .name { margin-top: 34px; font-family: var(--font-body); font-size: 26px; color: #4A4753; }
  .claim { margin-top: 14px; font-family: var(--font-display); font-weight: 680; font-size: 60px; line-height: 1.03; letter-spacing: -0.025em; color: #2B2A33; }
  .claim .accent { font-weight: 500; }
  .log { background: rgb(255 255 255 / 0.6); border: 1px solid rgb(43 42 51 / 0.08); border-radius: 24px; }
  .log h2 { margin: 0; padding: 18px 24px 8px; font-family: var(--font-body); font-weight: 700; font-size: 17px; color: #4A4753; }
  .log ol { list-style: none; margin: 0; padding: 22px 24px 8px; }
  .log li { display: grid; grid-template-columns: 24px 1fr auto; gap: 14px; padding-bottom: 18px; font-family: var(--font-body); font-size: 19px; line-height: 1.35; color: #2B2A33; }
  .dot svg { width: 24px; height: 24px; display: block; }
  .t { font-family: var(--font-body); font-variant-numeric: tabular-nums; font-size: 16px; color: #4A4753; padding-top: 2px; }
  .sum { padding: 14px 24px 18px; border-top: 1px solid rgb(43 42 51 / 0.08); font-family: var(--font-body); font-weight: 700; font-size: 17px; color: #3F6B31; }
</style></head>
<body><div class="og">
<div><div class="top">${lockup({ kind: 'full', lang: t.lang, class: 'mark' })}<div class="crew">${MASCOTS.map((m, i) => mascotSvg(i, ['idle', 'idle', 'joy'][i], 'aria-hidden="true"')).join('')}</div></div><div class="name">Iva Tsatskrialashvili</div><div class="claim">${accent(t.hero.h1)}</div></div>
<div class="log"><h2>${esc(t.run.title)}</h2><ol>${steps}</ol><div class="sum">${esc(t.run.summary)}</div></div>
</div></body></html>`;
}
