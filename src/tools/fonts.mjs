// Copies the self-hosted woff2 files into assets/fonts/ with stable names.
// Bricolage: opsz+wght file (the "standard" all-axes file is 128 KB, over budget).
// The two preloaded Latin files are subset to the characters German and English copy uses
// (keeps every variation axis); anything missing falls back per character, never breaks.
import { copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const nm = path.join(root, 'node_modules');
const to = path.join(root, 'assets/fonts');

const files = [
  ['@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-opsz-normal.woff2', 'bricolage-grotesque-latin.woff2', 'display'],
  ['@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-ext-opsz-normal.woff2', 'bricolage-grotesque-latin-ext.woff2', false],
  ['@fontsource-variable/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-wght-normal.woff2', 'atkinson-hyperlegible-next-latin.woff2', true],
  ['@fontsource-variable/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-ext-wght-normal.woff2', 'atkinson-hyperlegible-next-latin-ext.woff2', false],
];

// ASCII, German and common Western letters, typographic quotes, € § © and the spaces Intl uses.
const ascii = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join('');
const KEEP = ascii + 'ÄÖÜäöüßÀÁÂÇÈÉÊËÍÎÏÑÓÔÚÛàáâçèéêëíîïñóôúû' + '§©«»°·×' + ' ­  ‑‘’‚“”„…€−';

// The monospace face only sets the run log's title bar, times and summary line.
const LOG = ascii + 'ÄÖÜäöüß';

await mkdir(to, { recursive: true });
for (const [src, name, subset] of files) {
  const target = path.join(to, name);
  if (subset) {
    const input = await readFile(path.join(nm, src));
    // Bricolage: optical size pinned to its display cut (72), weight stays variable.
    // That cut is what gives the headlines their character, and the file gets much lighter.
    const options = subset === 'display' ? { targetFormat: 'woff2', variationAxes: { opsz: 72 } } : { targetFormat: 'woff2' };
    await writeFile(target, await subsetFont(input, subset === 'log' ? LOG : KEEP, options));
  } else {
    await copyFile(path.join(nm, src), target);
  }
  const { size } = await stat(target);
  console.log(`font: ${name} ${(size / 1024).toFixed(1)} KB${subset ? ' (subset)' : ''}`);
}
