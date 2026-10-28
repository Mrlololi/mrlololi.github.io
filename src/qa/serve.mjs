// Tiny static server for local checks: gzip like GitHub Pages, 404.html fallback.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};
const COMPRESS = new Set(['.html', '.css', '.js', '.mjs', '.json', '.xml', '.txt', '.svg']);

async function resolveFile(root, urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]);
  let file = path.join(root, clean);
  if (!file.startsWith(root)) return null;
  try {
    const s = await stat(file);
    if (s.isDirectory()) file = path.join(file, 'index.html');
    await stat(file);
    return file;
  } catch {
    return null;
  }
}

// rewriteOrigin: replace the production origin in HTML/XML/TXT with the local one (Lighthouse SEO checks).
export function startServer({ root, port = 0, rewriteOrigin = null, noCache = false } = {}) {
  let localOrigin = '';
  const server = createServer(async (req, res) => {
    let file = await resolveFile(root, req.url);
    let status = 200;
    if (!file) { file = path.join(root, '404.html'); status = 404; }
    const ext = path.extname(file);
    let body = await readFile(file);
    if (rewriteOrigin && ['.html', '.xml', '.txt'].includes(ext)) {
      body = Buffer.from(body.toString('utf8').replaceAll(rewriteOrigin, localOrigin));
    }
    const headers = { 'Content-Type': TYPES[ext] || 'application/octet-stream', 'Cache-Control': noCache ? 'no-store' : 'max-age=600' };
    if (COMPRESS.has(ext) && /gzip/.test(req.headers['accept-encoding'] || '')) {
      body = gzipSync(body);
      headers['Content-Encoding'] = 'gzip';
    }
    res.writeHead(status, headers);
    res.end(body);
  });
  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => {
      const { port: p } = server.address();
      localOrigin = `http://127.0.0.1:${p}`;
      resolve({ url: localOrigin, close: () => new Promise((r) => server.close(r)) });
    });
  });
}
