import { esc, fill } from './util.mjs';
import { MASCOTS, mascotSvg } from '../../assets/js/mascot-art.js';

// Hero: each mascot stands next to its flow node and hops when the pulse lights that node
// (assets/js/mascots.js). A transparent button over each makes it jump; like the node buttons it
// is there only with JS (without JS the mascots are just pictures). Poses are the approved scene:
// Logik thinks at «Formular», Lösung waits at «ActiveCampaign», Live is happy at «Kurs offen».
const HERO = [
  { i: 0, node: 1, emo: 'think' },
  { i: 1, node: 2, emo: 'idle' },
  { i: 2, node: 4, emo: 'joy' },
];

// node: only the mascot next to that flow node (the hero puts each right after its node button,
// so the Tab order follows the picture top to bottom).
export function heroMascots(t, node) {
  return HERO.filter((h) => node == null || h.node === node).map(({ i, node, emo }) => {
    const m = MASCOTS[i];
    return `<span class="mascot-spot mascot-spot--${m.key}" data-node="${node}" data-scene="hero">${mascotSvg(i, emo, `class="mascot" data-base="${emo}" aria-hidden="true" focusable="false"`)}<button class="mascot-btn" type="button" aria-label="${esc(fill(t.brand.mascotJump, { name: m.name }))}"></button></span>`;
  }).join('');
}

// Footer (home pages only): all three wave next to the dark lockup. Decorative.
export function footerMascots() {
  return `<span class="footer-mascots" aria-hidden="true">${MASCOTS.map((m, i) => mascotSvg(i, 'wave', `class="mascot mascot--on-dark" data-base="wave" focusable="false"`)).join('')}</span>`;
}

// Stage 4 scenes (8 more places on the home page): small decorative groups next to content. The
// section's module moves them (2-4 s, transform and opacity only); without it they stand in pose.
// members: [[mascot index, emotion, extra class]]. The suffix keeps every belly clipPath id unique.
export function mascotScene(scene, members, cls = '', suffix = scene) {
  const svgs = members.map(([i, emo, extra = '']) => mascotSvg(i, emo, `class="mascot mascot--${MASCOTS[i].key}${extra ? ` ${extra}` : ''}" data-base="${emo}" focusable="false"`, `-${suffix}`));
  return `<span class="mscene mscene--${scene}${cls ? ` ${cls}` : ''}" data-scene="${scene}" aria-hidden="true">${svgs.join('')}</span>`;
}
