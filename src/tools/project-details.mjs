// Stage 6g (4.11.2026): «Eigene Projekte» show a readable detail of each project at about 1:1 instead
// of a shrunk whole page: the KI draft, one Language Starter phrase card, one GeoAPP number task, one
// KittyCats kitten. Each is taken from the live page at a phone width (the text wraps at about 320 px)
// and saved as project-<key>-400/800 (4:3, AVIF + WebP + JPG). The earlier whole-page shots are kept
// in assets/img/_alt/. Usage: node src/tools/project-details.mjs [--only=ki,geoapp]
import { mkdir, stat, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { chromium, repoRoot } from '../qa/browsers.mjs';

const W = 352; // viewport: content about 320 px wide
const CLIP = { w: 320, h: 240 };
const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7).split(',');
const PROJECTS = [
  { key: 'ki', url: 'https://mrlololi.com/Webprojekte/ki-kundenservice/', prepare: async (page) => {
    // On a phone the inbox shows the list first: open mail 1 to see its draft.
    await page.locator('.inbox__list a.item').first().click();
    await page.waitForTimeout(900);
  }, find: 'section.draft' },
  { key: 'langstarter', url: 'https://mrlololi.com/Webprojekte/language-starter/?ui=de', prepare: async (page) => {
    // Choose «Deutsch» to learn: the phrase cards with «Anhören» appear.
    await page.locator('.chooser-card button', { hasText: 'Deutsch' }).first().click().catch(() => {});
    await page.waitForTimeout(1200);
  }, find: '.cards > *' },
  { key: 'geoapp', url: 'https://mrlololi.com/Webprojekte/geoapp/?lang=de', prepare: async (page) => {
    // «Los geht's»: the first number task with its four answers.
    await page.locator('.quiz-card button', { hasText: "Los geht's" }).first().click();
    await page.waitForTimeout(900);
  }, find: '.quiz-card section.screen' },
  { key: 'kittycats', url: 'https://mrlololi.com/Webprojekte/kittycats/', find: 'li.cat-card' },
];
const out = path.join(repoRoot, 'assets/img');
const keep = path.join(out, '_alt/stage6f');
await mkdir(keep, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
for (const p of PROJECTS.filter((x) => !only || only.includes(x.key))) {
  const page = await browser.newPage({ viewport: { width: W, height: 800 }, deviceScaleFactor: 2.5, reducedMotion: 'reduce', colorScheme: 'light' });
  await page.goto(p.url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await p.prepare?.(page);
  const el = page.locator(p.find).filter({ visible: true }).first();
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const b = await el.boundingBox();
  const src = path.join(repoRoot, 'src/images', `project-${p.key}-detail.png`);
  await page.screenshot({ path: src, clip: { x: Math.max(0, b.x + (b.width - CLIP.w) / 2), y: Math.max(0, b.y - 10), width: CLIP.w, height: CLIP.h } });
  await page.close();
  for (const [w, h] of [[400, 300], [800, 600]]) {
    for (const ext of ['avif', 'webp', 'jpg']) {
      const f = path.join(out, `project-${p.key}-${w}.${ext}`);
      if (existsSync(f) && !existsSync(path.join(keep, path.basename(f)))) await copyFile(f, path.join(keep, path.basename(f)));
      const img = sharp(src).resize(w, h);
      await (ext === 'avif' ? img.avif({ quality: 60, effort: 6 }) : ext === 'webp' ? img.webp({ quality: 82 }) : img.jpeg({ quality: 84, mozjpeg: true })).toFile(f);
      console.log(`img: ${path.basename(f)} ${((await stat(f)).size / 1024).toFixed(1)} KB`);
    }
  }
}
await browser.close();
