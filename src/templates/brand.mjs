// Logo system (Identity 21.10.2026): icon «drei Kugeln», the outlined wordmark with the pistachio
// i-dot, the coloured tagline and the lockups. Pure SVG strings: used inline by the templates and
// written as files by src/tools/brand.mjs. Outlines come from brand-glyphs.json (no web font).
import G from './brand-glyphs.json' with { type: 'json' };

export const INK = '#2B2A33';
export const WHITE = '#FFFFFF';
// The three balls: fill (light pastel) and dark ink, in the order pink, blue, pistachio.
export const BALLS = [
  { name: 'pink', fill: '#F4C9D3', ink: '#9C3F58' },
  { name: 'blue', fill: '#BFD8EE', ink: '#2F6A9E' },
  { name: 'pist', fill: '#CFE3C2', ink: '#3F6B31' },
];
const [PINK, BLUE, PIST] = BALLS;

// Icon on a 64 grid: horizontal chain, solid fills, blue drawn last (middle, on top). Never a triangle.
const ICON = { r: 13, xs: [20, 32, 44], stroke: 3 };
// Tab size: thicker stroke, bigger and wider circles, so the overlaps survive 16 px.
const ICON16 = { r: 14, xs: [18, 32, 46], stroke: 5 };

const n = (v) => String(Math.round(v * 10000) / 10000);

// halo (Stage 4, header variant b): a thin white ring (2 units, about 2 px in the header) behind each ball.
function iconBody({ small = false, line = INK, halo = false } = {}) {
  const s = small ? ICON16 : ICON;
  const [l, m, r] = s.xs;
  const ring = halo ? `<g fill="#fff">${s.xs.map((x) => `<circle cx="${x}" cy="32" r="${s.r + s.stroke / 2 + 2}"/>`).join('')}</g>` : '';
  return `${ring}<g stroke="${line}" stroke-width="${s.stroke}"><circle cx="${l}" cy="32" r="${s.r}" fill="${PINK.fill}"/><circle cx="${r}" cy="32" r="${s.r}" fill="${PIST.fill}"/><circle cx="${m}" cy="32" r="${s.r}" fill="${BLUE.fill}"/></g>`;
}

const attrs = (a = {}) => Object.entries(a).filter(([, v]) => v != null && v !== false).map(([k, v]) => ` ${k}="${v}"`).join('');

// Accessible name: role="img" + <title> when a label is given, otherwise hidden from assistive tech.
function svg(viewBox, body, { label, ...rest } = {}) {
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': 'true', focusable: 'false' };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"${attrs({ ...a11y, ...rest })}>${label ? `<title>${label}</title>` : ''}${body}</svg>`;
}

export const icon = ({ small = false, line = INK, ...rest } = {}) => svg('0 0 64 64', iconBody({ small, line }), rest);

// Glyph commands -> path data at an offset. After the first point everything is relative,
// so repeated letters produce identical strings (they compress to almost nothing).
function pathData(cmds, dx, dy = 0) {
  let out = '';
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;
  for (const [cmd, nums] of cmds) {
    if (cmd === 'Z') { out += 'z'; cx = sx; cy = sy; continue; }
    const abs = nums.map((v, i) => v + (i % 2 ? dy : dx));
    if (!out) {
      out += `M${abs[0]} ${abs[1]}`;
    } else {
      const rel = abs.map((v, i) => v - (i % 2 ? cy : cx));
      out += cmd.toLowerCase() + rel.join(' ').replace(/ -/g, '-');
    }
    cx = abs.at(-2);
    cy = abs.at(-1);
    if (cmd === 'M') { sx = cx; sy = cy; }
  }
  return out;
}

// Ink box of a glyph list (font units, y down) - used for tight viewBoxes.
function inkBox(items) {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const [cmds, dx] of items) {
    for (const [, nums] of cmds) {
      for (let i = 0; i < nums.length; i += 2) {
        x0 = Math.min(x0, nums[i] + dx); x1 = Math.max(x1, nums[i] + dx);
        y0 = Math.min(y0, nums[i + 1]); y1 = Math.max(y1, nums[i + 1]);
      }
    }
  }
  return [x0, y0, x1, y1];
}

// The i-dot: a pistachio ball with an ink ring, 0.3 em across, sitting on the ascender line
// (as in the approved draft), centred over the dotless i's stem.
const DOT = { r: 120, stroke: 60, cy: -720 };

const W = G.word;
const wordItems = W.layout.map(([ch, x]) => [W.glyphs[ch], x]);
const WORD_BOX = (() => {
  const [x0, , x1, y1] = inkBox(wordItems);
  const r = DOT.r + DOT.stroke / 2;
  return [Math.min(x0, W.dot.cx - r), DOT.cy - r, Math.max(x1, W.dot.cx + r), y1];
})();

// The wordmark at the origin (baseline y 0, 1000 units per em). The word itself is never coloured.
// id: the letters get an id (colour on a wrapping group) so a later SVG on the page can <use> them;
// use: draw those letters again instead of repeating the outlines.
function wordBody({ fill = INK, ring = INK, id, use } = {}) {
  const d = wordItems.map(([cmds, x]) => pathData(cmds, x)).join('');
  const letters = use ? `<use href="#${use}" fill="${fill}"/>` : id ? `<g fill="${fill}"><path id="${id}" d="${d}"/></g>` : `<path fill="${fill}" d="${d}"/>`;
  return `${letters}<circle cx="${W.dot.cx}" cy="${DOT.cy}" r="${DOT.r}" fill="${PIST.fill}" stroke="${ring}" stroke-width="${DOT.stroke}"/>`;
}

