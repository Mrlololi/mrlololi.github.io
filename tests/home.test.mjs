import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pages } from '../src/build.mjs';
import config from '../src/config.json' with { type: 'json' };

const all = pages(config, { buildDate: new Date('2026-10-15T12:00:00Z') });
const de = all.find((p) => p.file === 'index.html').html;
const en = all.find((p) => p.file === 'en/index.html').html;
const count = (html, re) => (html.match(re) || []).length;

test('hero: H1, CTAs to contact and pricing', () => {
  assert.match(de, /<h1[^>]*>Die Technik hinter Ihrem <span class="nowrap">Kurs-Launch\.<\/span> <em class="accent">Gebaut, getestet, betreut\.<\/em><\/h1>/);
  assert.match(de, /<a class="btn btn--primary" href="#contact">Erstgespräch anfragen<\/a>/);
  assert.match(de, /<a class="text-link" href="#pricing">Preise ansehen<\/a>/);
});

test('hero: flow diagram with four nodes and a chip with the photo', () => {
  assert.match(de, /<figure class="hero__flow" aria-label="Ablauf: Formular, ActiveCampaign, Zahlung, Kurs offen">/);
  for (const n of ['Formular', 'ActiveCampaign', 'Zahlung', 'Kurs offen']) assert.match(de, new RegExp(`<text[^>]*>${n}</text>`));
  assert.match(de, /<p class="hero__chip"><picture><source type="image\/avif" srcset="\/assets\/img\/avatar-44\.avif 1x, \/assets\/img\/avatar-88\.avif 2x"><source type="image\/webp" srcset="\/assets\/img\/avatar-44\.webp 1x, \/assets\/img\/avatar-88\.webp 2x"><img src="\/assets\/img\/avatar-44\.jpg" srcset="\/assets\/img\/avatar-88\.jpg 2x" width="44" height="44" loading="lazy" decoding="async" alt=""><\/picture>Hallo, ich bin Iva<\/p>/);
  assert.match(en, /Hi, I'm Iva<\/p>/);
});

test('run log: own section after the problems, six steps, replay', () => {
  assert.match(de, /<section class="section signup" id="signup" aria-labelledby="signup-title">/);
  assert.match(de, /<h2 id="signup-title">Was passiert, wenn sich jemand <em class="accent">anmeldet<\/em><\/h2>/);
  assert.ok(de.indexOf('id="problems"') < de.indexOf('id="signup"') && de.indexOf('id="signup"') < de.indexOf('id="services"'), 'order: problems, signup, services');
  assert.equal(count(de, /<li class="run__step" data-seconds="[\d.]+">/g), 6);
  assert.match(de, /<span class="run__time">0,2 s<\/span>/);
  assert.match(en, /<span class="run__time">2\.3 s<\/span>/);
  assert.equal(count(de, /class="run__link"/g), 5, 'one connector per gap');
  assert.match(de, /<button class="run__replay" type="button" hidden>Nochmal abspielen<\/button>/);
  assert.match(de, /id="run-status"[^>]*aria-live="polite"/);
  assert.match(de, /<p class="run__summary">6 Schritte, 2,3 Sekunden, 0 Fehler<\/p>/);
});

test('problems: three cards, problem first, then the solution panel', () => {
  assert.equal(count(de, /<li class="pc">/g), 3);
  assert.equal(count(de, /<span class="pc__tag pc__tag--problem">Problem<\/span>/g), 3);
  assert.equal(count(de, /<div class="pc__fix"><span class="pc__tag pc__tag--fix">Lösung<\/span>/g), 3);
  assert.equal(count(en, /<span class="pc__tag pc__tag--fix">Fix<\/span>/g), 3);
  assert.ok(!de.includes('flow__node'), 'old repair diagram gone');
});

test('pricing: pastel groups, one details, projects note, care plan, hourly line', () => {
  assert.match(de, /id="services"/);
  assert.match(de, /id="pricing"/);
  assert.equal(count(de, /<section class="tariff__group tariff__group--\d"/g), 3);
  assert.equal(count(de, /<details class="price-details">/g), 1);
  assert.match(de, /<summary>Details<span class="sr-only">: Technik-Check<\/span><\/summary>/);
  assert.match(de, /<p class="tariff__note">Festpreis nach dem Briefing\.<\/p>/);
  assert.match(de, /<p class="item__extra"><strong>Optional: Pflege 90 € pro Monat<\/strong>, monatlich kündbar:/);
  assert.match(de, /<p class="tariff__hourly">Alles außerhalb der Pakete: 45 € pro Stunde\.<\/p>/);
  assert.ok(!/Express|item__tiers|Retainer/.test(de), 'removed offers stay removed');
  assert.ok(de.indexOf('KI im Kundenservice') < de.indexOf('id="ki-rechner"'), 'calculator right after the KI item');
  assert.match(de, /Bei Unternehmen mit gültiger UID in einem anderen EU-Mitgliedstaat geht die Steuerschuld auf den Leistungsempfänger über \(Reverse Charge\)\./);
  assert.match(en, /For businesses with a valid VAT ID in another EU member state, the reverse charge applies\./);
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

test('about: Hallstatt photo 1x/2x, path line, link to the own projects', () => {
  assert.match(de, /<source type="image\/avif" srcset="\/assets\/img\/about-340\.avif 340w, \/assets\/img\/about-680\.avif 680w"/);
  assert.match(de, /<img src="\/assets\/img\/about-340\.jpg"[^>]*width="340" height="425"[^>]*loading="lazy"[^>]*alt="Iva Tsatskrialashvili"/);
  assert.ok(!de.includes('portrait-'), 'the CV photo is gone');
  assert.match(de, /<ol class="path" role="list" aria-label="Mein Weg">/);
  assert.equal(count(de, /<li class="path__stop">/g), 4);
  assert.match(de, /<a href="https:\/\/mrlololi\.com\/Webprojekte\/">Eigene Projekte: GeoAPP und KittyCats<\/a>/);
});

test('faq: seven details, the tech question first', () => {
  assert.equal(count(de, /<details class="faq__item">/g), 7);
  assert.ok(de.indexOf('Muss ich mich mit Technik auskennen?') < de.indexOf('Arbeiten Sie auch remote?'));
});

test('contact: mailto with prefilled subject, LinkedIn and Malt', () => {
  assert.match(de, /href="mailto:hello@mrlololi\.com\?subject=Anfrage%20%C3%BCber%20mrlololi\.com"/);
  // English subject chosen by Iva (15.10.2026): "Inquiry via mrlololi.com"
  assert.match(en, /href="mailto:hello@mrlololi\.com\?subject=Inquiry%20via%20mrlololi\.com"/);
  assert.match(de, new RegExp(`href="${config.linkedin}"`));
  assert.match(de, new RegExp(`href="${config.malt}"`));
});
