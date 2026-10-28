// Logo files (Identity 21.10.2026) from src/templates/brand.mjs:
//   assets/brand/  icon, icon-16, the lockups (header, full DE/EN, dark DE/EN) and the favicon set
//   ../docs/brand-export/  (not deployed) avatars 400 x 400 and the e-mail signature logo at 2x.
// The OG images and their 2x sources come from src/tools/og.mjs.  Usage: node src/tools/brand.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { icon, lockup, INK, BALLS, WHITE } from '../templates/brand.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const out = path.join(root, 'assets/brand');
const exp = path.resolve(root, '../docs/brand-export');
const LABEL = { de: 'mrlololi. Logik, Lösung, Live.', en: 'mrlololi. Logic, Loop, Live.' };

// width/height at the approved sizes (word 22 px in the header, 42 px in the large lockup).
function sized(svgText, wordPx) {
  const [, , w, h] = svgText.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
  return svgText.replace('<svg ', `<svg width="${Math.round((w * wordPx) / 1000)}" height="${Math.round((h * wordPx) / 1000)}" `);
}

// Favicon: the 16 px drawing (thick strokes). No dark-theme variant: on a dark tab the ink ring
// melts into the tab, but the pastels and the ink lines between them still read; a light ring
// (tested 21.10) washed the balls out.
const favicon = icon({ small: true, label: 'mrlololi' });

const files = {
  'icon.svg': icon({ label: 'mrlololi', width: 64, height: 64 }),
  'icon-16.svg': icon({ small: true, label: 'mrlololi', width: 16, height: 16 }),
  'favicon.svg': favicon,
  'logo-header.svg': sized(lockup({ kind: 'header', label: 'mrlololi' }), 22),
  'logo-full-de.svg': sized(lockup({ kind: 'full', lang: 'de', label: LABEL.de }), 42),
  'logo-full-en.svg': sized(lockup({ kind: 'full', lang: 'en', label: LABEL.en }), 42),
  'logo-dark-de.svg': sized(lockup({ kind: 'full', lang: 'de', dark: true, bg: true, pad: 320, label: LABEL.de }), 42),
  'logo-dark-en.svg': sized(lockup({ kind: 'full', lang: 'en', dark: true, bg: true, pad: 320, label: LABEL.en }), 42),
};

// ICO container with PNG entries (16, 32, 48), supported by every current browser.
function ico(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(pngs.length, 4);
  let offset = 6 + 16 * pngs.length;
  const entries = pngs.map(({ size, png }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size, 0); e.writeUInt8(size, 1); e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6);
    e.writeUInt32LE(png.length, 8); e.writeUInt32LE(offset, 12);
    offset += png.length;
    return e;
  });
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.png)]);
}

const png = (svgText, w, h = w) => sharp(Buffer.from(svgText), { density: 600 }).resize(w, h).png().toBuffer();
const inner = (svgText) => svgText.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '').replace(/<title>.*?<\/title>/, '');
// The icon centred on a square ground (circle or full square), the chain at `scale` of the side.
function onGround(size, { ground, circle, scale = 0.72, line = INK }) {
  const s = (size * scale) / 64;
  const o = (size - 64 * s) / 2;
  const g = circle ? `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${ground}"/>` : `<rect width="${size}" height="${size}" fill="${ground}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">${g}<g transform="translate(${o} ${o}) scale(${s})">${inner(icon({ line }))}</g></svg>`;
}

await mkdir(out, { recursive: true });
for (const [name, text] of Object.entries(files)) await writeFile(path.join(out, name), `${text}\n`);
const small = icon({ small: true });
await writeFile(path.join(out, 'favicon.ico'), ico(await Promise.all([16, 32, 48].map(async (size) => ({ size, png: await png(small, size) })))));
// iOS rounds the corners itself: a white square with room around the chain.
await sharp(Buffer.from(onGround(180, { ground: '#FFFFFF', scale: 0.7 }))).png().toFile(path.join(out, 'apple-touch-icon.png'));
console.log(`brand: ${Object.keys(files).join(', ')}, favicon.ico (16/32/48), apple-touch-icon.png (180)`);

// For Iva (not deployed): avatars and the signature logo.
await mkdir(exp, { recursive: true });
await sharp(Buffer.from(onGround(400, { ground: '#FFFFFF', circle: true }))).png().toFile(path.join(exp, 'avatar-400-white.png'));
// Stage 4: profile avatars on white or dark; the pink one melted into pink headers and lives in _alt.
await sharp(Buffer.from(onGround(400, { ground: INK, circle: true, line: WHITE }))).png().toFile(path.join(exp, 'avatar-400-dark.png'));
await mkdir(path.join(exp, '_alt'), { recursive: true });
await sharp(Buffer.from(onGround(400, { ground: BALLS[0].fill, circle: true }))).png().toFile(path.join(exp, '_alt/avatar-400-pink.png'));
// E-mail signature: large lockup DE at twice the approved size, on white (dark-mode mail keeps it readable).
const sig = lockup({ kind: 'full', lang: 'de', pad: 120 });
const [, , sw, sh] = sig.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
const sigW = Math.round((sw * 84) / 1000);
const sigH = Math.round((sh * 84) / 1000);
await sharp(Buffer.from(sig.replace(/(<svg[^>]*>)/, `$1<rect x="-99999" y="-99999" width="199999" height="199999" fill="#FFFFFF"/>`)), { density: 300 })
  .resize(sigW, sigH).png().toFile(path.join(exp, 'signature-de@2x.png'));
for (const name of ['logo-full-de.svg', 'logo-full-en.svg', 'logo-dark-de.svg', 'logo-dark-en.svg', 'icon.svg']) await writeFile(path.join(exp, name), `${files[name]}\n`);
console.log(`brand export: avatar-400-white.png, avatar-400-dark.png (_alt/avatar-400-pink.png), signature-de@2x.png (${sigW} x ${sigH}), logo SVGs -> ${exp}`);
void INK;
