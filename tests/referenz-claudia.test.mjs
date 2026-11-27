// Referenz Claudia Witticke (docs/PROMPT_Referenz_Claudia_live_2026-11-25.md): her selection of 25.11.2026 on the
// built pages, word for word; nothing she did not select. «Before push» checks of the brief.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import config from '../src/config.json' with { type: 'json' };
import de from '../src/content/de.mjs';
import en from '../src/content/en.mjs';
import { pages } from '../src/build.mjs';
import { scan } from '../src/qa/wortfilter.mjs';

const by = Object.fromEntries(pages(config, { articles: [] }).map((p) => [p.file, p.html]));
const SHOWS = ['index.html', 'en/index.html', 'launch-technik/index.html', 'en/course-launch-tech/index.html', 'activecampaign-einrichten/index.html', 'en/activecampaign-setup/index.html'];
const text = (h) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/\s+/g, ' ');
// The nine sentences she allowed; «[…]» between non-adjacent ones.
const S = [
  'Nach einer kurzen Einarbeitungszeit hat sich Iva schnell und gründlich in mein Unternehmen eingedacht.',
  'Er hat verstanden, wie mein Business funktioniert, wen wir ansprechen und worauf es in unserer Kommunikation ankommt.',
  'Aufgaben erledigt er so, wie wir sie besprochen haben, und er hält Termine ein.',
  'Er bringt von sich aus Verbesserungsvorschläge ein.',
  'Iva hat unsere Landing Pages überarbeitet und optimiert.',
  'Die Conversion Rate ist dadurch um 70 bis 80 Prozent gestiegen.',
  'Außerdem hat er Automatisierungen gebaut, die uns im Alltag Arbeit abnehmen und Personalaufwand sparen.',
  'Iva ist ein angenehmer und lösungsorientierter Partner.',
  'Wer technisches Know-how mit Mitdenken verbinden möchte, ist bei ihm gut aufgehoben.',
];
const c = de.refs.case2;

test('every quote is made of her nine sentences only, in her order, «[…]» between non-adjacent ones', () => {
  for (const t of [de, en]) {
    for (const k of ['quote', 'heroQuote', 'acQuote', 'longQuote']) {
      const parts = t.refs.case2[k].text.split(' […] ').flatMap((g) => g.match(/[^.]+\./g).map((x) => x.trim()));
      const idx = parts.map((p) => S.indexOf(p));
      assert.ok(idx.every((i) => i >= 0), `${t.lang} ${k}: ${parts.join(' | ')}`);
      assert.deepEqual([...idx].sort((a, b) => a - b), idx, `${t.lang} ${k}: in her order`);
    }
  }
  assert.equal(c.quote.text, 'Er hat verstanden, wie mein Business funktioniert, wen wir ansprechen und worauf es in unserer Kommunikation ankommt. […] Iva hat unsere Landing Pages überarbeitet und optimiert. Die Conversion Rate ist dadurch um 70 bis 80 Prozent gestiegen.');
  assert.equal(c.heroQuote.text, `${S[7]} ${S[8]}`);
  assert.equal(c.acQuote.text, S[6]);
  assert.equal(c.longQuote.text, `${S[0]} ${S[1]} ${S[2]} […] ${S[4]} […] ${S[6]}`);
});

