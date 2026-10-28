// Shared controller for looping demos (Stage 2). A loop runs only while motion is allowed,
// its element is on screen (IntersectionObserver) and the visitor has not paused it with
// its button. Without this file nothing loops at all.
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

export function loop({ root, button, play, pause, when = () => true, threshold = 0.15 }) {
  if (!root || reduceMotion.matches) return null;
  let visible = false;
  let paused = false;
  let running = false;
  const sync = () => {
    const should = visible && !paused && !document.hidden && !reduceMotion.matches && when();
    if (should === running) return;
    running = should;
    (should ? play : pause)();
  };
  if (button) {
    button.hidden = false;
    button.addEventListener('click', () => {
      paused = !paused;
      const label = paused ? button.dataset.play : button.dataset.pause;
      button.setAttribute('aria-label', label);
      button.querySelector('.loop-btn__tip').textContent = label;
      button.classList.toggle('is-paused', paused);
      sync();
    });
  }
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold }).observe(root);
  document.addEventListener('visibilitychange', sync);
  // Reduced motion switched on while the page is open: stop and hide the button (and back).
  reduceMotion.addEventListener('change', () => { if (button) button.hidden = reduceMotion.matches; sync(); });
  return { sync, get running() { return running; } };
}

// Stage 4: a demo that restarts every time it comes into view (onEnter / onEnterBack) and stops
// when it leaves. Never under reduced motion (then the HTML's final state simply stays).
export function scene(el, { enter, leave = () => {}, threshold = 0.35 }) {
  if (!el || reduceMotion.matches || !('IntersectionObserver' in window)) return null;
  let inView = false;
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting === inView) return;
    inView = e.isIntersecting;
    if (inView && !document.hidden) enter();
    else if (!inView) leave();
  }, { threshold }).observe(el);
  return { get inView() { return inView; } };
}
