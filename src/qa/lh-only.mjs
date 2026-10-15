// Dev helper: Lighthouse only. Usage: node src/qa/lh-only.mjs [/ /en/]
import config from '../config.json' with { type: 'json' };
import { repoRoot } from './browsers.mjs';
import { startServer } from './serve.mjs';
import { lighthouseCheck } from './lighthouse.mjs';

const pages = process.argv.slice(2).length ? process.argv.slice(2) : ['/', '/en/'];
const server = await startServer({ root: repoRoot, rewriteOrigin: config.site_url });
for (const r of await lighthouseCheck(server.url, pages)) console.log(`${r.pass ? 'PASS' : 'FAIL'} ${r.name}\n${r.details}\n`);
await server.close();
