// Optimised images: AVIF + WebP + JPG, 1x and 2x, into assets/img/.
// Sources live in src/images/ (Iva's photos re-encoded without metadata, case 1 screenshot from capture-case.mjs).
import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const src = (f) => path.join(root, 'src/images', f);
const out = path.join(root, 'assets/img');

async function variants(input, name, sizes, { crop } = {}) {
  for (const [w, h] of sizes) {
    const base = () => {
      const img = sharp(input);
      return (crop ? img.extract(crop) : img).resize(w, h, { fit: 'cover', position: 'top' });
    };
    const files = [
      [`${name}-${w}.avif`, base().avif({ quality: 55, effort: 6 })],
      [`${name}-${w}.webp`, base().webp({ quality: 78 })],
      [`${name}-${w}.jpg`, base().jpeg({ quality: 80, mozjpeg: true })],
    ];
    for (const [file, pipeline] of files) {
      await pipeline.toFile(path.join(out, file));
      const { size } = await stat(path.join(out, file));
      console.log(`img: ${file} ${w}x${h} ${(size / 1024).toFixed(1)} KB`);
    }
  }
}

await mkdir(out, { recursive: true });
// Über mich: Hallstatt photo 900x1200 -> 4:5 crop (a little sky trimmed), shown at 340 px.
// Stage 6b (29.10.2026): new photo (green plants, smiling), 1440x1920 -> 4:5 with the face in the upper third.
await variants(src('about-iva-2026-10-29.jpg'), 'about', [[340, 425], [680, 850]], { crop: { left: 0, top: 100, width: 1440, height: 1800 } });
// Hero chip and FAQ chat avatar: the smiling face, square, shown round at 44 / 36 px.
// Stage 6b: the new square face crop (Iva 29.10.2026; the old one is in src/_alt/stage5/img/).
await variants(src('avatar-iva-2026-10-29.jpg'), 'avatar', [[44, 44], [88, 88]]);
// Case 1 screenshot 1440x900 (16:10), shown at up to 640 px.
await variants(src('case-alexandrafry.png'), 'case-alexandrafry', [[640, 400], [1280, 800]]);
// Stage 4: the long capture that scrolls inside the browser frame (capture-case.mjs --long).
await variants(src('case-alexandrafry-long.png'), 'case-alexandrafry-long', [[640, 1067], [1280, 2133]]);
