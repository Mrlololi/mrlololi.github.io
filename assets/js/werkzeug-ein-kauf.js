// Werkzeug «Ein Kauf» (docs/PROMPT_Werkzeug_Ein_Kauf_2026-11-13.md): one step of the purchase off at a time.
// Default on load: «zugang», or the step in the hash (/werkzeuge/ein-kauf/#zahlung). The run-log marks the
// break (cross icon AND «fehlt») and the later steps that do not happen («kommt nicht an»); the panel of
// the step shows next to it. «Zurücksetzen» restores the intact run. On a switch Logik makes one
// «Prüfblick», on «Zurücksetzen» Live one joy hop (kit; paused or reduced motion: only the face).
// Without this file the page shows the intact run-log and all six panels in order.
import { react, jump } from './kit/mascot-react.js';

const root = document.querySelector('.rl--kauf');
const tool = root?.closest('.ek-tool');
if (tool) init();

function init() {
  const switches = [...tool.querySelectorAll('.ek-switch')];
  const ids = switches.map((b) => b.dataset.step);
  const panels = new Map([...tool.querySelectorAll('.ek-panel')].map((p) => [p.id || '', p]));
  const nodes = [...root.querySelectorAll('.rl__node')];
  const logs = [...root.querySelectorAll('.rl__log')];
  const steps = [...root.querySelectorAll('.rl__step')];
  const summary = root.querySelector('.rl__summary');
  const logik = tool.querySelector('.ek-logik svg.mascot');
  const live = root.querySelector('.rl__live svg.mascot');
  const total = ids.length;
  let off = null;

  const set = (id, { moved = true } = {}) => {
    off = id;
    const i = id ? ids.indexOf(id) : -1;
    const missing = id ? (switches[i].dataset.missing || '').split(' ').filter(Boolean) : [];
    switches.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.step === id)));
    nodes.forEach((n, k) => {
      const lost = ids[k] === id || missing.includes(ids[k]);
      n.classList.toggle('is-done', !lost);
      n.classList.toggle('is-off', ids[k] === id);
      n.classList.toggle('is-missing', missing.includes(ids[k]));
    });
    logs.forEach((l, k) => {
      const lost = ids[k] === id || missing.includes(ids[k]);
      l.classList.toggle('is-on', !lost);
      l.classList.toggle('is-off', ids[k] === id);
      l.classList.toggle('is-missing', missing.includes(ids[k]));
    });
    // The picture card of the step that is off (or the last one when the run is intact).
    const cur = i >= 0 ? i : total - 1;
    steps.forEach((s, k) => { s.classList.toggle('is-current', k === cur); s.classList.toggle('is-done', k < cur); });
    root.dataset.step = String(cur);
    const count = root.querySelector('.rl__count');
    if (count) count.textContent = root.dataset.stepOf.replace('{n}', String(cur + 1)).replace('{total}', String(total));
    if (id) root.dataset.off = id; else delete root.dataset.off;
    root.classList.toggle('is-broken', Boolean(id));
    summary.textContent = id ? summary.dataset.off : summary.dataset.intact;
    panels.forEach((p, key) => p.classList.toggle('is-active', id ? key === id : p.classList.contains('ek-panel--intact')));
    if (moved) history.replaceState(null, '', id ? `#${id}` : location.pathname + location.search);
  };

  switches.forEach((b) => b.addEventListener('click', () => {
    const id = b.dataset.step;
    if (off === id) return;
    set(id);
    if (logik) react(logik, 18);
  }));
  tool.querySelector('.ek-reset').addEventListener('click', () => {
    if (!off) return;
    set(null);
    if (live) jump(live, 18);
  });
  addEventListener('hashchange', () => { const h = location.hash.slice(1); if (ids.includes(h)) set(h, { moved: false }); });

  const h = location.hash.slice(1);
  set(ids.includes(h) ? h : 'zugang', { moved: false });
  document.documentElement.classList.add('ek-ready');
}
