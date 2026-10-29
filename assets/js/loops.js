// Stage 6: one controller for every demo (hero line, problem cards, KI demo, 404 scene).
// - The HTML shows the end frame (solved), for no JS and reduced motion.
// - A demo is reset to its start frame only while it is completely off-screen, so on entry it only
//   plays forward (never «solved», then a jump back to «broken»).
// - It plays once it has been visible enough (half its height, or half the window for tall demos)
//   for 0.6 s; again on re-entry after it left the screen completely; at most two automatic plays
//   per demo and visit, then only on its button.
// - One scene at a time: one shared IntersectionObserver; only the demo with the highest visible
//   ratio plays, the others hold their start or end frame. A hidden tab ends every running demo.
// - Reduced motion: no autoplay, the end frame; the button steps through the frames one by one.
// The demo element carries data-play="start|run|end" for the CSS; without it the CSS shows the end.
export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const DWELL = 600;
const MAX_AUTO = 2;
const all = [];
let io = null;

const enough = (e) => e.isIntersecting && (e.intersectionRatio >= 0.5 || e.intersectionRect.height >= 0.5 * innerHeight);
const offScreen = (el) => {
  const r = el.getBoundingClientRect();
  return r.bottom <= 0 || r.top >= innerHeight;
};

function observer() {
  if (io) return io;
  const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);
  io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const d = all.find((x) => x.el === e.target);
      if (!d) continue;
      d.ratio = e.isIntersecting ? e.intersectionRatio : 0;
      d.enough = enough(e);
      if (!e.isIntersecting) left(d);
    }
    all.forEach(arm);
  }, { threshold: thresholds });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) all.filter((d) => d.phase === 'run').forEach((d) => end(d));
    else all.forEach(arm);
  });
  reduceMotion.addEventListener('change', () => all.forEach((d) => { if (reduceMotion.matches) end(d); }));
  return io;
}

function set(d, phase) {
  d.phase = phase;
  d.el.dataset.play = phase;
  if (phase === 'end' && d.button) d.button.hidden = false;
}

// Completely off-screen: a running demo ends; one with autoplays left goes back to its start frame.
function left(d) {
  clearTimeout(d.dwell); d.dwell = 0;
  if (d.phase === 'load') return;
  if (d.phase === 'run') end(d);
  if (!reduceMotion.matches && d.auto < MAX_AUTO && d.phase !== 'start') { d.hooks.reset(); set(d, 'start'); }
}

// Waits 0.6 s of «visible enough», then plays if this demo is the most visible one.
function arm(d) {
  if (d.phase !== 'start' || !d.enough || d.dwell || document.hidden || reduceMotion.matches) return;
  d.dwell = setTimeout(() => {
    d.dwell = 0;
    if (d.phase !== 'start' || !d.enough || document.hidden) return;
    // The most visible of the demos still waiting (one that has played holds its end frame).
    const best = all.filter((x) => x.enough && x.phase === 'start').sort((a, b) => b.ratio - a.ratio)[0];
    if (best !== d || all.some((x) => x.phase === 'run')) return;
    d.auto += 1;
    run(d);
  }, DWELL);
}

function run(d) {
  all.filter((x) => x !== d && x.phase === 'run').forEach((x) => end(x));
  clearTimeout(d.timer);
  d.hooks.reset();
  set(d, 'start');
  void d.el.offsetWidth; // a reflow, so the CSS animations of «run» start again from 0
  set(d, 'run');
  d.el.dispatchEvent(new CustomEvent('demo:run'));
  const ms = d.hooks.play() ?? d.duration;
  d.timer = setTimeout(() => end(d), ms);
}

function end(d) {
  clearTimeout(d.timer);
  d.hooks.finish();
  set(d, 'end');
  d.step = d.frames - 1;
  all.forEach(arm);
}

// el: the demo root. hooks: reset() start frame, play() starts it and returns its length in ms,
// finish() end frame, frame(i) for reduced motion (0 = start ... frames - 1 = end).
// loadMs: the demo already plays from CSS on load (hero, 404); that counts as its first play.
// manual: only its button plays it (a card inside a group that plays as a chain, Stage 6b).
// button: false for a group without a button of its own.
export function demo(el, { reset = () => {}, play = () => {}, finish = () => {}, frame, frames = 2, duration = 3000, loadMs = 0, manual = false, button: own = true }) {
  if (!el) return null;
  const button = own ? el.querySelector(':scope .replay') : null;
  const d = { el, hooks: { reset, play, finish }, button, phase: 'end', auto: 0, ratio: 0, enough: false, dwell: 0, timer: 0, duration, frames, step: frames - 1 };
  // For the demo's own controls: skip to the end (a tap on the picture), play again (a new example).
  d.skip = () => { if (d.phase === 'run') end(d); };
  d.replay = () => { if (reduceMotion.matches) { finish(); set(d, 'end'); } else run(d); };
  all.push(d);
  const stepTo = (i) => {
    d.step = i;
    if (frame) frame(i);
    else if (i === frames - 1) finish(); else reset();
    el.dataset.play = i === frames - 1 ? 'end' : 'start';
  };
  if (button) {
    button.addEventListener('click', () => {
      if (reduceMotion.matches) { stepTo((d.step + 1) % frames); return; }
      run(d);
    });
  }
  if (manual || reduceMotion.matches || !('IntersectionObserver' in window)) {
    if (button) button.hidden = false;
    return d;
  }
  if (loadMs > 0) {
    // Leave the CSS alone while it plays; then the same end frame, now under this controller.
    d.phase = 'load';
    d.auto = 1;
    d.timer = setTimeout(() => {
      set(d, 'end');
      if (offScreen(el)) left(d);
      all.forEach(arm);
    }, loadMs);
  } else if (offScreen(el)) {
    reset();
    set(d, 'start');
  } else {
    set(d, 'end');
  }
  observer().observe(el);
  return d;
}
