import { esc, fill } from './util.mjs';
import { MASCOTS, mascotSvg } from '../../assets/js/kit/mascot-art.js';

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

// Footer: all three wave next to the dark lockup (home) or in a slim row (every other page, Stage 7a).
// With JS the group is one button (assets/js/kit/mascot-react.js).
export function footerMascots() {
  return `<span class="footer-mascots" data-say="footer" aria-hidden="true">${MASCOTS.map((m, i) => mascotSvg(i, 'wave', `class="mascot mascot--on-dark" data-base="wave" focusable="false"`)).join('')}</span>`;
}

// R7 (25.11.2026): small quiet row of the three mascots on phones (<800 px) in the first screen of the
// home page (DE and EN). Same figures as the footer trio, static on load, silent reaction on tap/Enter.
export function heroTrio() {
  return `<span class="mscene hero__trio" data-scene="hero-trio" aria-hidden="true">${MASCOTS.map((m, i) => mascotSvg(i, 'wave', 'class="mascot" data-base="wave" focusable="false"', '-ht')).join('')}</span>`;
}

// Stage 4 scenes (8 more places on the home page): small decorative groups next to content. The
// section's module moves them (2-4 s, transform and opacity only); without it they stand in pose.
// members: [[mascot index, emotion, extra class]]. The suffix keeps every belly clipPath id unique.
// say (Stage 7a): the group speaks these lines (t.brand.lines[say]) instead of each mascot's own.
export function mascotScene(scene, members, cls = '', suffix = scene, say = '') {
  const svgs = members.map(([i, emo, extra = '']) => mascotSvg(i, emo, `class="mascot mascot--${MASCOTS[i].key}${extra ? ` ${extra}` : ''}" data-base="${emo}" focusable="false"`, `-${suffix}`));
  return `<span class="mscene mscene--${scene}${cls ? ` ${cls}` : ''}" data-scene="${scene}"${say ? ` data-say="${say}"` : ''} aria-hidden="true">${svgs.join('')}</span>`;
}
