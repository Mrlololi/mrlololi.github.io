// Lighthouse (mobile) against the published site. Usage: node src/qa/lh-live.mjs
import { lighthouseCheck } from './lighthouse.mjs';

for (const r of await lighthouseCheck('https://mrlololi.github.io', ['/', '/en/'])) {
  console.log(`${r.pass ? 'PASS' : 'FAIL'} ${r.name}`);
}
