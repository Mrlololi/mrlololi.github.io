// Stage 6h, Teil A (docs/PROMPT_Stage6h_Recht_Ehrlichkeit_Vitrine_2026-11-05.md): static checks. The form
// with ?quelle= and the native post run in the browser (src/qa/stage6.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pages } from '../src/build.mjs';
import config from '../src/config.json' with { type: 'json' };
import de from '../src/content/de.mjs';
import en from '../src/content/en.mjs';
import { note } from '../src/templates/util.mjs';

const all = pages(config, { live: {} });
const byFile = Object.fromEntries(all.map((p) => [p.file, p.html]));
const deHome = byFile['index.html'];
const enHome = byFile['en/index.html'];
const section = (h, id) => h.match(new RegExp(`<section id="${id}">[\\s\\S]*?</section>`))?.[0] || '';

test('1. Datenschutz #post (DE/EN) with all its sub-headings, the link to the e-mail section', () => {
  const d = section(byFile['datenschutz/index.html'], 'post');
  assert.match(d, /<h2>Kontaktaufnahme mit Unternehmen per Post \(Direktwerbung\)<\/h2>/);
  for (const h of ['Quelle', 'Rechtsgrundlage', 'Empfänger', 'Speicherdauer', 'Widerspruch']) assert.ok(d.includes(`<strong>${h}:</strong>`), h);
  for (const x of ['einmalig einen Brief', 'Art. 6 Abs. 1 lit. f DSGVO, Erwägungsgrund 47', 'höchstens einmal in 12 Monaten', 'Google Ireland Ltd.', 'EU-US Data Privacy Framework (Art. 45 DSGVO)', 'Sperrvermerk (Firma, Domain, Datum)', 'Art. 21 Abs. 2 DSGVO', 'Bis 4. November 2026']) assert.ok(d.includes(x), x);
  assert.match(d, /gelten die Fristen unter „<a href="#email">Kontakt per E-Mail<\/a>“/);
  assert.match(d, /per E-Mail an <a href="mailto:hello@mrlololi\.com">hello@mrlololi\.com<\/a> oder per Post/);
  assert.ok(!/Anthropic/.test(d));
  const e = section(byFile['en/privacy/index.html'], 'post');
  assert.match(e, /<h2>Contacting businesses by post \(direct marketing\)<\/h2>/);
  for (const h of ['Source', 'Legal basis', 'Recipients', 'Storage', 'Objection']) assert.ok(e.includes(`<strong>${h}:</strong>`), h);
  assert.match(e, /<a href="#email">Contact by email<\/a>/);
  assert.equal(config.page_dates.privacy, '2026-11-05');
});

test('2. honest numbers: «vereinfachtes Beispiel» at the counters, assumptions labelled, no «AVV mit allen Anbietern»', () => {
  const sig = deHome.slice(deHome.indexOf('fixdemo--signup'), deHome.indexOf('</figure>', deHome.indexOf('fixdemo--signup')));
  assert.match(sig, /<p class="fd-note" aria-hidden="true">Vereinfachtes Beispiel<\/p>/);
  assert.match(sig, /<figcaption class="sr-only">[^<]*Vereinfachtes Beispiel\.<\/figcaption>/);
  assert.match(deHome, /<p class="vid__note">Vereinfachtes Beispiel<\/p>/);
  assert.match(deHome, /<video [^>]*aria-label="[^"]*, Vereinfachtes Beispiel"/);
  assert.match(enHome, /Simplified example/);
  const ki = byFile['ki-antwortentwuerfe/index.html'];
  assert.match(ki, /Anteil Standardfragen in % \(Ihre Annahme\)/);
  assert.match(ki, /Stundensatz Ihres Teams in € \(Ihre Annahme\)/);
  assert.match(ki, /Annahme, anpassbar: Ein geprüfter Entwurf spart 70\s?% der Zeit/);
  const root = fileURLToPath(new URL('..', import.meta.url));
  const hits = [];
  const walk = (d) => { for (const n of readdirSync(d)) { if (['node_modules', '.git', '_alt', 'stage6h.test.mjs'].includes(n)) continue; const p = path.join(d, n); if (statSync(p).isDirectory()) walk(p); else if (/\.(mjs|js|html|json|md)$/.test(n) && /AVV mit allen Anbietern/i.test(readFileSync(p, 'utf8'))) hits.push(p); } };
  walk(root);
  assert.deepEqual(hits, []);
  assert.ok(de.faq.items.some((x) => x.q === 'Gibt es einen Auftragsverarbeitungsvertrag?' && x.a === 'Ja. Vor Projektstart schließen wir einen AVV nach Art. 28 DSGVO (Muster der WKO), inklusive der Unterauftragsverarbeiter.'));
  assert.ok(en.faq.items.some((x) => x.q === 'Is there a data processing agreement?'));
});

