import { esc } from './util.mjs';

export function impressum(t, config) {
  return `<article class="doc"><h1>${esc(t.legalPage.h1)}</h1></article>`;
}

export function privacy(t, config, { buildDate }) {
  return `<article class="doc"><h1>${esc(t.privacyPage.h1)}</h1></article>`;
}

export function notFound(t) {
  return `<article class="doc"><h1>${esc(t.notFound.h1)}</h1><p><a href="${t.paths.home}">${esc(t.notFound.link)}</a></p></article>`;
}
