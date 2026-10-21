// Small helpers shared by all templates.

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Replaces {name} placeholders; values are inserted as given (escape before if needed).
export const fill = (str, vars) => str.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));

export const absUrl = (config, path) => config.site_url.replace(/\/$/, '') + path;

// "0,2 s" in German, "0.2 s" in English.
export const seconds = (value, locale) =>
  `${new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value)} s`;

// Typographic quotes by the quote's own language.
export const quoted = (text, lang) => (lang === 'de' ? `„${text}“` : `“${text}”`);

export const formatDate = (date, locale) =>
  locale.startsWith('de')
    ? new Intl.DateTimeFormat('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Vienna' }).format(date)
    : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Vienna' }).format(date);

// Escaped text where hyphenated words never break at their hyphen (for big headlines).
export const keepHyphenated = (s) => esc(s).replace(/(\S+-\S+)/g, '<span class="nowrap">$1</span>');

// Escaped text with one *accent* turned into the italic serif <em> (Stage 2 headings).
export const accent = (s) => esc(s).replace(/\*([^*]+)\*/g, '<em class="accent">$1</em>');

// Big headlines: accent plus hyphenated words that never break at their hyphen.
export const headline = (s) => accent(s).replace(/(^|\s)([^\s<>*]+-[^\s<>*]+)/g, '$1<span class="nowrap">$2</span>');

// Joins template parts, dropping false/null/undefined.
export const join = (parts) => parts.filter((p) => p !== false && p != null && p !== '').join('\n');
