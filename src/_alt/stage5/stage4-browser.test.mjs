// Stage 4 behaviour in Chromium (replay on re-entry, reduced motion, no JS, keyboard and Escape,
// phone tabs, first-name parsing, mailto composition): the checks of src/qa/stage4.mjs as a test.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '../src/qa/browsers.mjs';
import { startServer } from '../src/qa/serve.mjs';
import { checkStage4 } from '../src/qa/stage4.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('Stage 4 in a browser: every check passes', { timeout: 300000 }, async () => {
  const server = await startServer({ root });
  const browser = await chromium.launch();
  try {
    const results = await checkStage4(browser, server.url);
    const failed = results.filter((r) => !r.pass).map((r) => `${r.name}: ${r.details}`);
    assert.deepEqual(failed, [], failed.join('\n'));
    assert.ok(results.length >= 25);
  } finally {
    await browser.close();
    await server.close();
  }
});
