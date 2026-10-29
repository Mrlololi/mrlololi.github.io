// Stage 6, «Wo es meistens hakt»: each problem card plays «broken, then solved» (about 3.6 s) and
// ends looking solved. The CSS draws the frames by data-play (start = broken, run = the film,
// end = solved); this file counts the sign-ups and turns the lead mascot from worried to calm.
// Stage 6b: where the three stand in one row (1100 px and up) they play as one chain, one card
// after the other with 1.5 s between, once per entry of the section (at most twice per visit),
// then rest; each card's button replays that card alone. Stacked (phones), each card plays on
// its own entry. loops.js decides when.
import { demo } from './loops.js';
import { setPose } from './mascots.js';

const LENGTH = 3600;
const PAUSE = 1500;
const CALM_AT = 2100;

export function init({ locale }) {
  const figs = [...document.querySelectorAll('.fixdemo')];
  const cards = figs.map((fig) => card(fig, locale));
  const row = matchMedia('(min-width: 1100px)').matches;
  if (!row) {
    cards.forEach((c) => demo(c.fig, c.hooks));
    return;
  }
  // One row: the cards keep their own buttons (manual), the list plays the chain.
  cards.forEach((c) => demo(c.fig, { ...c.hooks, manual: true }));
  let timers = [];
  const set = (c, phase) => { c.fig.dataset.play = phase; };
  demo(document.querySelector('.pcs'), {
    button: false,
    reset: () => { timers.forEach(clearTimeout); timers = []; cards.forEach((c) => { c.hooks.reset(); set(c, 'start'); }); },
    finish: () => { timers.forEach(clearTimeout); timers = []; cards.forEach((c) => { c.hooks.finish(); set(c, 'end'); }); },
    play: () => {
      cards.forEach((c, i) => {
        const at = i * (LENGTH + PAUSE);
        timers.push(setTimeout(() => { void c.fig.offsetWidth; set(c, 'run'); c.hooks.play(); }, at));
        timers.push(setTimeout(() => { c.hooks.finish(); set(c, 'end'); }, at + LENGTH));
      });
      return cards.length * LENGTH + (cards.length - 1) * PAUSE;
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
