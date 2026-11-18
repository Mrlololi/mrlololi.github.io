// Stage 6, 404: the scene plays once from CSS on load (Logik looks at the broken line, Lösung walks
// in and snaps it together, Live waves), then rests; loops.js takes it over afterwards (end frame,
// «Nochmal» never needed: it is short). Hovering or focusing a link card sends one pulse along
// the repaired line. Reduced motion: the repaired still picture, no pulse.
import { demo } from './kit/motion.js';

export function init({ reduceMotion }) {
  const scene = document.querySelector('.nf__scene');
  if (!scene) return;
  // Rule 7 (18.11.2026): the round lasts until Live's wave has ended (1.9 s + 2 x 0.5 s), so it is never cut off.
  demo(scene, { duration: 3000, rest: 3000, loadMs: Math.max(0, 3000 - performance.now()), tap: false });
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