test('3. showcase: the KI card first, «Spielwiese und Lernprojekte» with GeoAPP and Language Starter, no KittyCats on home', () => {
  const p = deHome.slice(deHome.indexOf('id="projects"'), deHome.indexOf('id="faq"'));
  assert.ok(p.indexOf('KI im Kundenservice') < p.indexOf('Spielwiese und Lernprojekte'));
  assert.ok(p.indexOf('Spielwiese und Lernprojekte') < p.indexOf('Language Starter') && p.indexOf('Spielwiese und Lernprojekte') < p.indexOf('GeoAPP'));
  assert.ok(!/KittyCats|kittycats/.test(p));
  assert.match(enHome, /Playground and learning projects/);
  assert.ok(de.s6.projects.items.some((x) => x.key === 'kittycats' && x.home === false), 'the line is kept');
});

test('4. Technik-Check card: badge, own button, call line, dated availability, report link only with a URL', () => {
  const c = deHome.slice(deHome.indexOf('id="pkg-check"'), deHome.indexOf('id="pkg-launch"'));
  assert.match(c, /<span class="label label--lav item__badge">Vor dem nächsten Launch<\/span>/);
  assert.match(c, /<a class="btn btn--sm btn--primary item__cta" href="\/\?paket=check#contact">Technik-Check anfragen<\/a>/);
  assert.match(c, /<p class="item__call small">Auf Wunsch mit 20-Minuten-Gespräch\.<\/p>/);
  assert.match(c, /<p class="item__when">Termine ab Januar 2027<\/p>/);
  assert.ok(!/item__report/.test(c), 'no report link while the URL is empty');
  assert.match(enHome, /Before your next launch[\s\S]*?Request a tech check[\s\S]*?Dates from January 2027/);
  assert.equal(note(config, 'check_availability', 'de', new Date('2027-01-01T12:00:00Z')), '', 'gone after 31.12.2026');
  assert.equal(note(config, 'check_availability', 'de', new Date('2026-12-31T12:00:00Z')), 'Termine ab Januar 2027');
  const withReport = pages({ ...config, check_report_url: 'https://example.com/bericht.pdf' }, { live: {} }).find((x) => x.file === 'index.html').html;
  assert.match(withReport, /<a class="item__report text-link" href="https:\/\/example\.com\/bericht\.pdf">Beispielbericht ansehen<\/a>/);
});

test('4. launch day: the new FAQ answer (DE/EN) and «Gut zu wissen» on /launch-technik/', () => {
  const a = de.faq.items.find((x) => x.q === 'Sind Sie am Launch-Tag erreichbar?').a;
  assert.equal(a, 'Ja, telefonisch und per Chat in einem Zeitfenster, das wir vorher festlegen: zum Beispiel zwei Stunden ab Verkaufsstart und die letzten zwei Stunden vor Cart Close. Dieses Fenster rechne ich nach Aufwand ab (45 € pro Stunde). Außerhalb antworte ich bis 15 Uhr am nächsten Tag. Die meisten Pannen fangen wir vorher ab: mit Testkontakten, Testkäufen und einer Notfallkarte mit fertigen Antworten für Ihre Kundinnen. Ich begleite höchstens einen Launch pro Woche, damit ich wirklich da bin.');
  assert.ok(deHome.includes('Notfallkarte mit fertigen Antworten'));
  assert.match(en.faq.items.find((x) => x.q === 'Are you available on launch day?').a, /cart close[\s\S]*€45 per hour[\s\S]*at most one launch per week/);
  assert.match(byFile['launch-technik/index.html'], /Gut zu wissen[\s\S]*?Im Februar 2027 plane ich keine Launches ein\./);
  assert.equal(note(config, 'launch_break', 'de', new Date('2027-02-22T12:00:00Z')), '', 'gone from 22.2.2027');
});

