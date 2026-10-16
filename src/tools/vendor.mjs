// Copies the self-hosted GSAP files into assets/vendor/ (no CDN on the live site).
import { copyFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const from = path.join(root, 'node_modules/gsap/dist');
const to = path.join(root, 'assets/vendor');
const files = ['gsap.min.js', 'ScrollTrigger.min.js'];

await mkdir(to, { recursive: true });
for (const f of files) {
  await copyFile(path.join(from, f), path.join(to, f));
  const { size } = await stat(path.join(to, f));
  console.log(`vendor: ${f} ${(size / 1024).toFixed(1)} KB`);
}
