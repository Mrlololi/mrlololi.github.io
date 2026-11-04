// Stage 6d, prices: the package pictures move again while they are on screen (loops.js). The HTML
// shows every picture solved; each picture's CSS reads its own data-play (start, run, end).
// 30.10.2026: two chains, each with its pause button right next to it.
// - The three package cards and the 30-day strip: checkout fixed, lens ticks the list, the launch
//   flow lights Formular, Zahlung, Zugang, E-Mails (Stage 6f), Tag 1, 14, 30; each starts while the
//   one before is still finishing (a wave from left to right).
// - «Weitere Leistungen» on its own: blocks drop into the One-Pager, 1 s, the KI draft types itself.
// Stage 6f: like every demo they rest at least 2.5 s and play only when nearest the centre (loops.js).
import { demo } from './loops.js';

export function init() {
  const cards = document.querySelector('.pkgs-wrap[data-demo="prices"]');
  if (cards) {
    chain(cards, [['.viz--quick', 0, 1800], ['.viz--check', 1000, 2300], ['.viz--flow', 2100, 1700], ['.days', 2600, 1800]], {
      button: cards.querySelector('.tariff__ctl .loopctl'),
      rest: 600,
    });
  }
  const more = document.querySelector('.more[data-demo="more"]');
  if (more) {
    chain(more, [['.viz--site', 0, 1500], ['.viz--chat', 2500, 1900, typer]], {
      button: more.querySelector('.more__head .loopctl'),
      rest: 1000,
    });
  }
}

// parts: [selector, start in ms, length in ms, extra?]. The round ends when the last part ends.
function chain(root, list, opts) {
  const parts = list.map(([sel, at, ms, extra]) => {
    const el = root.querySelector(sel);
    return el && { el, at, ms, extra: extra?.(el) };
  }).filter(Boolean);
  let timers = [];
  const clear = () => { timers.forEach(clearTimeout); timers = []; parts.forEach((p) => p.extra?.stop()); };
  const all = (phase) => parts.forEach((p) => { p.el.dataset.play = phase; if (phase === 'end') p.extra?.finish(); if (phase === 'start') p.extra?.reset(); });
  return demo(root, {
    ...opts,
    reset: () => { clear(); all('start'); },
    finish: () => { clear(); all('end'); },
    play: () => {
      for (const p of parts) {
        timers.push(setTimeout(() => { void p.el.offsetWidth; p.el.dataset.play = 'run'; p.extra?.play(); }, p.at));
        timers.push(setTimeout(() => { p.extra?.finish(); p.el.dataset.play = 'end'; }, p.at + p.ms));
      }
      return Math.max(...parts.map((p) => p.at + p.ms));
    },
  });
}

// The KI draft types itself word by word (about 1.6 s) over the invisible full text, which keeps
// the card's height the same in every round (Stage 6f: no height jump, nothing cut off).
function typer(viz) {
  const out = viz.querySelector('.tchat__typed');
  const full = out.textContent;
  const words = full.split(' ');
  let timer = 0;
  return {
    reset: () => { clearInterval(timer); out.textContent = ''; },
    stop: () => clearInterval(timer),
    finish: () => { clearInterval(timer); out.textContent = full; },
    play: () => {
      let n = 0;
      out.textContent = '';
      timer = setInterval(() => { n += 1; out.textContent = words.slice(0, n).join(' '); if (n >= words.length) clearInterval(timer); }, 1500 / words.length);
    },
  };
}
