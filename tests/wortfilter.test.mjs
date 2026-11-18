// Wortfilter (docs/PROMPT_Qualitaet_und_Wortfilter_2026-11-17.md, part A) inside npm test: the built pages
// against src/qa/wortfilter.json, with the ratchet src/qa/wortfilter-baseline.json; plus planted fixtures
// that must fail (a listed word, a wrong price, a «beispiel» entry without its label).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import de from '../src/content/de.mjs';
import en from '../src/content/en.mjs';
import { scan, builtPages, hitKey, visibleText, RULES } from '../src/qa/wortfilter.mjs';

const baseline = JSON.parse(readFileSync(new URL('../src/qa/wortfilter-baseline.json', import.meta.url), 'utf8'));
const page = (p, body, head = '') => ({ page: p, html: `<!doctype html><html lang="de"><head>${head}</head><body>${body}</body></html>` });
const hitsOf = (pages, opts) => scan(pages, de, opts);

test('built site: no hit outside the baseline, and the baseline only shrinks', () => {
  const pages = builtPages();
  assert.ok(pages.length >= 17, `${pages.length} pages`);
  const keys = scan(pages, de).map(hitKey);
  const fresh = keys.filter((k) => !baseline.hits.includes(k));
  assert.deepEqual(fresh, [], `new Wortfilter hits (fix the text or report to the chat via Iva):\n${fresh.join('\n')}`);
  const gone = baseline.hits.filter((k) => !keys.includes(k));
  assert.deepEqual(gone, [], `baseline entries that no longer occur: remove them from src/qa/wortfilter-baseline.json\n${gone.join('\n')}`);
  assert.ok(baseline.hits.length <= baseline.max && baseline.max <= 7, 'the ratchet may only shrink (7 on 18.11.2026)');
  // The main site itself is clean since the four changes of 17.11.
  assert.deepEqual(keys.filter((k) => !k.startsWith('/Webprojekte/')), []);
});

test('the four texts of 17.11 (DE and EN): new wording in, old wording out', () => {
  const all = JSON.stringify([de, en]);
  for (const x of ['Mit einem geprüften Entwurf brauchen Sie pro Standardantwort 30 % der bisherigen Zeit.', 'Pannen fangen wir möglichst vorher ab:', 'Viele Kursplattformen lassen sich', 'Dieser Fehler kostet bei einem Launch Anmeldungen, Umsatz oder Nerven.',
    'with a reviewed draft you need 30% of the previous time per standard reply.', 'We catch problems beforehand wherever possible:', 'Many course platforms connect', 'At a launch, this failure costs sign-ups, revenue or nerves.']) assert.ok(all.includes(x), x);
  for (const x of ['spart 70', 'saves 70', 'Die meisten Pannen', 'Die meisten Kursplattformen', 'sehe ich bei Launches oft', 'We catch most problems', 'Most course platforms', 'I often see this failure']) assert.ok(!all.includes(x), x);
});

test('a planted listed word fails (global, tools group, brief group, qualitaet group)', () => {
  assert.equal(hitsOf([page('/', '<p>Ihr Launch ist garantiert fehlerfrei.</p>')]).length, 2);
  assert.equal(hitsOf([page('/', '<p>100 % sicher</p>')]).length, 1);
  assert.equal(hitsOf([page('/werkzeuge/ein-kauf/', '<p>Das passiert oft.</p>')]).filter((h) => h.word === 'oft').length, 2, 'tools list and the Ein-Kauf never-list');
  assert.equal(hitsOf([page('/', '<p>Das passiert oft.</p>')]).length, 0, 'frequency words only in the tool scope');
  assert.equal(hitsOf([page('/brief/', '<p>Sie haben eingewilligt.</p>')]).length, 1);
  assert.equal(hitsOf([page('/qualitaet/', '<p>Das ist gesetzlich vorgeschrieben.</p>')]).length, 2);
  // In alt, aria-label, title and the meta description, too; never in a <script>.
  assert.equal(hitsOf([page('/', '<img alt="garantiert" src="x.png">', '<meta name="description" content="risikolos">')]).length, 2);
  assert.equal(hitsOf([page('/', '<script>const x = "garantiert";</script><p>ok</p>')]).length, 0);
});

test('whole words only; allow-list by phrase', () => {
  assert.equal(hitsOf([page('/', '<p>Zeit gespart, Zustellgarantie, Garantien.</p>')]).length, 0);
  assert.equal(hitsOf([page('/', '<p>Es gibt keine Garantie dafür.</p>')]).length, 0);
  assert.equal(hitsOf([page('/', '<p>Es gibt eine Garantie.</p>')]).length, 1);
  assert.equal(hitsOf([page('/datenschutz/', '<p>GitHub ist unter dem EU-US Data Privacy Framework zertifiziert.</p>')]).length, 0);
  assert.equal(hitsOf([page('/impressum/', '<p>GitHub ist unter dem EU-US Data Privacy Framework zertifiziert.</p>')]).length, 1, 'allowed on /datenschutz/ only');
});

test('prices: a planted wrong price fails, package prices and 45 € pass, calculator pages are allowed', () => {
  assert.equal(hitsOf([page('/', '<p>Nur 123 € statt 990 €.</p>')]).map((h) => h.word).join(), '123 €');
  assert.equal(hitsOf([page('/en/', '<p>from €1,190 or €45 per hour, €290 fixed, €90 per month</p>')]).length, 0);
  assert.equal(hitsOf([page('/', '<p>ab 1.190 €, 190 €, 590 €</p>')]).length, 0);
  assert.equal(hitsOf([page('/ki-antwortentwuerfe/', '<p>Ersparnis: 546 € pro Monat</p>')]).length, 0);
  assert.equal(hitsOf([page('/brief/', '<p>290 €</p>')]).length, 1, '/brief/: no price at all');
  assert.deepEqual(RULES.prices.hourly, 45);
});

test('labels: a «beispiel» entry without its label fails, a «drittanbieter» entry needs «Stand: <Datum>»', () => {
  const entries = [{ id: 'case-a', beispiel: true }, { id: 'tool-b', drittanbieter: true }];
  const bad = [page('/x/', '<div data-entry="case-a"><p>Kundin X</p></div><div data-entry="tool-b"><p>Preis bei Anbieter</p></div>')];
  assert.deepEqual(hitsOf(bad, { entries }).map((h) => h.word).sort(), ['Beispiel', 'Stand']);
  const good = [page('/x/', '<div data-entry="case-a"><p>Kundin X</p><span>fiktives Beispiel</span></div><div data-entry="tool-b"><p>Preis</p><small>Stand: 17.11.2026</small></div>')];
  assert.deepEqual(hitsOf(good, { entries }), []);
  assert.equal(hitsOf([page('/x/', '<p>ohne</p>')], { entries: [{ beispiel: true }] }).length, 1, 'a flagged entry needs an id');
});

test('visible text: entities decoded, scripts and styles out', () => {
  const t = visibleText('<p>A&nbsp;&amp;&#8239;B</p><style>.x{}</style><script>y</script><a title="T">L</a>');
  assert.match(t, /A & B/);
  assert.ok(!/\.x\{\}|\by\b/.test(t));
  assert.match(t, /\bT\b/);
});
