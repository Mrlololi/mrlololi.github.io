import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pages } from '../src/build.mjs';
import config from '../src/config.json' with { type: 'json' };

const all = pages(config, { buildDate: new Date('2026-10-15T12:00:00Z') });
const de = all.find((p) => p.file === 'index.html').html;
const en = all.find((p) => p.file === 'en/index.html').html;
const count = (html, re) => (html.match(re) || []).length;

test('hero: H1, CTAs to contact and pricing', () => {
  assert.match(de, /<h1[^>]*>Die Technik hinter Ihrem <span class="nowrap">Kurs-Launch\.<\/span> Gebaut, getestet, betreut\.<\/h1>/);
  assert.match(de, /<a class="btn btn--primary" href="#contact">Erstgespräch anfragen<\/a>/);
  assert.match(de, /<a class="text-link" href="#pricing">Preise ansehen<\/a>/);
});

test('run log: six real list items with final texts and locale times', () => {
  assert.equal(count(de, /<li class="run__step" data-seconds="[\d.]+">/g), 6);
  assert.match(de, /<span class="run__time">0,2 s<\/span>/);
  assert.match(en, /<span class="run__time">2\.3 s<\/span>/);
  assert.equal(count(de, /class="run__link"/g), 5, 'one connector per gap');
  assert.match(de, /<button class="run__replay" type="button" hidden>Ablauf erneut starten<\/button>/);
  assert.match(de, /id="run-status"[^>]*aria-live="polite"/);
  assert.match(de, /<p class="run__summary">6 Schritte, 2,3 Sekunden, 0 Fehler<\/p>/);
});

test('problems: four pairs, desktop diagram with four nodes, sr-only labels', () => {
  assert.equal(count(de, /<li class="pair" data-i="\d">/g), 4);
  assert.equal(count(de, /class="flow__node node node--(error|pending)" data-i="\d"/g), 4);
  assert.equal(count(de, /class="flow__gap" data-i="\d"/g), 4);
  assert.equal(count(de, /<span class="sr-only">Lösung: <\/span>/g), 4);
  assert.equal(count(en, /<span class="sr-only">Fix: <\/span>/g), 4);
});

test('pricing: anchors, details only where there is more text', () => {
  assert.match(de, /id="services"/);
  assert.match(de, /id="pricing"/);
  assert.equal(count(de, /<details class="price-details">/g), 3);
  assert.match(de, /<summary>Details<span class="sr-only">: Technik-Check<\/span><\/summary>/);
  assert.match(de, /Express unter 48 Stunden oder am Wochenende: plus 50 %\./);
  assert.match(de, /Bei Unternehmen mit gültiger UID in einem anderen EU-Mitgliedstaat geht die Steuerschuld auf den Leistungsempfänger über \(Reverse Charge\)\./);
  assert.match(en, /For businesses with a valid VAT ID in another EU member state, the reverse charge applies\./);
  assert.ok(!de.includes('Für Unternehmen in der EU mit UID gilt Reverse Charge'));
});

test('calculator: four numeric inputs and the pre-rendered default result', () => {
  assert.match(de, /<form class="calc instrument" id="ki-rechner"/);
  for (const id of ['emails', 'minutes', 'share', 'rate']) {
    assert.match(de, new RegExp(`<input id="calc-${id}" name="${id}" type="number" inputmode="numeric"`));
  }
  assert.match(de, /<strong data-out="h">31,2<\/strong>/);
  assert.match(de, /<strong data-out="savedH">21,8<\/strong>/);
  assert.match(de, /<strong data-out="savedEur">546<\/strong> € pro Monat/);
  assert.match(en, /roughly €<strong data-out="savedEur">546<\/strong> a month/);
  assert.match(de, /id="calc-live"[^>]*aria-live="polite"/);
});

test('process: numbered list of four steps', () => {
  assert.equal(count(de, /<li class="step">/g), 4);
});

test('references: case link opens in same tab with noopener; quotes typographic', () => {
  assert.match(de, /<a class="ext" href="https:\/\/alexandrafry\.ch" rel="noopener">alexandrafry\.ch<\/a>/);
  assert.ok(!de.includes('target="_blank"'));
  assert.match(de, /„Sehr gerne bestätige ich/);
  assert.match(de, /übertroffen hat\.“/);
  assert.match(en, /<blockquote lang="de">/);
  assert.match(en, /“He was also highly adaptable/);
});

test('about: responsive portrait with width and height, GeoAPP link', () => {
  assert.match(de, /<source type="image\/avif" srcset="\/assets\/img\/portrait-260\.avif 260w, \/assets\/img\/portrait-410\.avif 410w"/);
  assert.match(de, /<img src="\/assets\/img\/portrait-260\.jpg"[^>]*width="260" height="325"[^>]*loading="lazy"[^>]*alt="Iva Tsatskrialashvili"/);
  assert.match(de, /href="https:\/\/mrlololi\.github\.io\/Webprojekte\/geoapp\/"/);
});

test('faq: six details', () => {
  assert.equal(count(de, /<details class="faq__item">/g), 6);
});

test('contact: mailto with prefilled subject, LinkedIn and Malt', () => {
  assert.match(de, /href="mailto:ivikosha@gmail\.com\?subject=Anfrage%20%C3%BCber%20mrlololi\.com"/);
  // English subject chosen by Iva (15.10.2026): "Inquiry via mrlololi.com"
  assert.match(en, /href="mailto:ivikosha@gmail\.com\?subject=Inquiry%20via%20mrlololi\.com"/);
  assert.match(de, new RegExp(`href="${config.linkedin}"`));
  assert.match(de, new RegExp(`href="${config.malt}"`));
});
