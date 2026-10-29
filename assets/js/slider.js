// Stage 6e, «Chaos / Geordnet»: the divider follows a drag on the picture (mouse, pen, finger; a
// vertical swipe still scrolls the page) and the range below it (arrow keys, Home, End). p (0-100)
// is the share of «Geordnet»: the mask moves by p - 100 %, its inner layer back by the same amount,
// the divider by p % (transforms only). No loop: on the first entry the handle nudges once, about
// 12 px left and back, so people see it can be dragged. Reduced motion: no nudge.
export function init({ reduceMotion }) {
  const fig = document.querySelector('.ba');
  if (!fig) return;
  const stage = fig.querySelector('.ba__stage');
  const mask = fig.querySelector('.ba__mask');
  const inner = fig.querySelector('.ba__inner');
  const track = fig.querySelector('.ba__track');
  const range = fig.querySelector('.ba__range');
  const set = (p, fromRange = false) => {
    mask.style.transform = `translateX(${p - 100}%)`;
    inner.style.transform = `translateX(${100 - p}%)`;
    track.style.transform = `translateX(${p}%)`;
    const v = Math.round(p);
    if (!fromRange) range.value = String(v);
    range.setAttribute('aria-valuenow', String(Math.round(Number(range.value))));
    range.setAttribute('aria-valuetext', range.dataset.valuetext.replace('{v}', String(100 - v)));
  };
  fig.classList.add('is-ready');
  range.addEventListener('input', () => set(Number(range.value), true));
  set(Number(range.value));
  let dragging = false;
  const fromPointer = (e) => {
    const r = stage.getBoundingClientRect();
    set(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)));
  };
  stage.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    dragging = true;
    stage.setPointerCapture(e.pointerId);
    fromPointer(e);
  });
  stage.addEventListener('pointermove', (e) => { if (dragging) fromPointer(e); });
  const stop = () => { dragging = false; };
  stage.addEventListener('pointerup', stop);
  stage.addEventListener('pointercancel', stop);

  if (reduceMotion.matches || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting || e.intersectionRatio < 0.6) return;
    io.disconnect();
    const start = Number(range.value);
    const dp = (12 / stage.clientWidth) * 100;
    const t0 = performance.now();
    const step = (now) => {
      if (dragging) return;
      const k = Math.min(1, (now - t0) / 700);
      set(start - dp * Math.sin(k * Math.PI));
      if (k < 1) requestAnimationFrame(step); else set(start);
    };
    setTimeout(() => requestAnimationFrame(step), 400);
  }, { threshold: [0, 0.6, 1] });
  io.observe(stage);
}
