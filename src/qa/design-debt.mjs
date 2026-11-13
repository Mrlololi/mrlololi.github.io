// Stage 7b (12.11.2026): the ratchet counter of design system 1.1 rule 3 and 1.3. Every number may only
// fall; src/qa/design-debt.json holds the allowed maximum (measured on the untouched 7a tree) and
// tests/stage7b.test.mjs fails if a count rises above it.
// Counting rules (the same text is in design-debt.json next to each number):
// - CSS files: every *.css under assets/css/, comments removed, the :root token block of
//   components.css left out (it is the one place where literals belong).
// - hex: every #rgb / #rrggbb / #rrggbbaa literal (data-URIs included, written %23 there are not hex).
// - rgb: every rgb( or rgba( literal.
// - radius: every border-radius declaration whose value, after removing var(...) and calc(...) of
//   vars, still holds a number with a unit or a percentage.
// - shadow: every box-shadow declaration whose value is not only var(...), none, inherit or initial.
// - durations: distinct time values (ms or s, normalised to ms) in any declaration.
// - mediaWidths: distinct widths (number + unit as written) in @media conditions.
// - svgTemplates: occurrences of «<svg» in src/templates/*.mjs.
//   node src/qa/design-debt.mjs        prints the counts and the baseline
import { readFileSync, readdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = new URL('../../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');

export function cssFiles() {
  return readdirSync(new URL('assets/css/', root)).filter((f) => f.endsWith('.css')).sort().map((f) => `assets/css/${f}`);
}

// The CSS without comments and without the :root token block of components.css.
export function cssBody(file) {
  let s = read(file).replace(/\/\*[\s\S]*?\*\//g, '');
  if (file.endsWith('components.css')) {
    const a = s.indexOf(':root {');
    if (a >= 0) s = s.slice(0, a) + s.slice(s.indexOf('\n}', a) + 2);
  }
  return s;
}

const decls = (s, prop) => [...s.matchAll(new RegExp(`(?<![\\w-])${prop}\\s*:\\s*([^;}]+)`, 'g'))].map((m) => m[1].trim());

export function countDebt() {
  const files = cssFiles();
  const per = {};
  const durations = new Set();
  const widths = new Set();
  let hex = 0, rgb = 0, radius = 0, shadow = 0;
  for (const f of files) {
    const s = cssBody(f);
    const h = (s.match(/#[0-9a-fA-F]{3,8}\b/g) || []).filter((x) => [4, 7, 9].includes(x.length)).length;
    const r = (s.match(/\brgba?\(/g) || []).length;
    // A number WITH a unit or a percentage, as the rule says (a bare 0 is no radius); var(...) first,
    // then what is left of a calc(...) around it.
    const rad = decls(s, 'border-radius').filter((v) => /\d(px|rem|em|%)/.test(v.replace(/var\([^)]*\)/g, '').replace(/calc\([^)]*\)/g, ''))).length;
    const sh = decls(s, 'box-shadow').filter((v) => !/^(var\([^)]*\)|none|inherit|initial)(\s*!important)?$/.test(v)).length;
    for (const m of s.matchAll(/[:,\s](\d*\.?\d+)(ms|s)\b/g)) durations.add(m[2] === 's' ? Math.round(Number(m[1]) * 1000) : Math.round(Number(m[1])));
    for (const q of s.matchAll(/@media[^{]*/g)) for (const m of q[0].matchAll(/(\d*\.?\d+)(px|rem|em)/g)) widths.add(`${m[1]}${m[2]}`);
    per[f] = { hex: h, rgb: r, radius: rad, shadow: sh };
    hex += h; rgb += r; radius += rad; shadow += sh;
  }
  const svgTemplates = readdirSync(new URL('src/templates/', root)).filter((f) => f.endsWith('.mjs'))
    .reduce((n, f) => n + (read(`src/templates/${f}`).match(/<svg/g) || []).length, 0);
  return { hex, rgb, radius, shadow, durations: durations.size, mediaWidths: widths.size, svgTemplates, per };
}

export const baseline = () => JSON.parse(read('src/qa/design-debt.json'));

// The numbers that rose above the file: [{ key, now, max }].
export function risen(now = countDebt(), base = baseline()) {
  return Object.entries(base.max).filter(([k, max]) => now[k] > max).map(([key, max]) => ({ key, now: now[key], max }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const now = countDebt();
  console.log(JSON.stringify(now, null, 2));
  try { const r = risen(now); console.log(r.length ? `RISEN: ${JSON.stringify(r)}` : 'no number above design-debt.json'); } catch { console.log('(no design-debt.json yet)'); }
}
