// Stage 7a: both sites on one origin, like mrlololi.com: the main site at /, Webprojekte at
// /Webprojekte/ (so «motion-paused» in localStorage is shared, as live). No cache.
//   node src/qa/serve-both.mjs [port]   (default 8790; Webprojekte from ../webprojekte/site or WEBPROJEKTE_SITE)
// Used by the Stage 7a gates (src/qa/gates.mjs) and qa/both-server.mjs.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAIN = fileURLToPath(new URL('../../', import.meta.url));
const WP = process.env.WEBPROJEKTE_SITE || fileURLToPath(new URL('../../../../webprojekte/site/', import.meta.url));
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon',
};

async function file(root, path) {
  let p = normalize(join(root, path));
  if (!p.startsWith(normalize(root))) throw new Error('outside');
  if ((await stat(p)).isDirectory()) p = join(p, 'index.html');
  return { p, body: await readFile(p) };
}

export function startBoth(port = 8790) {
  const server = createServer(async (req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const wp = /^\/Webprojekte(\/|$)/.test(path);
    const root = wp ? WP : MAIN;
    const rel = wp ? path.replace(/^\/Webprojekte/, '') || '/' : path;
    try {
      const { p, body } = await file(root, rel);
      res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' });
      res.end(body);
    } catch {
      try {
        const body = await readFile(join(root, '404.html'));
        res.writeHead(404, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
        res.end(body);
      } catch { res.writeHead(404); res.end('not found'); }
    }
  });
  return new Promise((resolve) => server.listen(port, () => resolve({ server, url: `http://localhost:${port}`, close: () => new Promise((r) => server.close(r)) })));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const s = await startBoth(Number(process.argv[2]) || 8790);
  console.log('serving', s.url, '(main) and', `${s.url}/Webprojekte/`);
}
