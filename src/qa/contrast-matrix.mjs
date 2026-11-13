// Stage 7b (12.11.2026): the contrast matrix of design system 7.1 (docs/DESIGN_SYSTEM_v1_2026-11-12.md).
// Reads the token values from assets/css/components.css (the :root block and the label backgrounds),
// computes every ratio itself (WCAG 2.x relative luminance) and checks the thresholds, not the rounded
// numbers printed in the design system. «Not allowed» pairs are negative cases: they must stay BELOW
// the threshold, so nobody «fixes» them into use by accident.
//   node src/qa/contrast-matrix.mjs        prints the matrix as a table
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const CSS = new URL('../../assets/css/components.css', import.meta.url);

// :root custom properties: name -> raw value.
export function readTokens(css = readFileSync(CSS, 'utf8')) {
  const root = css.slice(css.indexOf(':root {'), css.indexOf('\n}', css.indexOf(':root {')));
  const tokens = {};
  for (const m of root.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/--([\w-]+):\s*([^;]+);/g)) tokens[m[1]] = m[2].trim();
  // Label backgrounds live in the .label--x rules (not tokens; they stay as they are in 7b).
  for (const m of css.matchAll(/\.label--(\w+) \{ background: (#[0-9A-Fa-f]{6}); color: ([^;]+); \}/g)) {
    tokens[`label-bg-${m[1]}`] = m[2];
    tokens[`label-fg-${m[1]}`] = m[3].trim();
  }
  return tokens;
}

// A colour as [r, g, b, a] (0-255, alpha 0-1), resolving var() and hex / rgb().
function parse(value, tokens, depth = 0) {
  const v = value.trim();
  const ref = v.match(/^var\(--([\w-]+)\)$/);
  if (ref) { if (depth > 8 || !(ref[1] in tokens)) throw new Error(`unknown token ${v}`); return parse(tokens[ref[1]], tokens, depth + 1); }
  const hex = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].split('').map((c) => c + c).join('') : hex[1];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).concat(1);
  }
  const rgb = v.match(/^rgb\((\d+)\s+(\d+)\s+(\d+)(?:\s*\/\s*([\d.]+))?\)$/);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3]), rgb[4] === undefined ? 1 : Number(rgb[4])];
  if (v === '#fff' || v === 'white') return [255, 255, 255, 1];
  throw new Error(`cannot read colour ${v}`);
}

