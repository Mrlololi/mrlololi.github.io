// Favicon set: the completed-step node of the run log (green disc, white check).
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const out = path.join(root, 'assets/icons');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#1F7A5C"/><path d="M9 16.5l4.6 4.6L23.4 10.6" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>\n`;

// Apple touch icon: the node on paper with breathing room (iOS adds its own mask).
const touch = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><rect width="180" height="180" fill="#F1F4F2"/><g transform="translate(36 36) scale(3.375)">${svg.replace(/<\/?svg[^>]*>/g, '')}</g></svg>`;

// ICO container holding one 32x32 PNG (supported by all current browsers).
function ico(png) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry.writeUInt8(32, 0); entry.writeUInt8(32, 1); entry.writeUInt8(0, 2); entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4); entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8); entry.writeUInt32LE(22, 12);
  return Buffer.concat([header, entry, png]);
}

await mkdir(out, { recursive: true });
await writeFile(path.join(out, 'favicon.svg'), svg);
await sharp(Buffer.from(touch)).png().toFile(path.join(out, 'apple-touch-icon.png'));
const png32 = await sharp(Buffer.from(svg), { density: 300 }).resize(32, 32).png().toBuffer();
await writeFile(path.join(out, 'favicon.ico'), ico(png32));
console.log('icons: favicon.svg, apple-touch-icon.png (180), favicon.ico (32)');
