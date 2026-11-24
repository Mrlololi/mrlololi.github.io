// December release R1 «Ehrlich» (docs/PROMPT_Dezember_Eine_Tuer_2026-11-24.md): frequency words, contradictions,
// availability from one value, B2B line, Musterbericht pricing frame, Datenschutz «Empfänger», Quick-Fix framing.
// The German texts are the brief's, word for word.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import config from '../src/config.json' with { type: 'json' };
import de from '../src/content/de.mjs';
import en from '../src/content/en.mjs';
import { pages } from '../src/build.mjs';
import { note } from '../src/templates/util.mjs';
import { RULES } from '../src/qa/wortfilter.mjs';

const by = Object.fromEntries(pages(config, { articles: [] }).map((p) => [p.file, p.html]));
const text = (h) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
const all = Object.values(by).map(text).join('\n');
const card = (h, id, next) => h.slice(h.indexOf(`id="pkg-${id}"`), h.indexOf(`id="pkg-${next}"`));
const AVAIL = 'Technik-Check: jetzt anfragen, Termine im Januar 2027. Launch-Setup: Projektstart ab 22. Februar 2027.';
const HOLIDAY = 'Anfragen vom 21. Dezember bis 3. Januar beantworte ich ab 4. Januar.';

test('1. frequency words: the brief\'s new sentences in, the old ones out (DE, EN twins)', () => {
  for (const s of ['Wo es bei Launches hakt', 'Kurze Antworten vor der Zusammenarbeit.', 'Einen Quick-Fix plane ich innerhalb einer Woche nach Ihrer Zusage ein.', 'Und niemand weiß genau, wo das Problem liegt.', 'Ja. Ich arbeite remote im DACH-Raum. In Graz komme ich gern persönlich vorbei.', 'Jeder dieser Fehler fällt erst auf, wenn eine Kundin schreibt.', 'Solche Stolpersteine findet ein Technik-Check.', 'für die erwartbaren Fragen', 'SPF, DKIM und DMARC sind die Grundvoraussetzung, damit Postfächer Ihre Mails annehmen. Danach teste ich die Zustellung.']) assert.ok(all.includes(s), s);
  for (const s of ['oft hakt', 'am häufigsten gefragt', 'Quick-Fixes oft', 'Oft weiß niemand', 'Fast alle Projekte', 'kostet Anmeldungen, Umsatz oder Nerven', 'typische Stolpersteine', 'häufigsten Fragen', 'kommt sie im Posteingang an']) assert.ok(!all.includes(s), s);
  for (const s of ['Where launches break', 'Short answers before we work together.', 'I schedule a quick fix within one week of your go-ahead.', 'And nobody knows exactly where the problem is.', 'Yes. I work remotely across Europe.', 'Each of these failures only shows up when a customer writes to you.', 'SPF, DKIM and DMARC are the basic requirement for mailboxes to accept your emails. After that I test delivery.']) assert.ok(all.includes(s), s);
});

test('1. Wortfilter: frequency words on every page, inflected forms listed; the allow-list holds at most 2 phrases', () => {
  const g = RULES.groups.find((x) => x.name === 'frequency');
  assert.deepEqual(g.pages, ['*']);
  for (const w of ['oft', 'häufig', 'häufige', 'häufigen', 'häufigsten', 'typisch', 'typische', 'typischen', 'fast alle', 'often', 'typical', 'most common']) assert.ok(g.words.includes(w), w);
  assert.ok(g.allow.length <= 2, 'at most two allowed phrases');
  assert.deepEqual(g.allow, ['Häufige Fragen', 'welche Fragen oft kommen']);
});

test('2. contradictions: launch day reachability, the 45-minute review talk, no 20-minute line, referral in the crediting bullet', () => {
  const l = by['launch-technik/index.html'];
  assert.ok(l.includes('Erreichbarkeit am Launch-Tag in einem vereinbarten Zeitfenster') && !l.includes('Begleitung am Launch-Tag'));
  assert.ok(l.includes('<strong>Launch-Tag:</strong> Ich bin in einem vorher vereinbarten Zeitfenster telefonisch und per Chat erreichbar. Arbeit in diesem Fenster: 45 € pro Stunde, vorher abgesprochen. Außerhalb antworte ich bis 15 Uhr am nächsten Tag. Ich begleite höchstens einen Launch pro Woche.'));
  const c = card(by['index.html'], 'check', 'launch');
  assert.ok(c.includes('45-Minuten-Auswertungsgespräch') && !c.includes('Gespräch von 45 Minuten'));
  assert.ok(!all.includes('20-Minuten-Gespräch'), 'the 20-minute line is gone everywhere');
  assert.ok(c.includes('Bei Auftrag innerhalb von 30 Tagen voll angerechnet, auf Empfehlung einer Kundin 60 Tage.'));
  assert.ok(!all.includes('Auf Empfehlung einer Kundin: Der Technik-Check'), 'no separate referral line anywhere');
  assert.equal(de.s4.starter.checkReferral, undefined);
});

