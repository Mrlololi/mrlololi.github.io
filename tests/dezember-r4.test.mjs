// December release R4 «Kontaktformular» (docs/PROMPT_Dezember_Eine_Tuer_2026-11-24.md): required only name, e-mail
// and «Was hakt? Ein Satz reicht.»; the builder and the other fields in «Mehr Details (freiwillig)»; the new options
// with their own sentences; the information line instead of the consent box; «Und wenn Sie ausfallen?».
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import config from '../src/config.json' with { type: 'json' };
import de from '../src/content/de.mjs';
import en from '../src/content/en.mjs';
import { pages } from '../src/build.mjs';
import { briefMail } from '../assets/js/pure.js';

const by = Object.fromEntries(pages(config, { articles: [] }).map((p) => [p.file, p.html]));
const form = (f) => { const h = by[f]; return h.slice(h.indexOf('<form class="contact__form'), h.indexOf('</form>')); };
const js = readFileSync(new URL('../assets/js/contact.js', import.meta.url), 'utf8');
const frame = (t) => ({ ...t.s4.contact, subject: 's' });
const sentence = (t, choices) => briefMail(frame(t), choices).body.split('\n\n')[1];
const base = { what: 'einen Onlinekurs', via: 'Leadpages', issue: 'Zahlungen', start: 'in 4 Wochen' };

test('required are only name, e-mail and «Was hakt? Ein Satz reicht.»; everything else folds into «Mehr Details (freiwillig)»', () => {
  for (const f of ['index.html', 'launch-technik/index.html']) {
    const c = form(f);
    assert.deepEqual([...c.matchAll(/<(?:input|textarea|select)[^>]* id="([^"]+)"[^>]*\srequired/g)].map((m) => m[1]), ['cf-name', 'cf-email', 'cf-text'], f);
    const more = c.slice(c.indexOf('<details class="cf-more'), c.indexOf('</details>'));
    assert.ok(more.includes('<summary class="cf-more__sum">Mehr Details (freiwillig)</summary>'), f);
    for (const id of ['brief-what', 'brief-via', 'brief-issue', 'brief-start', 'cf-paket', 'cf-termin', 'cf-gefunden']) assert.ok(more.includes(`id="${id}"`), `${f} ${id}`);
  }
  // The preview stays (home), right under the details.
  assert.ok(form('index.html').includes('</details>\n<div class="brief__preview">\n<p class="brief__preview-title">So kommt Ihre Anfrage bei mir an</p>'));
  assert.ok(js.includes("if (key === 'text') return v ? '' : f.dataset.errText;"));
});

test('the new options, each with its own sentence (DE and EN)', () => {
  assert.equal(sentence(de, { ...base, issue: 'dem Kurszugang nach dem Kauf' }), 'ich verkaufe einen Onlinekurs über Leadpages. Es hakt beim Kurszugang nach dem Kauf. Start: in 4 Wochen.');
  assert.equal(sentence(de, { ...base, issue: 'weiß ich noch nicht' }), 'ich verkaufe einen Onlinekurs über Leadpages. Wo es hakt, weiß ich noch nicht. Start: in 4 Wochen.');
  assert.equal(sentence(de, { ...base, what: 'Ich frage für eine Kundin an (Agentur, OBM)' }), 'ich frage für eine Kundin an (Agentur, OBM). Sie verkauft über Leadpages. Es hakt bei Zahlungen. Start: in 4 Wochen.');
  assert.equal(sentence(de, { ...base, what: 'Ich frage für eine Kundin an (Agentur, OBM)', via: 'noch offen' }), 'ich frage für eine Kundin an (Agentur, OBM). Die Plattform ist noch offen. Es hakt bei Zahlungen. Start: in 4 Wochen.');
  assert.equal(sentence(de, base), 'ich verkaufe einen Onlinekurs über Leadpages. Es hakt bei Zahlungen. Start: in 4 Wochen.', 'the old sentence is unchanged');
  const e = { what: 'an online course', via: 'Leadpages', issue: 'payments', start: 'in 4 weeks' };
  assert.equal(sentence(en, { ...e, issue: 'not sure yet' }), 'I sell an online course via Leadpages. I am not sure yet where the problem is. Start: in 4 weeks.');
  assert.equal(sentence(en, { ...e, issue: 'the course access after purchase' }), 'I sell an online course via Leadpages. The course access after purchase is not working. Start: in 4 weeks.');
  assert.equal(sentence(en, { ...e, what: 'I am asking for a client (agency, OBM)' }), 'I am asking for a client (agency, OBM). The client sells via Leadpages. The problem is payments. Start: in 4 weeks.');
  for (const o of ['Ich frage für eine Kundin an (Agentur, OBM)', 'dem Kurszugang nach dem Kauf', 'weiß ich noch nicht']) assert.ok(form('index.html').includes(`<option>${o}</option>`), o);
});

test('the consent box became the information line; the key goes on for the Make scenario; the Datenschutz text matches', () => {
  const c = form('index.html');
  assert.ok(!c.includes('type="checkbox"'));
  assert.ok(c.includes('<p class="contact__info small">Ihre Angaben verwende ich nur, um Ihre Anfrage zu beantworten. Mehr in der <a class="contact__privacy" href="/datenschutz/#form">Datenschutzerklärung</a>.</p>'));
  assert.ok(c.includes('<input type="hidden" name="consent" value="true">'));
  assert.ok(js.includes('consent: true,'));
  const p = by['datenschutz/index.html'];
  assert.ok(p.includes('Ihre kurze Beschreibung, was hakt, die optional ausgewählten Satzteile') && p.includes('(Art. 6 Abs. 1 lit. b DSGVO)'));
  assert.ok(!/einverstanden|Einwilligung in die Verarbeitung meiner Anfrage/.test(c));
});

test('no tel: link, no fixed call slots in the form; «Und wenn Sie ausfallen?»', () => {
  for (const f of ['index.html', 'launch-technik/index.html', 'en/index.html']) assert.ok(!by[f].includes('href="tel:'), f);
  assert.ok(!/Montag|Dienstag|um \d{1,2} Uhr/.test(form('index.html').replace('z. B. vormittags, Di oder Do', '')));
  assert.equal(de.faq.items.find((x) => x.q === 'Und wenn Sie ausfallen?').a, 'Alles, was ich einrichte, ist ab dem ersten Tag in Ihrem Konto dokumentiert. Ihre Assistenz kann damit weiterarbeiten.');
  assert.ok(!de.faq.items.some((x) => /krank/.test(x.q)) && en.faq.items.some((x) => x.q === 'And if you are unavailable?'));
});

test('payload keys unchanged; the sentence values only after «Mehr Details» was opened', () => {
  for (const k of ['name:', 'email:', 'text:', 'termin:', 'gefunden:', 'quelle:', 'consent:', 'website:', 'elapsed_ms:', 'lang:', 'page:']) assert.ok(js.includes(`      ${k}`), k);
  assert.ok(js.includes("f.dataset.more || !f.querySelector('.cf-more') ? s.value : ''"));
  assert.equal(briefMail(frame(de), null).body, 'Hallo Iva,\n\nViele Grüße');
});