test('5. contact form: «Wie sind Sie auf mich aufmerksam geworden?», hidden quelle, the inline script, no storage', () => {
  for (const h of [deHome, byFile['launch-technik/index.html']]) {
    assert.match(h, /<input type="hidden" name="quelle" value="">/);
    assert.match(h, /<label for="cf-gefunden">Wie sind Sie auf mich aufmerksam geworden\? \(optional\)<\/label><select class="field__select" id="cf-gefunden" name="gefunden"><option value="">Bitte wählen<\/option><option>Google-Suche<\/option><option>LinkedIn<\/option><option>Brief per Post<\/option><option>Empfehlung<\/option><option>Instagram<\/option><option>Sonstiges<\/option><\/select>/);
    assert.match(h, /<script>\(function\(\)\{var q=\(new URLSearchParams\(location\.search\)\.get\('quelle'\)\|\|''\)\.toLowerCase\(\);if\(!\/\^\[a-z0-9-\]\{1,40\}\$\/\.test\(q\)\)return;/);
  }
  assert.ok(deHome.indexOf('id="cf-termin"') < deHome.indexOf('id="cf-gefunden"'));
  assert.match(enHome, /How did you hear about me\? \(optional\)[\s\S]*?<option>Letter by post<\/option>/);
  const js = readFileSync(new URL('../assets/js/contact.js', import.meta.url), 'utf8');
  assert.match(js, /gefunden: f\.elements\.gefunden\?\.value \|\| '',/);
  assert.ok(!/document\.cookie|localStorage|sessionStorage/.test(js));
});

test('6. one positioning line: hero, Technik-Check card, meta and OG description', () => {
  const line = 'Ich teste Ihren Launch, bevor es Ihre Kundschaft tut.';
  assert.ok(de.hero.lead.startsWith(line));
  assert.equal(de.s6.pricing.cards.check.line, line);
  assert.match(deHome, new RegExp(`<meta name="description" content="${line.replace(/\./g, '\\.')}`));
  assert.match(deHome, new RegExp(`<meta property="og:description" content="${line.replace(/\./g, '\\.')}`));
  assert.ok(en.hero.lead.startsWith('I test your launch before your customers do.'));
  assert.match(enHome, /<meta name="description" content="I test your launch before your customers do\./);
  assert.ok(deHome.includes('Logik, Lösung, Live'), 'the brand slogan stays');
});

test('7. launch facts on /launch-technik/ after the package, «krank» FAQ, the hourly rule in 15-minute steps', () => {
  for (const [file, labels, when] of [
    ['launch-technik/index.html', ['Enthalten (ab 1.190 €)', 'Nicht enthalten', 'Zeitplan', 'Zahlung', 'Launch-Tag'], 'Am besten 4 bis 6 Wochen vor dem Launch melden, mindestens 3 Wochen.'],
    ['en/course-launch-tech/index.html', ['Included (from €1,190)', 'Not included', 'Timing', 'Payment', 'Launch day'], 'Ideally get in touch 4 to 6 weeks before the launch, at least 3 weeks.'],
  ]) {
    const h = byFile[file];
    const box = h.slice(h.indexOf('<aside class="svc-explain svc-facts"'), h.indexOf('</aside>', h.indexOf('<aside class="svc-explain svc-facts"')));
    assert.ok(h.indexOf('class="svc-pkgs"') > 0 && h.indexOf('class="svc-pkgs"') < h.indexOf('<aside class="svc-explain svc-facts"'), 'right after the package');
    assert.ok(!section(h, 'problem').includes('svc-explain'), 'not in the problem block any more');
    let at = 0;
    for (const l of labels) { const i = box.indexOf(`<strong>${l}:</strong>`); assert.ok(i > at, l); at = i; }
    assert.ok(box.includes(when));
  }
  const d = byFile['launch-technik/index.html'];
  assert.match(d, /Texte für E-Mails und Verkaufsseiten, Werbeanzeigen, Inhalte und Videos des Kurses, Rechtstexte, die Kosten Ihrer Tools\./);
  assert.match(d, /50 % bei Auftrag, 50 % nach dem Livegang\. Rechnung per E-Mail, zahlbar innerhalb von 14 Tagen\./);
  assert.match(d, /Begleitung am Launch-Tag, 30-Tage-Zusage\./);
  for (const [t, q, a] of [[de, 'Und wenn Sie krank sind?', 'Dann helfe ich trotzdem: Fast alles lässt sich remote vom Laptop aus lösen. Außerdem gehören alle Zugänge Ihnen, und jeder Ablauf ist dokumentiert.'], [en, 'And what if you are ill?', 'Then I still help: almost everything can be solved remotely from my laptop. Also, all accesses belong to you, and every flow is documented.']]) {
    assert.equal(t.faq.items.find((x) => x.q === q)?.a, a);
  }
  assert.ok(deHome.includes('Und wenn Sie krank sind?') && enHome.includes('And what if you are ill?'));
  for (const h of Object.values(byFile)) assert.ok(!/ab 5 Stunden|from 5 hours/i.test(h));
  assert.equal(de.s6.pricing.rows.support, '45 € pro Stunde für Pflege und alles außerhalb der Pakete, abgerechnet nach Aufwand in 15-Minuten-Schritten.');
  assert.equal(en.pricing.hourly, '€45 per hour for care and anything outside the packages, billed by effort in 15-minute steps.');
  assert.ok(deHome.includes('in 15-Minuten-Schritten') && enHome.includes('in 15-minute steps'));
});