test('3. availability: one value on the Technik-Check card, in «Gut zu wissen» and above both contact forms; old lines gone', () => {
  const now = note(config, 'availability', 'de');
  assert.ok(now.startsWith(AVAIL));
  assert.ok(card(by['index.html'], 'check', 'launch').includes(`<p class="item__when">${now}</p>`));
  assert.ok(by['launch-technik/index.html'].includes(`<p class="svc-facts__note">${now}</p>`));
  assert.ok(by['index.html'].includes(`<p class="contact__when">${now}</p>\n<form class="contact__form"`));
  assert.ok(by['launch-technik/index.html'].includes(`<div class="svc-form" id="svc-form">\n<p class="contact__when">${now}</p>`));
  assert.ok(by['en/index.html'].includes('Tech check: request now, dates in January 2027. Launch setup: project start from 22 February 2027.'));
  assert.ok(!all.includes('Termine ab Januar 2027') && !all.includes('Im Februar 2027 plane ich keine Launches ein'));
  assert.ok(!/noch \d+ frei|\d+ (Plätze|Termine) frei/.test(all), 'no counts');
  // From 15.12 to 03.01 the holiday line follows (on the build day).
  assert.equal(note(config, 'availability', 'de', new Date('2026-12-14T12:00:00Z')), AVAIL);
  assert.equal(note(config, 'availability', 'de', new Date('2026-12-15T12:00:00Z')), `${AVAIL} ${HOLIDAY}`);
  assert.equal(note(config, 'availability', 'de', new Date('2027-01-03T12:00:00Z')), `${AVAIL} ${HOLIDAY}`);
  assert.equal(note(config, 'availability', 'de', new Date('2027-01-04T12:00:00Z')), AVAIL);
});

// The cheap reminder (brief R1.3): once a month named in the availability line is over, this fails, so the line
// gets new dates before it lies.
test('3. the availability line names no month that is already over', () => {
  const MONTHS = { Januar: 0, Februar: 1, März: 2, April: 3, Mai: 4, Juni: 5, Juli: 6, August: 7, September: 8, Oktober: 9, November: 10, Dezember: 11 };
  const today = new Date();
  for (const m of config.notes.availability.de.matchAll(/(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember) (\d{4})/g)) {
    const end = new Date(Date.UTC(Number(m[2]), MONTHS[m[1]] + 1, 1));
    assert.ok(today < end, `«${m[0]}» is over: update config.notes.availability (and its EN twin)`);
  }
});

test('4. B2B line under the prices (DE, EN); 6. Quick-Fix lead line and the 4-hour scope as the small line', () => {
  assert.ok(by['index.html'].includes('<p class="tariff__b2b">Meine Leistungen richten sich an Unternehmen und Selbstständige.</p>'));
  assert.ok(by['en/index.html'].includes('<p class="tariff__b2b">My services are for businesses and the self-employed.</p>'));
  const q = card(by['index.html'], 'quick', 'check');
  assert.ok(q.includes('<p class="item__line">Ein klar umrissener Fehler: behoben, getestet und dokumentiert. Festpreis, ohne laufende Uhr.<span class="item__scope">Eine konkrete Aufgabe, Aufwand bis zu 4 Stunden.</span></p>'));
  assert.ok(q.includes('190 € fix'), 'price unchanged');
});

test('5. Musterbericht: pricing frame under the estimate, «nur zwei Befunde» at the top, winter crediting', () => {
  const m = by['musterbericht/technik-check/index.html'].replace(/ /g, ' '); // «45 €»: number and unit kept on one line
  const head = m.slice(m.indexOf('<main'), m.indexOf('</section>'));
  assert.ok(head.includes('Ein echter Bericht kann auch nur zwei Befunde haben.'));
  assert.match(m, /<p>Geschätzter Aufwand für alle 12 Befunde: rund 7 Stunden\.[^<]*<\/p>\n<p>Diese rund 7 Stunden betreffen nur die gezielte Behebung in einem bestehenden System, nach Aufwand mit 45 € pro Stunde\. Das Launch-Setup ab 1\.190 € gilt für den kompletten Aufbau einer Launch-Strecke\.<\/p>/);
  const winter = 'Für Technik-Checks bis 31. Januar 2027 gilt die Anrechnung bis 15. März 2027.';
  if (note(config, 'credit_winter', 'de')) {
    assert.ok(m.includes(winter), 'Musterbericht');
    assert.ok(card(by['index.html'], 'check', 'launch').includes(`auf Empfehlung einer Kundin 60 Tage. ${winter}`), 'crediting bullet');
  }
  assert.equal(note(config, 'credit_winter', 'de', new Date('2027-02-01T12:00:00Z')), '');
});

test('8. Datenschutz #post «Empfänger»: Google named as the tool for mailbox and files (DE, EN)', () => {
  assert.ok(by['datenschutz/index.html'].includes('Für mein Postfach und meine Dateiablage nutze ich Google (Gmail, Google Drive; Google Ireland Ltd.).'));
  assert.ok(by['en/privacy/index.html'].includes('For my mailbox and file storage I use Google (Gmail, Google Drive; Google Ireland Ltd.).'));
  assert.ok(!all.includes('die als Auftragsverarbeiter für mich tätig sind: Google'));
});
