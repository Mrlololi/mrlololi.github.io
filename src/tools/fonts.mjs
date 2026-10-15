// Copies the self-hosted woff2 files into assets/fonts/ with stable names.
// Bricolage: opsz+wght file (the "standard" all-axes file is 128 KB, over budget).
import { copyFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const nm = path.join(root, 'node_modules');
const to = path.join(root, 'assets/fonts');

const files = [
  ['@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-opsz-normal.woff2', 'bricolage-grotesque-latin.woff2'],
  ['@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-ext-opsz-normal.woff2', 'bricolage-grotesque-latin-ext.woff2'],
  ['@fontsource-variable/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-wght-normal.woff2', 'atkinson-hyperlegible-next-latin.woff2'],
  ['@fontsource-variable/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-ext-wght-normal.woff2', 'atkinson-hyperlegible-next-latin-ext.woff2'],
  ['@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2', 'jetbrains-mono-latin-400.woff2'],
];

await mkdir(to, { recursive: true });
for (const [src, name] of files) {
  await copyFile(path.join(nm, src), path.join(to, name));
  const { size } = await stat(path.join(to, name));
  console.log(`font: ${name} ${(size / 1024).toFixed(1)} KB`);
}