test('the home card: tag, logo, link on its own line, title, text, seven tools, scrolling page preview, quote with photo, «Zusammenarbeit 2026.»', () => {
  const card = by['index.html'].match(/<li class="ref card ref--course ref--claudia[^"]*">[\s\S]*?<\/li>\n<li class="ref card ref--site/)[0];
  assert.ok(card.includes('<span class="label label--lav">Online-Nähkurse</span><picture class="ref__logo">'));
  assert.ok(card.includes('<h3>Launch-Technik für die Online-Nähkurse von Claudia Witticke</h3>\n<a class="ext ref__site" href="https://claudiawitticke.com/"'));
  assert.ok(card.includes('<p>ActiveCampaign- und Zapier-Abläufe für Anmeldung, Launch, Onboarding und Zahlungserinnerungen, Landingpages in Leadpages, Zahlungen mit Stripe, Rechnungen mit Quaderno, Kurszugänge in GoHighLevel, Live-Termine mit Zoom, Kundenservice in GrooveHQ.</p>'));
  const firstList = card.match(/<ul class="ref__tools" role="list">([\s\S]*?)<\/ul>/)[1];
  assert.deepEqual([...firstList.matchAll(/<li>([^<]+)<\/li>/g)].map((m) => m[1]), ['ActiveCampaign', 'Zapier', 'Leadpages', 'Stripe', 'Quaderno', 'Zoom', 'GrooveHQ']);
  assert.ok(card.includes('case-claudia-long-640.jpg') && card.includes('class="quote__photo"'));
  assert.ok(card.includes('<span>Claudia Witticke, Online-Nähkurse, claudiawitticke.com</span>'));
  assert.ok(card.includes('<p class="ref__honest">Zusammenarbeit 2026.</p>'));
});

test('hero quote, the /launch-technik/ case (list, long quote, two shots), the /activecampaign-einrichten/ card, «Über mich»', () => {
  const h = by['index.html'];
  assert.ok(text(h.slice(h.indexOf('<section class="hero'), h.indexOf('</section>'))).includes(`${S[7]} ${S[8]}`));
  const l = text(by['launch-technik/index.html']);
  for (const x of c.changes) assert.ok(l.includes(x), x);
  assert.equal(c.changes.length, 6);
  assert.ok(by['launch-technik/index.html'].includes('claudia-overlock-640.jpg') && by['launch-technik/index.html'].includes('claudia-advent-640.jpg'));
  const a = by['activecampaign-einrichten/index.html'];
  assert.ok(a.includes('<article class="svc-card svc-card--claudia">') && text(a).includes(S[6]));
  assert.ok(text(h).includes('2026 auch für die Online-Kursanbieterin Claudia Witticke.'));
  for (const f of ['en/index.html', 'en/course-launch-tech/index.html', 'en/activecampaign-setup/index.html']) assert.ok(by[f].includes('<p class="quote__translation">Translation:'), f);
});

test('nothing she did not select: forbidden words absent on every page that shows her (and inside her blocks)', () => {
  for (const f of SHOWS) {
    const t = text(by[f]);
    for (const w of ['seit April', 'since April', 'Laufende Zusammenarbeit', 'Ongoing work', 'Ecamm', 'So' + 'mba', 'wartet nicht auf Anweisungen', S[3]]) assert.ok(!t.includes(w), `${f}: ${w}`);
    // «laufend» and «Mitgliederbereich» occur in the general package texts; inside her blocks never.
    const blocks = [...by[f].matchAll(/<(li|article) class="[^"]*(?:ref--claudia|svc-case--claudia|svc-card--claudia)[\s\S]*?<\/\1>|<figure class="quote quote--claudia[\s\S]*?<\/figure>/g)].map((m) => text(m[0])).join(' ');
    assert.ok(blocks.length > 100, `${f}: her blocks found`);
    for (const w of ['laufend', 'Laufend', 'Mitgliederbereich', 'members area', 'seit', 'heute', 'zwei Fehler', 'Gutscheinkauf']) assert.ok(!blocks.includes(w), `${f}: «${w}» in her block`);
  }
  // The 70-80 % only inside her quote, never as Iva's own claim.
  for (const [f, h] of Object.entries(by)) {
    const t = text(h).split(S[5]).join('');
    assert.ok(!/70 bis 80|70 to 80|\b70\s?[-–]\s?80\s?%/.test(t.replace(/As a result, the conversion rate rose by 70 to 80 percent\./g, '')), f);
  }
});

test('Wortfilter: no hit on the pages that show her; the two allow entries are her quote sentences', () => {
  const hits = scan(SHOWS.map((f) => ({ page: `/${f.replace(/index\.html$/, '')}`, html: by[f] })), de);
  assert.deepEqual(hits, []);
});
