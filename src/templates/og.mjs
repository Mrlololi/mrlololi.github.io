import { esc, seconds, accent } from './util.mjs';
import { lockup } from './brand.mjs';
import { MASCOTS, mascotSvg } from '../../assets/js/kit/mascot-art.js';

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

// Stage 5: the same 1200x630 card for a service page: the lockup, the page title and the package price.
// No mascots (the service pages have none).
export function ogPageHtml(t, title, price) {
  return `<!doctype html>
<html lang="${t.lang}"><head><meta charset="utf-8"><link rel="stylesheet" href="/assets/css/main.css">
<style>
  html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: linear-gradient(135deg, #F4C9D3, #DCD3F0); }
  .og { box-sizing: border-box; width: 1200px; height: 630px; padding: 72px 80px; display: grid; grid-template-rows: auto 1fr auto; }
  .mark { display: block; height: 92px; width: auto; }
  .title { align-self: center; max-width: 1000px; font-family: var(--font-display); font-weight: 680; font-size: 76px; line-height: 1.02; letter-spacing: -0.025em; color: #2B2A33; }
  .foot { display: flex; justify-content: space-between; align-items: baseline; font-family: var(--font-body); font-size: 28px; color: #4A4753; }
  .price { font-family: var(--font-display); font-weight: 750; font-size: 34px; color: #2B2A33; }
</style></head>
<body><div class="og">
${lockup({ kind: 'full', lang: t.lang, class: 'mark' })}
<div class="title">${esc(title)}</div>
<div class="foot"><span>Iva Tsatskrialashvili · mrlololi.com</span><span class="price">${esc(price)}</span></div>
</div></body></html>`;
}

// Werkzeug «Ein Kauf» (18.11.2026): the 1200x630 card of a tool page: the lockup, the title and the run-log
// rail with its six step icons; the step that is off (offIndex) has a dashed ring and the break icon.
export function ogToolHtml(t, title, ids, offIndex, iconFn) {
  const rail = ids.map((id, i) => `<li class="${i === offIndex ? 'off' : 'on'}">${iconFn(i === offIndex ? 'cross' : id, { size: 48, inline: true, tone: null })}</li>`).join('');
  return `<!doctype html>
<html lang="${t.lang}"><head><meta charset="utf-8"><link rel="stylesheet" href="/assets/css/components.css"><link rel="stylesheet" href="/assets/css/kit.css"><link rel="stylesheet" href="/assets/css/main.css">
<style>
  html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: linear-gradient(135deg, #F4C9D3, #DCD3F0); }
  .og { box-sizing: border-box; width: 1200px; height: 630px; padding: 64px 80px; display: grid; grid-template-rows: auto 1fr auto auto; gap: 28px; }
  .mark { display: block; height: 84px; width: auto; }
  .title { align-self: center; max-width: 1040px; font-family: var(--font-display); font-weight: 680; font-size: 70px; line-height: 1.04; letter-spacing: -0.025em; color: #2B2A33; }
  .rail { position: relative; display: flex; justify-content: space-between; margin: 0; padding: 0 8px; list-style: none; }
  .rail::before { content: ""; position: absolute; left: 60px; right: 60px; top: 50%; height: 4px; background: #E3DBE2; }
  .rail li { position: relative; display: grid; place-items: center; width: 104px; height: 104px; border-radius: 50%; background: #fff; border: 2px solid rgb(43 42 51 / 0.12); color: #2B2A33; }
  .rail li.off { border: 4px dashed #8A2F45; color: #8A2F45; }
  .rail .i { width: 48px; height: 48px; }
  .foot { font-family: var(--font-body); font-size: 26px; color: #4A4753; }
</style></head>
<body><div class="og">
${lockup({ kind: 'full', lang: t.lang, class: 'mark' })}
<div class="title">${esc(title)}</div>
<ol class="rail">${rail}</ol>
<div class="foot">Iva Tsatskrialashvili · mrlololi.com</div>
</div></body></html>`;
}

// Musterbericht Technik-Check (24.11.2026): title, the «Fiktives Beispiel» label and a small table motif (findings
// 1, 5 and 10: one of each risk word; number, area, risk), like the Ein Kauf card. All words come from t.musterbericht.
export function ogReportHtml(t) {
  const M = t.musterbericht;
  const tone = { hoch: ['#FBE7EC', '#8E3650'], mittel: ['#FBEDE3', '#7A4E2D'], niedrig: ['#E6F1DF', '#3F6B31'] };
  const rows = [0, 4, 9].map((i) => M.findings[i]).map(([nr, area, , , risk]) => `<tr><td class="nr">${nr}</td><td>${esc(area)}</td><td><span class="tag" style="background:${tone[risk][0]};color:${tone[risk][1]}">${esc(risk)}</span></td></tr>`).join('');
  return `<!doctype html>
<html lang="${t.lang}"><head><meta charset="utf-8"><link rel="stylesheet" href="/assets/css/components.css"><link rel="stylesheet" href="/assets/css/kit.css"><link rel="stylesheet" href="/assets/css/main.css">
<style>
  html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: linear-gradient(135deg, #F4C9D3, #DCD3F0); }
  .og { box-sizing: border-box; width: 1200px; height: 630px; padding: 64px 80px; display: grid; grid-template-columns: 1fr 430px; grid-template-rows: auto 1fr auto; gap: 28px 56px; }
  .mark { grid-column: 1 / -1; display: block; height: 84px; width: auto; }
  .text { align-self: center; display: grid; gap: 22px; }
  .title { font-family: var(--font-display); font-weight: 680; font-size: 64px; line-height: 1.04; letter-spacing: -0.025em; color: #2B2A33; }
  .fake { justify-self: start; font-family: var(--font-display); font-weight: 700; font-size: 24px; color: #8E3650; background: #FDF0F3; border: 2px solid #F4C9D3; border-radius: 12px; padding: 6px 16px; }
  table { align-self: center; border-collapse: collapse; background: #fff; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 24px rgb(43 42 51 / 0.12); font-family: var(--font-body); font-size: 26px; color: #2B2A33; }
  td { padding: 18px 22px; border-bottom: 2px solid #ECE6E1; }
  tr:last-child td { border-bottom: 0; }
  .nr { font-family: var(--font-display); font-weight: 700; color: #8E3650; }
  .tag { font-family: var(--font-display); font-weight: 700; font-size: 20px; border-radius: 10px; padding: 4px 12px; }
  .foot { grid-column: 1 / -1; font-family: var(--font-body); font-size: 26px; color: #4A4753; }
</style></head>
<body><div class="og">
${lockup({ kind: 'full', lang: t.lang, class: 'mark' })}
<div class="text"><div class="title">${esc(M.title.replace(/ \| mrlololi$/, ''))}</div><div class="fake">${esc(M.fake[0].replace(/\.$/, ''))}</div></div>
<table>${rows}</table>
<div class="foot">Iva Tsatskrialashvili · mrlololi.com</div>
</div></body></html>`;
}
