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
    assert.equal(t.problems.items.length, 3);
    assert.equal(t.pricing.groups.length, 3);
    assert.deepEqual(t.pricing.groups.map((g) => g.items.length), [2, 3, 1]);
    assert.equal(t.process.steps.length, 4);
    assert.equal(t.faq.items.length, 7);
    assert.equal(t.about.path.length, 4);
    assert.equal(t.hero.flow.nodes.length, 4);
    assert.equal(t.about.paragraphs.length, 3);
    assert.equal(t.calc.inputs.length, 4);
    assert.deepEqual(t.calc.inputs.map((i) => i.value), [120, 6, 60, 25]);
  });

  test(`${name}: offers Iva does not make (yet) are gone (16.10.2026)`, () => {
    const all = JSON.stringify(t);
    for (const gone of [/Zapier-(Rechnung|Kosten)|Zapier (bill|costs)/, /Retainer|retainer/, /Standby|standby/, /Express|plus 50/, /60 €|€60/, /Auftragsverarbeitung|data processing agreement/, /hunderten|hundreds/, /aufwärmen|warm up/]) {
      assert.ok(!gone.test(all), `still on the site: ${gone}`);
    }
  });

  test(`${name}: run log in plain words, ActiveCampaign the only tool`, () => {
    const log = t.run.steps.map((s) => s.text).join(' ');
    assert.ok(!/SPF|DKIM|DMARC|Leadpages|Stripe|Quaderno|Zapier|Somba/.test(log), log);
    assert.ok(log.includes('ActiveCampaign'));
  });

  test(`${name}: exactly one pricing item carries the calculator`, () => {
    const withCalc = t.pricing.groups.flatMap((g) => g.items).filter((i) => i.calc);
    assert.equal(withCalc.length, 1);
  });

  test(`${name}: full address with flat number (Iva, 15.10.2026, second answer)`, () => {
    const all = JSON.stringify(t);
    assert.ok(all.includes('Herbersteinstraße 4/4181'));
    assert.ok(!/Herbersteinstraße 4(?!\/4181)/.test(all), 'address without /4181 found');
  });
}

test('de: hero copy is verbatim', () => {
  assert.equal(de.hero.h1, 'Die Technik hinter Ihrem Kurs-Launch. *Gebaut, getestet, betreut.*');
  assert.equal(de.contact.h2, 'Erzählen Sie mir, *was hakt.*');
  assert.equal(de.lang, 'de');
  assert.equal(de.locale, 'de-AT');
});

test('en: hero copy is verbatim', () => {
  assert.equal(en.hero.h1, 'The tech behind your course launch. *Built, tested, maintained.*');
  assert.equal(en.contact.h2, "Tell me *what's not working.*");
  assert.equal(en.lang, 'en');
  assert.equal(en.locale, 'en-GB');
});

test('en: German quotes keep the original plus a translation', () => {
  assert.equal(en.refs.case1.quote.lang, 'de');
  assert.ok(en.refs.case1.quote.translation.startsWith('I am happy to confirm'));
  assert.equal(en.refs.case3.quote.lang, 'de');
  assert.ok(en.refs.case3.quote.translation.startsWith('[…] we consider'));
  assert.equal(en.refs.quote4.lang, 'en');
});

test('prices as decided by Iva (16.10.2026)', () => {
  const prices = (t) => t.pricing.groups.flatMap((g) => g.items.map((i) => i.price));
  assert.deepEqual(prices(de), ['190 € fix', '290 € fix', 'ab 1.190 €', 'ab 990 €', 'ab 590 €', '45 € pro Stunde']);
  assert.deepEqual(prices(en), ['€190 fixed', '€290 fixed', 'from €1,190', 'from €990', 'from €590', '€45 per hour']);
  assert.equal(de.pricing.groups[1].note, 'Festpreis nach dem Briefing.');
  assert.equal(de.pricing.hourly, 'Alles außerhalb der Pakete: 45 € pro Stunde.');
  assert.equal(de.pricing.groups[1].items[2].extra.label, 'Optional: Pflege 90 € pro Monat');
  assert.equal(de.faq.items[0].q, 'Muss ich mich mit Technik auskennen?');
  assert.equal(de.faq.items[4].a, 'Ich bekomme einen eigenen Benutzer in Ihren Konten, nie Ihr Passwort. Nach Projektende entfernen Sie meinen Zugang, und ich lösche alle Kopien Ihrer Daten.');
});
