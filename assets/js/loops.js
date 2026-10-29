// Stage 6c: one controller for every demo (hero line, problem cards, price pictures, process steps,
// tool row, KI demo, 404 scene). Iva's rule (29.10.2026): a demo loops calmly while it is visible.
// - The HTML shows the end frame (solved), for no JS and reduced motion.
// - Visible enough (a third of it, or a third of the window for tall ones): it plays from its start
//   frame, rests on its end frame for a moment and plays again, for as long as it stays visible.
// - One focus at a time: only the most visible demo loops; the others hold their start frame.
// - Off-screen or hidden tab: it stops and goes back to its start frame, so the next entry plays
//   forward again (never «solved», then a jump back to «broken»).
// - Every looping demo has a pause button (WCAG 2.2.2, 44 px, «Pause» / «Abspielen»); a paused
//   demo shows its end frame and stays paused for the visit (sessionStorage).
// - Reduced motion: no autoplay, the end frame; the button steps through the frames.
// The demo element carries data-play="start|run|end" for the CSS; without it the CSS shows the end.
// Why Stage 6b looked dead: a demo already on screen when its module loaded was set to its end
// frame and re-armed only after leaving the screen completely, and every demo stopped after two plays.
export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const all = [];
let io = null;
const SHARE = 1 / 3;

const store = {
  get: (k) => { try { return sessionStorage.getItem(`demo-paused:${k}`) === '1'; } catch { return false; } },
  set: (k, v) => { try { sessionStorage.setItem(`demo-paused:${k}`, v ? '1' : '0'); } catch { /* not kept */ } },
};

function observer() {
  if (io) return io;
  io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const d = all.find((x) => x.el === e.target);
      if (!d) continue;
      d.seen = e.isIntersecting ? e.intersectionRect.height : 0;
      d.enough = e.isIntersecting && (e.intersectionRatio >= SHARE || e.intersectionRect.height >= SHARE * innerHeight);
    }
    decide();
  }, { threshold: Array.from({ length: 21 }, (_, i) => i / 20) });
  document.addEventListener('visibilitychange', decide);
  reduceMotion.addEventListener('change', () => { all.forEach((d) => { if (d.looping) stop(d, 'end'); paint(d); }); decide(); });
  return io;
}

const set = (d, phase) => { d.phase = phase; d.el.dataset.play = phase; d.hooks.state?.(phase); };

// The most visible free demo loops; every other one holds its start frame (its end, when paused).
// Ambient ones (the tool marquee) run whenever they are visible and never take the focus.
function decide() {
  const can = (d) => d.auto && d.enough && !d.paused && !document.hidden && !reduceMotion.matches;
  for (const d of all.filter((x) => x.ambient)) {
    if (can(d)) { if (!d.looping) { d.looping = true; cycle(d); } } else if (d.looping) stop(d, d.paused ? 'end' : 'start');
  }
  const free = all.filter((d) => !d.ambient && can(d));
  const best = free.sort((a, b) => b.seen - a.seen)[0];
  for (const d of all) {
    if (!d.auto || d.ambient) continue;
    if (d === best) { if (!d.looping) { d.looping = true; cycle(d); } continue; }
    if (d.looping) stop(d, d.paused || reduceMotion.matches ? 'end' : 'start');
    else if (!d.paused && !reduceMotion.matches && d.phase !== 'start') { d.hooks.reset(); set(d, 'start'); }
  }
}

function cycle(d) {
  clearTimeout(d.timer);
  d.hooks.reset();
  set(d, 'start');
  void d.el.offsetWidth; // a reflow, so the CSS animations of «run» start again from 0
  set(d, 'run');
  d.el.dispatchEvent(new CustomEvent('demo:run'));
  const ms = d.hooks.play() ?? d.duration;
  d.timer = setTimeout(() => {
    d.hooks.finish();
    set(d, 'end');
    d.timer = setTimeout(() => { if (d.looping) cycle(d); }, d.rest);
  }, ms);
}

function stop(d, frame) {
  d.looping = false;
  clearTimeout(d.timer);
  if (frame === 'end') { d.hooks.finish(); set(d, 'end'); } else { d.hooks.reset(); set(d, 'start'); }
}

// The pause button: icon and label follow the state; under reduced motion it steps the frames.
function paint(d) {
  const b = d.button;
  if (!b) return;
  b.hidden = false;
  const mode = reduceMotion.matches ? 'step' : d.paused ? 'play' : 'pause';
  b.dataset.mode = mode;
  b.querySelector('.loopctl__text').textContent = b.dataset[`${mode}Label`];
  if (mode === 'step') b.removeAttribute('aria-pressed'); else b.setAttribute('aria-pressed', String(mode === 'play'));
}

// el: the demo root. hooks: reset() start frame, play() starts it and returns its length in ms,
// finish() end frame, frame(i) for reduced motion (0 = start ... frames - 1 = end), state(phase).
// rest: ms on the end frame before the next round. loadMs: it already plays from CSS on load (hero,
// 404); the loop takes over after that. button: its pause button (or null). manual: never autoplays
// (a card inside a group that loops as a chain).
// ambient: runs whenever visible, outside the one-focus rule.
export function demo(el, { reset = () => {}, play = () => {}, finish = () => {}, frame, state, frames = 2, duration = 3000, rest = 2500, loadMs = 0, button = null, manual = false, ambient = false, key = el?.dataset.demo }) {
  if (!el) return null;
  const d = { el, key, hooks: { reset, play, finish, state }, button, auto: !manual, ambient, phase: 'end', looping: false, enough: false, seen: 0, timer: 0, duration, rest, frames, step: frames - 1, paused: Boolean(key) && store.get(key) };
  // For the demo's own controls: skip to the end of this round, or start a round now.
  d.skip = () => {
    if (d.phase !== 'run') return;
    clearTimeout(d.timer);
    finish();
    set(d, 'end');
    if (d.looping) d.timer = setTimeout(() => { if (d.looping) cycle(d); }, d.rest);
  };
  d.replay = () => { if (reduceMotion.matches || d.paused) { finish(); set(d, 'end'); } else if (d.looping) cycle(d); else decide(); };
  all.push(d);
  if (button) {
    paint(d);
    button.addEventListener('click', () => {
      if (reduceMotion.matches) {
        d.step = (d.step + 1) % frames;
        if (frame) frame(d.step); else if (d.step === frames - 1) finish(); else reset();
        el.dataset.play = d.step === frames - 1 ? 'end' : 'start';
        return;
      }
      d.paused = !d.paused;
      if (key) store.set(key, d.paused);
      paint(d);
      if (d.paused) stop(d, 'end');
      decide();
    });
  }
  if (reduceMotion.matches || !('IntersectionObserver' in window) || manual) return d;
  if (d.paused) set(d, 'end');
  else if (loadMs > 0) {
    // Leave the CSS alone while it plays on load, rest on its end frame, then the loop decides.
    d.auto = false;
    d.timer = setTimeout(() => { set(d, 'end'); d.timer = setTimeout(() => { d.auto = true; decide(); }, rest); }, loadMs);
  } else {
    reset();
    set(d, 'start');
  }
  observer().observe(el);
  return d;
}
