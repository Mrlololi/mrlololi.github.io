// Stage 6d, prices: the package pictures move again, one after the other, while the prices are on
// screen (loops.js, one pause button for all): the checkout gets fixed, a lens ticks the list, the
// four tools come out of the launch, blocks drop into the One-Pager, the KI draft types itself and
// the 30-day strip ticks Tag 1, 14, 30. Then a rest and again. The HTML shows every picture solved;
// each picture's CSS reads its own data-play (start, run, end).
import { demo } from './loops.js';

const GAP = 450;

export function init() {
  const box = document.querySelector('.tariff[data-demo="prices"]');
  if (!box) return;
  const parts = [
    ['.viz--quick', 1800],
    ['.viz--check', 2300],
    ['.viz--hub', 1700],
    ['.viz--site', 1500],
    ['.viz--chat', 1900, typer],
    ['.days', 1800],
  ].map(([sel, ms, extra]) => {
    const el = box.querySelector(sel);
    return el && { el, ms, extra: extra?.(el) };
  }).filter(Boolean);
  let timers = [];
  const clear = () => { timers.forEach(clearTimeout); timers = []; parts.forEach((p) => p.extra?.stop()); };
  const all = (phase) => parts.forEach((p) => { p.el.dataset.play = phase; if (phase === 'end') p.extra?.finish(); if (phase === 'start') p.extra?.reset(); });
  demo(box, {
    button: box.querySelector('.tariff__ctl .loopctl'),
    rest: 3000,
    reset: () => { clear(); all('start'); },
    finish: () => { clear(); all('end'); },
    play: () => {
      let at = 0;
      for (const p of parts) {
        timers.push(setTimeout(() => { void p.el.offsetWidth; p.el.dataset.play = 'run'; p.extra?.play(); }, at));
        timers.push(setTimeout(() => { p.extra?.finish(); p.el.dataset.play = 'end'; }, at + p.ms));
        at += p.ms + GAP;
      }
      return at - GAP;
    },
  });
}

// The KI draft types itself (about 1.6 s).
function typer(viz) {
  const out = viz.querySelector('.tchat__text');
  const full = out.textContent;
  let timer = 0;
  return {
    reset: () => { clearInterval(timer); out.textContent = ''; },
    stop: () => clearInterval(timer),
    finish: () => { clearInterval(timer); out.textContent = full; },
    play: () => {
      let n = 0;
      out.textContent = '';
      timer = setInterval(() => { n += 2; out.textContent = full.slice(0, n); if (n >= full.length) clearInterval(timer); }, 1500 / (full.length / 2));
    },
  };
}
