import { test } from 'node:test';
import assert from 'node:assert/strict';
import de from '../src/content/de.mjs';
import en from '../src/content/en.mjs';

// © ® ™ are Extended_Pictographic in Unicode but are not emoji here.
const EMOJI = /(?![©®™])\p{Extended_Pictographic}/u;

for (const [name, t] of [['de', de], ['en', en]]) {
  test(`${name}: no en dash, em dash or emoji anywhere`, () => {
    const all = JSON.stringify(t);
    assert.ok(!all.includes('–'), 'en dash found');
    assert.ok(!all.includes('—'), 'em dash found');
    assert.ok(!EMOJI.test(all), 'emoji found');
  });

  test(`${name}: run log has six steps with the stated seconds`, () => {
    assert.deepEqual(t.run.steps.map((s) => s.seconds), [0.2, 0.6, 0.9, 1.4, 1.9, 2.3]);
  });

  test(`${name}: section item counts match CONTENT.md`, () => {
    assert.equal(t.problems.items.length, 4);
    assert.deepEqual(t.problems.items.map((i) => i.severity), ['error', 'pending', 'error', 'pending']);
    assert.equal(t.pricing.groups.length, 3);
    assert.deepEqual(t.pricing.groups.map((g) => g.items.length), [2, 4, 1]);
    assert.equal(t.process.steps.length, 4);
    assert.equal(t.faq.items.length, 6);
    assert.equal(t.about.paragraphs.length, 3);
    assert.equal(t.calc.inputs.length, 4);
    assert.deepEqual(t.calc.inputs.map((i) => i.value), [120, 6, 60, 25]);
  });

  test(`${name}: exactly one pricing item carries the calculator`, () => {
    const withCalc = t.pricing.groups.flatMap((g) => g.items).filter((i) => i.calc);
    assert.equal(withCalc.length, 1);
  });

  test(`${name}: address has no flat number (Iva, 15.10.2026)`, () => {
    const all = JSON.stringify(t);
    assert.ok(!all.includes('4181'));
    assert.ok(all.includes('Herbersteinstraße 4'));
  });
}

test('de: hero copy is verbatim', () => {
  assert.equal(de.hero.h1, 'Die Technik hinter Ihrem Kurs-Launch. Gebaut, getestet, betreut.');
  assert.equal(de.contact.h2, 'Erzählen Sie mir, was hakt.');
  assert.equal(de.lang, 'de');
  assert.equal(de.locale, 'de-AT');
});

test('en: hero copy is verbatim', () => {
  assert.equal(en.hero.h1, 'The tech behind your course launch. Built, tested, looked after.');
  assert.equal(en.contact.h2, "Tell me what's not working.");
  assert.equal(en.lang, 'en');
  assert.equal(en.locale, 'en-GB');
});

test('en: German quotes keep the original plus a translation', () => {
  assert.equal(en.refs.case1.quote.lang, 'de');
  assert.ok(en.refs.case1.quote.translation.startsWith('I am happy to confirm'));
  assert.equal(en.refs.case3.quote.lang, 'de');
  assert.ok(en.refs.case3.quote.translation.startsWith('For these reasons'));
  assert.equal(en.refs.quote4.lang, 'en');
});
