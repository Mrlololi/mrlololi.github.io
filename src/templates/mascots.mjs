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

export function heroMascots(t) {
  return HERO.map(({ i, node, emo }) => {
    const m = MASCOTS[i];
    return `<span class="mascot-spot mascot-spot--${m.key}" data-node="${node}">${mascotSvg(i, emo, `class="mascot" data-base="${emo}" aria-hidden="true" focusable="false"`)}<button class="mascot-btn" type="button" aria-label="${esc(fill(t.brand.mascotJump, { name: m.name }))}"></button></span>`;
  }).join('');
}

// Footer (home pages only): all three wave next to the dark lockup. Decorative.
export function footerMascots() {
  return `<span class="footer-mascots" aria-hidden="true">${MASCOTS.map((m, i) => mascotSvg(i, 'wave', `class="mascot mascot--on-dark" data-base="wave" focusable="false"`)).join('')}</span>`;
}
