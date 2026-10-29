import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pages } from '../src/build.mjs';
import config from '../src/config.json' with { type: 'json' };

const all = pages(config, { buildDate: new Date('2026-10-15T12:00:00Z') });
const de = all.find((p) => p.file === 'index.html').html;
const en = all.find((p) => p.file === 'en/index.html').html;
const count = (html, re) => (html.match(re) || []).length;

test('hero: H1, CTAs to contact and pricing', () => {
  assert.match(de, /<h1[^>]*>Die Technik hinter Ihrem <em class="accent">Kurs-Launch\.<\/em><\/h1>/);
  assert.match(de, /<a class="btn btn--primary" href="#contact">Kostenloses Erstgespräch<\/a>/);
  assert.match(de, /<a class="text-link" href="#pricing">Preise ansehen<\/a>/);
});

test('hero: flow diagram with four nodes and a chip with the photo', () => {
  assert.match(de, /<figure class="hero__flow demo" data-demo="hero" aria-label="Ablauf: Formular, ActiveCampaign, Zahlung, Kurs offen">/);
  for (const n of ['Formular', 'ActiveCampaign', 'Zahlung', 'Kurs offen']) assert.match(de, new RegExp(`<text[^>]*>${n}</text>`));
  assert.match(de, /<a class="hero__chip" href="#about"><picture><source type="image\/avif" srcset="\/assets\/img\/avatar-44\.avif 1x, \/assets\/img\/avatar-88\.avif 2x"><source type="image\/webp" srcset="\/assets\/img\/avatar-44\.webp 1x, \/assets\/img\/avatar-88\.webp 2x"><img src="\/assets\/img\/avatar-44\.jpg" srcset="\/assets\/img\/avatar-88\.jpg 2x" width="44" height="44" loading="lazy" decoding="async" alt=""><\/picture>Hallo, ich bin Iva<\/a>/);
  assert.match(en, /Hi, I'm Iva<\/a>/);
});

test('problems: three cards, problem first, then the solution panel', () => {
  assert.equal(count(de, /<li class="pc card">/g), 3);
  assert.equal(count(de, /<span class="label label--pink">Problem<\/span>/g), 3);
  assert.equal(count(de, /<div class="pc__fix"><span class="label label--pist">Lösung<\/span>/g), 3);
  assert.equal(count(en, /<span class="label label--pist">Fix<\/span>/g), 3);
  assert.ok(!de.includes('flow__node'), 'old repair diagram gone');
});

test('process: numbered list of four steps', () => {
  assert.equal(count(de, /<li class="step">/g), 4);
});

test('references: case link opens in a new tab with noopener (Fixes 21.10.2026); quotes typographic', () => {
  assert.match(de, /<a class="ext" href="https:\/\/alexandrafry\.ch" target="_blank" rel="noopener">alexandrafry\.ch<span class="sr-only"> \(öffnet in neuem Tab\)<\/span><\/a>/);
  assert.match(de, /„Sehr gerne bestätige ich/);
  assert.match(de, /übertroffen hat\.“/);
  assert.match(en, /<blockquote lang="de">/);
  assert.match(en, /“He was also highly adaptable/);
});

test('about: Hallstatt photo 1x/2x, path line', () => {
  assert.match(de, /<source type="image\/avif" srcset="\/assets\/img\/about-340\.avif 340w, \/assets\/img\/about-680\.avif 680w"/);
  assert.match(de, /<img src="\/assets\/img\/about-340\.jpg"[^>]*width="340" height="425"[^>]*loading="lazy"[^>]*alt="Iva Tsatskrialashvili"/);
  assert.ok(!de.includes('portrait-'), 'the CV photo is gone');
  assert.match(de, /<ol class="path" role="list" aria-label="Mein Weg">/);
  assert.equal(count(de, /<li class="path__stop">/g), 4);
});

test('faq: seven details, the tech question first', () => {
  assert.equal(count(de, /<details class="faq__item" id="faq-\d">/g), 8);
  assert.ok(de.indexOf('Muss ich mich mit Technik auskennen?') < de.indexOf('Arbeiten Sie auch remote?'));
});

test('contact: mailto with prefilled subject, LinkedIn and Malt', () => {
  assert.match(de, /href="mailto:hello@mrlololi\.com\?subject=Anfrage%20%C3%BCber%20mrlololi\.com"/);
  // English subject chosen by Iva (15.10.2026): "Inquiry via mrlololi.com"
  assert.match(en, /href="mailto:hello@mrlololi\.com\?subject=Enquiry%20via%20mrlololi\.com"/);
  assert.match(de, new RegExp(`href="${config.linkedin}"`));
  assert.match(de, new RegExp(`href="${config.malt}"`));
});
