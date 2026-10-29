// Stage 6 layout gate and demo rules in Chromium: the checks of src/qa/stage6.mjs as a test.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '../src/qa/browsers.mjs';
import { startServer } from '../src/qa/serve.mjs';
import { checkStage6 } from '../src/qa/stage6.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('Stage 6 in a browser: layout gate, reduced motion, no JS, reflow, autoplay', { timeout: 600000 }, async () => {
  const server = await startServer({ root });
  const browser = await chromium.launch();
  try {
    const results = await checkStage6(browser, server.url);
    const failed = results.filter((r) => !r.pass).map((r) => `${r.name}: ${r.details}`);
    assert.deepEqual(failed, [], failed.join('\n'));
    assert.ok(results.length >= 80);
  } finally {
    await browser.close();
    await server.close();
  }
});
