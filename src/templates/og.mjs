import { esc, seconds } from './util.mjs';

// 1200x630 social image: name, the hero promise and a completed run-log excerpt.
// Rendered by src/tools/og.mjs on the local server, so fonts load from /assets/fonts.
export function ogHtml(t) {
  const steps = [t.run.steps[0], t.run.steps[2], t.run.steps[3], t.run.steps[5]]
    .map(
      (s) => `<li><span class="dot"><svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" fill="#1F7A5C"/><path d="M5.6 10.3l2.9 2.9 5.9-6.4" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span>${esc(s.text)}</span><span class="t">${seconds(s.seconds, t.locale)}</span></li>`
    )
    .join('');
  return `<!doctype html>
<html lang="${t.lang}"><head><meta charset="utf-8"><link rel="stylesheet" href="/assets/css/main.css">
<style>
  html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: #F1F4F2; }
  .og { box-sizing: border-box; width: 1200px; height: 630px; padding: 64px 72px; display: grid; grid-template-columns: 1fr 470px; gap: 56px; align-items: center; }
  .mark { font-family: var(--font-display); font-weight: 720; font-size: 30px; letter-spacing: -0.03em; color: #15272A; }
  .name { margin-top: 36px; font-family: var(--font-body); font-size: 26px; color: #4A5F60; }
  .claim { margin-top: 14px; font-family: var(--font-display); font-weight: 680; font-size: 60px; line-height: 1.03; letter-spacing: -0.025em; color: #15272A; }
  .log { background: #FAFBFA; border: 1px solid #C7D2CD; border-radius: 14px; box-shadow: 0 1px 0 rgb(21 39 42 / .06), 0 24px 48px -28px rgb(21 39 42 / .4); }
  .log h2 { margin: 0; padding: 16px 24px; border-bottom: 1px solid #C7D2CD; font-family: var(--font-log); font-weight: 400; font-size: 17px; color: #4A5F60; }
  .log ol { list-style: none; margin: 0; padding: 22px 24px 8px; }
  .log li { display: grid; grid-template-columns: 24px 1fr auto; gap: 14px; padding-bottom: 18px; font-family: var(--font-body); font-size: 19px; line-height: 1.35; color: #15272A; }
  .dot svg { width: 24px; height: 24px; display: block; }
  .t { font-family: var(--font-log); font-size: 16px; color: #4A5F60; padding-top: 2px; }
  .sum { padding: 14px 24px 18px; border-top: 1px solid #C7D2CD; font-family: var(--font-log); font-size: 17px; color: #15272A; }
</style></head>
<body><div class="og">
<div><div class="mark">mrlololi</div><div class="name">Iva Tsatskrialashvili</div><div class="claim">${esc(t.hero.h1.replace(/\*/g, ''))}</div></div>
<div class="log"><h2>${esc(t.run.title)}</h2><ol>${steps}</ol><div class="sum">${esc(t.run.summary)}</div></div>
</div></body></html>`;
}