// Translucent colour over an opaque one.
const over = (top, bottom) => [0, 1, 2].map((i) => top[i] * top[3] + bottom[i] * (1 - top[3])).concat(1);
const lum = ([r, g, b]) => {
  const c = [r, g, b].map((x) => { const s = x / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
export const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// Every pair of design system 7.1: { group, fg, bg, min, kind: 'allow' | 'deny' }.
export function pairs(tokens = readTokens()) {
  const c = (name) => parse(`var(--${name})`, tokens);
  const WHITE = [255, 255, 255, 1];
  const sheet = parse(tokens.sheet, tokens);
  const BANDS = ['pink', 'blue', 'pist', 'lav', 'peach'];
  const bands = Object.fromEntries(BANDS.map((b) => [b, c(`sec-${b}`)]));
  const light = {
    white: WHITE,
    card: c('card'),
    paper: c('sec-paper'),
    ...Object.fromEntries(BANDS.map((b) => [`${b}-tint`, c(`${b}-tint`)])),
    ...Object.fromEntries(BANDS.map((b) => [`sheet/${b}`, over(sheet, bands[b])])),
  };
  const plain = { white: light.white, card: light.card, paper: light.paper, ...Object.fromEntries(BANDS.map((b) => [`${b}-tint`, light[`${b}-tint`]])) };
  const sheets = Object.fromEntries(BANDS.map((b) => [`sheet/${b}`, light[`sheet/${b}`]]));
  const out = [];
  const add = (group, fgName, fg, set, min, kind) => { for (const [bgName, bg] of Object.entries(set)) out.push({ group, fg: fgName, bg: bgName, ratio: ratio(fg, bg), min, kind }); };
  const bandSet = Object.fromEntries(BANDS.map((b) => [b, bands[b]]));

  // Allowed text pairs (>= 4.5).
  for (const t of ['ink', 'ink-soft']) { add('text', `--${t}`, c(t), bandSet, 4.5, 'allow'); add('text', `--${t}`, c(t), light, 4.5, 'allow'); }
  for (const t of ['pink-ink', 'blue-ink', 'pist-ink', 'lav-ink', 'peach-ink', 'done']) add('text', `--${t}`, c(t), light, 4.5, 'allow');
  add('text', '--error', c('error'), { ...light, ...bandSet }, 4.5, 'allow');
  add('text', '--muted', c('muted'), plain, 4.5, 'allow');
  add('text', '#FFFFFF', WHITE, { ink: c('ink'), done: c('done') }, 4.5, 'allow');
  add('text', '--on-ink', c('on-ink'), { 'sec-ink': c('sec-ink') }, 4.5, 'allow');
  for (const b of BANDS) add('label', `label ${b}`, parse(tokens[`label-fg-${b}`], tokens), { [`label-bg-${b}`]: parse(tokens[`label-bg-${b}`], tokens) }, 4.5, 'allow');
  // Old places where an accent ink sits directly on a band (measured, allowed, no new ones).
  add('old place', '--pink-ink', c('pink-ink'), { 'hero, pink end': c('sec-pink'), 'hero, lav end': c('sec-lav'), pink: bands.pink }, 4.5, 'allow');
  for (const t of ['pink-ink', 'blue-ink', 'pist-ink']) add('old place', `--${t}`, c(t), { peach: bands.peach }, 4.5, 'allow');
  // Not allowed: must stay below 4.5.
  add('not allowed', '--pist-ink', c('pist-ink'), { pink: bands.pink, blue: bands.blue, lav: bands.lav }, 4.5, 'deny');
  add('not allowed', '--done (text)', c('done'), bandSet, 4.5, 'deny');
  // --muted on the old sheet is not allowed by rule; the ratio is below 4.5 only over pink, blue and lav
  // (over pist and peach it measures 4.59 / 4.66). Iva 12.11.2026: keep the rule, test where it holds.
  add('not allowed', '--muted', c('muted'), { ...bandSet, 'sheet/pink': sheets['sheet/pink'], 'sheet/blue': sheets['sheet/blue'], 'sheet/lav': sheets['sheet/lav'] }, 4.5, 'deny');
  add('not allowed', '--field (text)', c('field'), { ...light, ...bandSet }, 4.5, 'deny');
  // Non-text (>= 3).
  for (const t of ['ink', 'ink-soft']) add('non-text', `icon --${t}`, c(t), { ...bandSet, ...light }, 3, 'allow');
  add('non-text', '--done (glyph)', c('done'), bandSet, 3, 'allow');
  add('non-text', '--field (border)', c('field'), plain, 3, 'allow');
  add('non-text', 'focus ring --ink', c('ink'), { ...bandSet, ...light }, 3, 'allow');
  return out;
}

export const failing = (list = pairs()) => list.filter((p) => (p.kind === 'allow' ? p.ratio < p.min : p.ratio >= p.min));

export function table(list = pairs()) {
  const rows = list.map((p) => `${p.kind === 'allow' ? (p.ratio >= p.min ? 'ok  ' : 'FAIL') : (p.ratio < p.min ? 'ok  ' : 'FAIL')} ${p.group.padEnd(11)} ${p.fg.padEnd(18)} on ${p.bg.padEnd(16)} ${p.ratio.toFixed(2).padStart(5)} ${p.kind === 'allow' ? '>=' : '< '} ${p.min}`);
  const bad = failing(list).length;
  return `${rows.join('\n')}\n\n${list.length - bad}/${list.length} pairs as the design system says`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(table());
  process.exit(failing().length ? 1 : 0);
}
