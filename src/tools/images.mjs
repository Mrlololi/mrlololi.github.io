// Optimised images: AVIF + WebP + JPG, 1x and 2x, into assets/img/.
// Sources live in src/images/ (portrait from Iva's CV, case 1 screenshot from capture-case.mjs).
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
// Portrait 410x615 -> 4:5 crop that keeps the face (top 16 px trimmed), shown at 260 px.
await variants(src('portrait-source.png'), 'portrait', [[260, 325], [410, 512]], { crop: { left: 0, top: 16, width: 410, height: 512 } });
// Case 1 screenshot 1440x900 (16:10), shown at up to 640 px.
await variants(src('case-alexandrafry.png'), 'case-alexandrafry', [[640, 400], [1280, 800]]);
