// Stage 6 images: video posters (WebP + JPG per format) and the two «Eigene Projekte» screenshots (Stage 6b)
// (4:3, AVIF + WebP + JPG, 1x and 2x). Usage: node src/tools/stage6-images.mjs [--posters] [--projects]
// Posters come from frames of the video masters in ../video-konveyer (read only); the screenshots are
// taken from the live Webprojekte pages and kept as sources in src/images/.
import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const all = !args.length;
const size = async (f) => `${((await stat(f)).size / 1024).toFixed(1)} KB`;

if (all || args.includes('--posters')) {
  const out = path.join(root, 'assets/video');
  await mkdir(out, { recursive: true });
  // Stage 6b: both posters are flat frames of the film in the site style (no 3D cover): the four
  // steps ticked, the three in front (43 s), taken once with ffmpeg -ss 43 -frames:v 1.
  const wide = () => sharp(path.join(root, 'src/images/video-poster-16x9.png')).resize(1280, 720);
  // 9:16: the frame at 43 s (the four steps ticked, the three in front), taken once with
  // ffmpeg -ss 43 -i a_9x16.mp4 -frames:v 1 src/images/video-poster-9x16.png.
  const tall = () => sharp(path.join(root, 'src/images/video-poster-9x16.png')).resize(720, 1280);
  for (const [name, pipe] of [['anmeldung-16x9', wide], ['anmeldung-9x16', tall]]) {
    const webp = path.join(out, `${name}.webp`);
    const jpg = path.join(out, `${name}.jpg`);
    await pipe().webp({ quality: 72 }).toFile(webp);
    await pipe().jpeg({ quality: 78, mozjpeg: true }).toFile(jpg);
    console.log(`poster: ${name} webp ${await size(webp)}, jpg ${await size(jpg)}`);
  }
}

// --projects takes new screenshots; --crop-only re-crops the kept ones.
if (all || args.includes('--projects') || args.includes('--crop-only')) {
  const { chromium } = await import('../qa/browsers.mjs');
  const ONLY = args.includes('--crop-only');
  const PROJECTS = [
    ['ki', 'https://mrlololi.com/Webprojekte/ki-kundenservice/'],
    ['langstarter', 'https://mrlololi.com/Webprojekte/language-starter/?ui=de'],
  ];
  const browser = await chromium.launch();
  const out = path.join(root, 'assets/img');
  for (const [key, url] of PROJECTS) {
    const src = path.join(root, 'src/images', `project-${key}.png`);
    if (!ONLY) {
      const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce', colorScheme: 'light' });
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1200);
      await page.screenshot({ path: src });
      await page.close();
    }
    for (const [w, h] of [[400, 300], [800, 600]]) {
      // Stage 6b: a closer crop of the top middle (headline and first block), readable on phones.
      const base = () => sharp(src).extract({ left: 200, top: 30, width: 800, height: 600 }).resize(w, h);
      for (const [ext, pipe] of [['avif', base().avif({ quality: 55, effort: 6 })], ['webp', base().webp({ quality: 78 })], ['jpg', base().jpeg({ quality: 80, mozjpeg: true })]]) {
        const f = path.join(out, `project-${key}-${w}.${ext}`);
        await pipe.toFile(f);
        console.log(`img: project-${key}-${w}.${ext} ${await size(f)}`);
      }
    }
  }
  await browser.close();
}
