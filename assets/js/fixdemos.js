// Stage 4, «Wo es meistens hakt»: each problem card plays «broken, then fixed» (about 5 s).
// The HTML shows the fixed state. CSS animates by data-state (broken -> fixing -> fixed); this
// file only switches the states, counts the sign-ups and wires «Lösung ansehen». It plays on every
// entry and on the button; under reduced motion the button switches the two states instantly.
import { scene } from './loops.js';

const BROKEN = 2600;
const FIXING = 2400;

export function init({ reduceMotion, locale }) {
  for (const fig of document.querySelectorAll('.fixdemo')) setup(fig, reduceMotion, locale);
}

function setup(fig, reduceMotion, locale) {
  const button = fig.querySelector('.fixdemo__play');
  const label = button.textContent;
  const n = fig.querySelector('.sig__n');
  const fmt = new Intl.NumberFormat(locale);
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
  const state = (s) => {
    // Through «idle» and a reflow, so the CSS animations of that state start again from 0.
    fig.dataset.state = 'idle';
    void fig.offsetWidth;
    fig.dataset.state = s;
  };
  const finish = () => { clear(); fig.dataset.state = 'fixed'; if (n) n.textContent = '47'; };
  const play = () => {
    clear();
    state('broken');
    count(0, 45, BROKEN - 400);
    timers.push(setTimeout(() => { state('fixing'); count(45, 47, FIXING - 600); }, BROKEN));
    timers.push(setTimeout(finish, BROKEN + FIXING));
  };

  button.addEventListener('click', () => {
    if (reduceMotion.matches) {
      // No motion: «Lösung ansehen» shows the broken state first, the next click the fix.
      const broken = fig.dataset.state !== 'broken';
      fig.dataset.state = broken ? 'broken' : 'fixed';
      if (n) n.textContent = broken ? '45' : '47';
      button.textContent = broken ? label : button.dataset.again;
      return;
    }
    play();
    button.textContent = button.dataset.again;
  });
  scene(fig, { enter: play, leave: finish });
  reduceMotion.addEventListener('change', () => { if (reduceMotion.matches) finish(); });
}