// Tagline colours: on light grounds the dark inks, on the dark ground the light pastels.
export function taglineColours(dark) {
  return { rest: dark ? WHITE : INK, initials: BALLS.map((b) => (dark ? b.fill : b.ink)) };
}

// Tagline outlines at the origin (its own font units), coloured per glyph.
function taglineBody(lang, dark) {
  const t = G.tagline[lang];
  const { rest, initials } = taglineColours(dark);
  // One path per colour run keeps the file small.
  const runs = [];
  for (const [key, x, c] of t.layout) {
    const fill = c < 0 ? rest : initials[c];
    if (runs.at(-1)?.fill !== fill) runs.push({ fill, d: '' });
    runs.at(-1).d += pathData(t.glyphs[key], x);
  }
  return { body: runs.map((r) => `<path fill="${r.fill}" d="${r.d}"/>`).join(''), box: inkBox(t.layout.map(([key, x]) => [t.glyphs[key], x])) };
}

// Lockup geometry in wordmark units (1000 = the word's font size), from the approved drafts:
// header icon 30 px next to a 22 px word, large icon 64 px next to 42 px with a 20 px tagline.
const KINDS = {
  header: { icon: 1364, gap: 545, tagline: false },
  full: { icon: 1524, gap: 286, tagline: true },
};
const TAG_SIZE = 476; // tagline font size in word units (0.48 em)
const TAG_GAP = 48; // 2 px at 42 px between the word's line box and the tagline's

// Line boxes as CSS draws them with line-height 1 (word) and normal (tagline).
const wordLineTop = -(W.ascender + ((1000 - (W.ascender - W.descender)) / 2));
const wordLineBottom = wordLineTop + 1000;
const tagScale = TAG_SIZE / 1000;
const tagBaseline = wordLineBottom + TAG_GAP + G.tagline.ascender * tagScale;
const tagLineBottom = wordLineBottom + TAG_GAP + (G.tagline.ascender - G.tagline.descender) * tagScale;

/**
 * kind: 'header' (icon + word) or 'full' (icon + word + tagline in `lang`).
 * dark: white word, white icon strokes and ring, pastel tagline initials; `bg` adds the #2B2A33 ground.
 */
export function lockup({ kind = 'header', lang = 'de', dark = false, bg = false, pad = 0, wordId, halo = false, ...rest } = {}) {
  const k = KINDS[kind];
  const line = dark ? WHITE : INK;
  const colTop = wordLineTop;
  const colBottom = k.tagline ? tagLineBottom : wordLineBottom;
  const iconY = (colTop + colBottom) / 2 - k.icon / 2;
  const s = k.icon / 64;
  const wx = k.icon + k.gap;
  let parts = `<g transform="translate(0 ${n(iconY)}) scale(${n(s)})">${iconBody({ line, halo })}</g>`;
  parts += `<g transform="translate(${wx} 0)">${wordBody({ fill: line, ring: line, id: wordId })}</g>`;
  // Tight box: icon ink (circles plus half the stroke) and word ink.
  const h = halo ? 2 : 0; // the halo reaches 2 grid units beyond the ink
  const iconInk = [(ICON.xs[0] - ICON.r - ICON.stroke / 2 - h) * s, iconY + (32 - ICON.r - ICON.stroke / 2 - h) * s, (ICON.xs[2] + ICON.r + ICON.stroke / 2 + h) * s, iconY + (32 + ICON.r + ICON.stroke / 2 + h) * s];
  let box = [iconInk[0], Math.min(iconInk[1], WORD_BOX[1]), Math.max(iconInk[2], wx + WORD_BOX[2]), Math.max(iconInk[3], WORD_BOX[3])];
  if (k.tagline) {
    const t = taglineBody(lang, dark);
    parts += `<g transform="translate(${wx} ${n(tagBaseline)}) scale(${n(tagScale)})">${t.body}</g>`;
    box = [box[0], box[1], Math.max(box[2], wx + t.box[2] * tagScale), Math.max(box[3], tagBaseline + t.box[3] * tagScale)];
  }
  const [x0, y0, x1, y1] = [box[0] - pad, box[1] - pad, box[2] + pad, box[3] + pad].map((v) => Math.round(v));
  const ground = bg ? `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="${INK}"/>` : '';
  return svg(`${x0} ${y0} ${x1 - x0} ${y1 - y0}`, ground + parts, rest);
}

// The word alone (tight box), for the footer where the tagline is live text below it.
export function wordmark({ dark = false, use, ...rest } = {}) {
  const line = dark ? WHITE : INK;
  const [x0, y0, x1, y1] = WORD_BOX.map((v) => Math.round(v));
  return svg(`${x0} ${y0} ${x1 - x0} ${y1 - y0}`, wordBody({ fill: line, ring: line, use }), rest);
}

// The icon's ink box inside its 64 grid (for tight placement next to the wordmark).
export const ICON_INK = { x: ICON.xs[0] - ICON.r - ICON.stroke / 2, y: 32 - ICON.r - ICON.stroke / 2, w: (ICON.xs[2] - ICON.xs[0]) + 2 * ICON.r + ICON.stroke, h: 2 * ICON.r + ICON.stroke };
// Icon ink cropped tight (used in the footer next to the word).
export const iconTight = ({ line = INK, ...rest } = {}) =>
  svg(`${ICON_INK.x} ${ICON_INK.y} ${ICON_INK.w} ${ICON_INK.h}`, iconBody({ line }), rest);

// Tagline as live text (HTML): the first two letters of each word wrapped for their ball colour.
export function taglineHtml(text) {
  let w = 0;
  return text.replace(/\p{L}+/gu, (word) => {
    const cls = BALLS[w++ % 3].name;
    return `<span class="tl-${cls}">${word.slice(0, 2)}</span>${word.slice(2)}`;
  });
}
