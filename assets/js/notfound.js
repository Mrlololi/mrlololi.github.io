// Stage 6, 404: the scene plays once from CSS on load (Logik looks at the broken line, Lösung walks
// in and snaps it together, Live waves), then rests; loops.js takes it over afterwards (end frame,
// «Nochmal» never needed: it is short). Hovering or focusing a link card sends one pulse along
// the repaired line. Reduced motion: the repaired still picture, no pulse.
import { demo } from './loops.js';

export function init({ reduceMotion }) {
  const scene = document.querySelector('.nf__scene');
  if (!scene) return;
  demo(scene, { duration: 2800, rest: 3500, loadMs: Math.max(0, 2800 - performance.now()), button: document.querySelector('.nf__ctl .loopctl') });
  if (reduceMotion.matches) return;
  const pulse = scene.querySelector('.nf__pulse');
  let last = 0;
  const send = () => {
    // One pulse at a time; a new card restarts it.
    if (performance.now() - last < 120) return;
    last = performance.now();
    pulse.classList.remove('is-on');
    void pulse.getBoundingClientRect();
    pulse.classList.add('is-on');
  };
  for (const card of document.querySelectorAll('.nf__card')) {
    card.addEventListener('pointerenter', send);
    card.addEventListener('focus', send);
  }
}
