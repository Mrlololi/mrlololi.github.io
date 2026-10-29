// «Wo es meistens hakt»: each problem card plays «broken, then solved» (about 3.6 s) and ends looking
// solved, with the quiet «before» next to the «after». The CSS draws the frames by data-play (start
// = broken, run = the film, end = solved); this file counts the sign-ups and turns the lead mascot
// from worried to calm. Stage 6c (Iva): it loops while visible. Where the three stand in one row
// (1100 px and up) they play as one chain, one pause button for the row. 30.10.2026 (Iva: no picture
// rests longer than about 3 s while in view): each card starts 1.2 s after the one before (a wave
// from left to right), 0.6 s rest after the third, again; so every card moves again after 3 s. Stacked (phones), each card loops on its own with its own button.
import { demo } from './loops.js';
import { setPose } from './mascots.js';

const LENGTH = 3600;
const PAUSE = 1500;
const STEP = 1200;
const CALM_AT = 2100;

export function init({ locale }) {
  const figs = [...document.querySelectorAll('.fixdemo')];
  const cards = figs.map((fig) => card(fig, locale));
  const row = matchMedia('(min-width: 1100px)').matches;
  if (!row) {
    cards.forEach((c) => demo(c.fig, { ...c.hooks, rest: PAUSE, button: c.fig.querySelector(':scope > .loopctl') }));
    return;
  }
  let timers = [];
  const set = (c, phase) => { c.fig.dataset.play = phase; };
  const clear = () => { timers.forEach(clearTimeout); timers = []; };
  demo(document.querySelector('.pcs'), {
    button: document.querySelector('.pcs__ctl .loopctl'),
    rest: 600,
    frames: 2,
    reset: () => { clear(); cards.forEach((c) => { c.hooks.reset(); set(c, 'start'); }); },
    finish: () => { clear(); cards.forEach((c) => { c.hooks.finish(); set(c, 'end'); }); },
    frame: (i) => cards.forEach((c) => { c.hooks.frame(i); set(c, i ? 'end' : 'start'); }),
    play: () => {
      cards.forEach((c, i) => {
        const at = i * STEP;
        timers.push(setTimeout(() => { void c.fig.offsetWidth; set(c, 'run'); c.hooks.play(); }, at));
        timers.push(setTimeout(() => { c.hooks.finish(); set(c, 'end'); }, at + LENGTH));
      });
      return (cards.length - 1) * STEP + LENGTH;
    },
  });
}

function card(fig, locale) {
  const n = fig.querySelector('.sig__n');
  const lead = fig.querySelector('.mscene__lead');
  const fmt = new Intl.NumberFormat(locale);
  // Logik worries while it is broken (Lösung on card 3 thinks), then is calm (Lösung happy).
  const worried = lead?.dataset.base === 'joy' ? 'think' : 'wow';
  let timers = [];
  let raf = 0;
  const clear = () => { timers.forEach(clearTimeout); timers = []; cancelAnimationFrame(raf); };
  const count = (from, to, ms) => {
    if (!n) return;
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / ms);
      n.textContent = fmt.format(Math.round(from + (to - from) * k));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  };
  const reset = () => {
    clear();
    if (n) n.textContent = '0';
    if (lead) setPose(lead, worried);
  };
  const finish = () => {
    clear();
    if (n) n.textContent = '47';
    if (lead) setPose(lead, lead.dataset.base);
  };
  const play = () => {
    count(0, 45, 1600);
    timers.push(setTimeout(() => count(45, 47, 500), 1900));
    timers.push(setTimeout(() => { if (lead) setPose(lead, lead.dataset.base); }, CALM_AT));
    return LENGTH;
  };
  return { fig, hooks: { reset, finish, play, frame: (i) => (i ? finish() : (reset(), n && (n.textContent = '45'))) } };
}
