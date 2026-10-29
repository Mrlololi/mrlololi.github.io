import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pages } from '../src/build.mjs';
import config from '../src/config.json' with { type: 'json' };

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const all = pages(config, { buildDate: new Date('2026-10-15T12:00:00Z') });

// Every local file a page references (src, href, srcset, og:image) must exist.
function localRefs(html) {
  const refs = new Set();
  for (const m of html.matchAll(/(?:src|href|content)="(\/[^"#?]*)"/g)) refs.add(m[1]);
  for (const m of html.matchAll(/srcset="([^"]+)"/g)) {
    for (const part of m[1].split(',')) refs.add(part.trim().split(/\s+/)[0]);
  }
  const site = config.site_url.replace(/\/$/, '');
  for (const m of html.matchAll(/content="(https:\/\/[^/"]+)(\/[^"]+\.(?:png|jpg))"/g)) if (m[1] === site) refs.add(m[2]);
  return [...refs].filter((r) => /\.[a-z0-9]+$/i.test(r));
}

for (const { file, html } of all) {
  test(`${file}: every referenced local file exists`, () => {
    const missing = localRefs(html).filter((r) => !existsSync(path.join(root, r)));
    assert.deepEqual(missing, []);
  });
}

test('every <img> has width, height and alt', () => {
  for (const { html } of all) {
    for (const m of html.matchAll(/<img\b[^>]*>/g)) {
      assert.match(m[0], /\swidth="\d+"/);
      assert.match(m[0], /\sheight="\d+"/);
      assert.match(m[0], /\salt="[^"]*"/);
    }
    // Only the decorative photo in the hero chip (its text names Iva) has an empty alt.
    const empty = html.match(/<img\b[^>]*\salt=""[^>]*>/g) || [];
    assert.ok(empty.every((img) => /avatar-44\.jpg|\/assets\/video\/anmeldung-|project-\w+-400\.jpg/.test(img)), empty.join(' '));
  }
});
