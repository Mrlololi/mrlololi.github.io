// Stage 7b-S (13.11.2026): IndexNow after a publish. Tells Bing (and the other IndexNow engines) which URLs
// changed. Server to server only: the URLs, the host and the key, no visitor data, no cookie.
// The key is config.indexnow_key; its file <key>.txt lies at the site root (written by the build) and, same
// host, at the Webprojekte root.
//   node src/tools/indexnow.mjs https://mrlololi.com/ https://mrlololi.com/qualitaet/        dry run: prints the request
//   node src/tools/indexnow.mjs --send https://mrlololi.com/ …                             sends it (only after a publish)
//   node src/tools/indexnow.mjs --changed <old-commit> [--send]                           the pages changed since <old-commit>
// Run by Iva or by Claude Code after a publish, never before (the URLs must already be live).
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import config from '../config.json' with { type: 'json' };

export const ENDPOINT = 'https://api.indexnow.org/indexnow';

export function payload(urls, cfg = config) {
  const host = new URL(cfg.site_url).host;
  const bad = urls.filter((u) => new URL(u).host !== host);
  if (bad.length) throw new Error(`not on ${host}: ${bad.join(', ')}`);
  return { host, key: cfg.indexnow_key, keyLocation: `${cfg.site_url.replace(/\/$/, '')}/${cfg.indexnow_key}.txt`, urlList: urls };
}

// Built pages changed since a commit: «index.html» files and 404.html excluded; noindex pages left out.
export function changedUrls(since, cfg = config) {
  const files = execFileSync('git', ['diff', '--name-only', since, 'HEAD', '--', '*.html'], { encoding: 'utf8' }).split('\n').filter((f) => f.endsWith('index.html'));
  return files.map((f) => `${cfg.site_url.replace(/\/$/, '')}/${f.replace(/index\.html$/, '')}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const send = args.includes('--send');
  const i = args.indexOf('--changed');
  const urls = i >= 0 ? changedUrls(args[i + 1]) : args.filter((a) => a.startsWith('http'));
  if (!urls.length) { console.log('no URLs'); process.exit(1); }
  const body = payload(urls);
  if (!send) { console.log(`dry run (add --send after a publish):\nPOST ${ENDPOINT}\n${JSON.stringify(body, null, 2)}`); process.exit(0); }
  const res = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(body) });
  console.log(`${res.status} ${res.statusText}`);
  process.exit(res.ok ? 0 : 1);
}
