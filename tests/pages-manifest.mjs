// R0 (December release, 24.11.2026): the one page manifest. Every count of pages in the tests comes from here,
// not from numbers repeated in several files. A new page = one line here (and its own test file).
//   index: in the sitemap (no noindex)   twin: the page in the other language (hreflang pair, + x-default)
// Not a test file itself (npm test runs tests/*.test.mjs).
export const PAGES = {
  'index.html': { lang: 'de', index: true, twin: 'en/index.html' },
  'impressum/index.html': { lang: 'de', index: true, twin: 'en/legal-notice/index.html' },
  'datenschutz/index.html': { lang: 'de', index: true, twin: 'en/privacy/index.html' },
  'launch-technik/index.html': { lang: 'de', index: true, twin: 'en/course-launch-tech/index.html' },
  'e-mails-landen-im-spam/index.html': { lang: 'de', index: true, twin: 'en/emails-going-to-spam/index.html' },
  'activecampaign-einrichten/index.html': { lang: 'de', index: true, twin: 'en/activecampaign-setup/index.html' },
  'ki-antwortentwuerfe/index.html': { lang: 'de', index: true, twin: 'en/ai-reply-drafts/index.html' },
  'website-one-pager/index.html': { lang: 'de', index: true, twin: 'en/one-page-website/index.html' },
  'en/index.html': { lang: 'en', index: true, twin: 'index.html' },
  'en/legal-notice/index.html': { lang: 'en', index: true, twin: 'impressum/index.html' },
  'en/privacy/index.html': { lang: 'en', index: true, twin: 'datenschutz/index.html' },
  'en/course-launch-tech/index.html': { lang: 'en', index: true, twin: 'launch-technik/index.html' },
  'en/emails-going-to-spam/index.html': { lang: 'en', index: true, twin: 'e-mails-landen-im-spam/index.html' },
  'en/activecampaign-setup/index.html': { lang: 'en', index: true, twin: 'activecampaign-einrichten/index.html' },
  'en/ai-reply-drafts/index.html': { lang: 'en', index: true, twin: 'ki-antwortentwuerfe/index.html' },
  'en/one-page-website/index.html': { lang: 'en', index: true, twin: 'website-one-pager/index.html' },
  // German only, indexable, no hreflang.
  'qualitaet/index.html': { lang: 'de', index: true, twin: null },
  'werkzeuge/ein-kauf/index.html': { lang: 'de', index: true, twin: null },
  'musterbericht/technik-check/index.html': { lang: 'de', index: true, twin: null },
  // Not in the sitemap.
  'danke/index.html': { lang: 'de', index: false, twin: null },
  'en/thanks/index.html': { lang: 'en', index: false, twin: null },
  '404.html': { lang: 'de', index: false, twin: null },
};

export const FILES = Object.keys(PAGES).sort();
export const TOTAL = FILES.length;
export const INDEXABLE = Object.values(PAGES).filter((p) => p.index).length;
// Each page of a pair carries three alternates (de, en, x-default), in the head and in the sitemap.
export const PAIRED = Object.values(PAGES).filter((p) => p.index && p.twin).length;
export const ALTERNATES = PAIRED * 3;
