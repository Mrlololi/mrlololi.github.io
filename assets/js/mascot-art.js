// The three mascots Logik, Lösung, Live (Identity 21.10.2026) as inline SVG strings.
// Used by the build (src/templates/mascots.mjs) and in the browser (mascots.js swaps a pose).
// 100 grid, «leichtes Volumen»: flat pastel ball, soft white highlight, soft shade arc.
// Named groups (legs, body, eyes, mouth, accessory, arms) so GSAP can move the parts; an
// emotion only swaps eyes, mouth, arms and the accessory. Class "o": strokes that sit on the
// background (they turn light on the dark footer).
const INK = '#2B2A33';
const PEACH = '#F7DCC8';
export const MASCOTS = [
  { key: 'logik', name: 'Logik', fill: '#F4C9D3', ink: '#9C3F58' },
  { key: 'loesung', name: 'Lösung', fill: '#BFD8EE', ink: '#2F6A9E' },
  { key: 'live', name: 'Live', fill: '#CFE3C2', ink: '#3F6B31' },
];
export const EMOTIONS = ['idle', 'think', 'wow', 'joy', 'wave'];

const line = (d, w = 3.4, cls = '') => `<path${cls ? ` class="${cls}"` : ''} d="${d}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const face = (emo) => (emo === 'wave' ? 'idle' : emo);

const EYES = {
  idle: `<ellipse class="m-eye" cx="38" cy="58" rx="4.2" ry="5.8" fill="${INK}"/><ellipse class="m-eye" cx="62" cy="58" rx="4.2" ry="5.8" fill="${INK}"/>`,
  think: `<circle class="m-eye" cx="40" cy="60" r="3.8" fill="${INK}"/><circle class="m-eye" cx="62" cy="58" r="3.8" fill="${INK}"/>${line('M56 47l11-4', 3)}`,
  wow: `<g fill="#fff" stroke="${INK}" stroke-width="2.5"><circle cx="38" cy="56" r="8.5"/><circle cx="62" cy="56" r="8.5"/></g><circle cx="38" cy="57" r="4" fill="${INK}"/><circle cx="62" cy="57" r="4" fill="${INK}"/>`,
  joy: line('M32 59q6-7 12 0M56 59q6-7 12 0'),
};
const MOUTH = {
  idle: line('M42 72q8 7 16 0', 3.2),
  think: line('M44 74q6-2 12 1', 3.2),
  wow: `<ellipse cx="50" cy="75" rx="4.5" ry="5.5" fill="${INK}"/>`,
  joy: `<path d="M41 70q9 13 18 0z" fill="${INK}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/><path d="M45.5 75.5q4.5 3.5 9 0q-4.5-2-9 0z" fill="#E8838F"/>`,
};
// Each arm: stick path and the round hand at its end (in the ball's colour).
const ARMS = {
  idle: [['M14 66q-8 6-7 15', 7, 83], ['M86 66q8 6 7 15', 93, 83]],
  think: [['M14 66q-8 6-7 15', 7, 83], ['M86 70q10 4 2 12q-6 4-16 2', 72, 84]],
  wow: [['M13 62q-10-2-11-13', 2, 47], ['M87 62q10-2 11-13', 98, 47]],
  joy: [['M15 54q-10-8-8-23', 7, 29], ['M85 54q10-8 8-23', 93, 29]],
  wave: [['M14 66q-8 6-7 15', 7, 83]],
};
// Lösung's wrench, held in a hand: [x, y, rotation]; the left hand whenever the right one is busy.
const WRENCH_AT = { idle: [93, 80, 28], think: [7, 80, -28], wow: [98, 45, 18], joy: [93, 27, 12], wave: [7, 80, -28] };

const hand = (x, y, fill, r = 4.2) => `<circle class="o" cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${INK}" stroke-width="2.4"/>`;

function arms(emo, fill) {
  let out = ARMS[emo].map(([d, x, y]) => line(d, 3.4, 'o') + hand(x, y, fill)).join('');
  // Waving: the raised right arm turns around its shoulder (86 64), see mascots.js.
  if (emo === 'wave') out += `<g class="m-wave">${line('M86 64q12-4 11-24', 3.4, 'o')}${hand(97, 38, fill, 4.6)}</g>`;
  return out;
}

function wrench(x, y, rot) {
  // Handle plus an open jaw (a C-shaped head), white with an ink outline.
  return `<g transform="translate(${x} ${y}) rotate(${rot})" fill="#fff" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"><rect x="-3" y="-24" width="6" height="22" rx="3"/><path d="M-3-22l-4.5-5a8 8 0 0 1 3.5-10l1.8 6h4.4l1.8-6a8 8 0 0 1 3.5 10l-4.5 5z"/></g>`;
}

function accessory(i, emo) {
  const e = face(emo);
  if (i === 0) {
    // Logik's round glasses, in every emotion (a little bigger around the «wow» eyes).
    const r = e === 'wow' ? 11 : 10;
    return `<g fill="none" stroke="${INK}" stroke-width="2.6"><circle cx="38" cy="57" r="${r}"/><circle cx="62" cy="57" r="${r}"/><path d="M${38 + r} 57h${24 - 2 * r}"/></g>`;
  }
  if (i === 1) return wrench(...WRENCH_AT[emo]);
  // Live: a small star antenna in peach; sparks when happy.
  return `${line('M50 22V9', 3, 'o')}<path class="o" d="M50 2l2.5 5 5.5.8-4 3.8 1 5.4L50 14.4 45 17l1-5.4-4-3.8 5.5-.8z" fill="${PEACH}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>${e === 'joy' ? line('M38 8l-5-4M62 8l5-4', 2.4, 'o') : ''}`;
}

// The swappable parts of one pose.
export function parts(i, emo) {
  const m = MASCOTS[i];
  const e = face(emo);
  return { eyes: EYES[e], mouth: MOUTH[e], accessory: accessory(i, emo), arms: arms(emo, m.fill) };
}

const group = (name, body) => `<g data-part="${name}">${body}</g>`;

// One mascot. attrs: extra attributes for the <svg> (class, aria-hidden, ...), as a string.
export function mascotSvg(i, emo = 'idle', attrs = '') {
  const m = MASCOTS[i];
  const p = parts(i, emo);
  const legs = `${line('M40 96v10M60 96v10', 3.4, 'o')}${line('M34 107h10M56 107h10', 4, 'o')}`;
  const body = `<circle class="o" cx="50" cy="60" r="38" fill="${m.fill}" stroke="${INK}" stroke-width="3.5"/>`
    + `<ellipse cx="37" cy="43" rx="10" ry="6.5" fill="#fff" opacity=".55" transform="rotate(-20 37 43)"/>`
    + `<path d="M20 76a38 38 0 0 0 60 0" fill="none" stroke="${m.ink}" stroke-width="5" stroke-linecap="round" opacity=".18"/>`
    + `<circle cx="28" cy="70" r="5" fill="${m.ink}" opacity=".28"/><circle cx="72" cy="70" r="5" fill="${m.ink}" opacity=".28"/>`;
  return `<svg viewBox="-8 -8 120 124" data-mascot="${i}" data-emo="${emo}"${attrs ? ` ${attrs}` : ''}>`
    + `<ellipse data-part="shadow" class="m-shadow" cx="50" cy="110" rx="24" ry="4" fill="${INK}" opacity=".13"/>`
    + `<g data-part="rig">${group('legs', legs)}${group('body', body)}${group('eyes', p.eyes)}${group('mouth', p.mouth)}${group('accessory', p.accessory)}${group('arms', p.arms)}</g></svg>`;
}
