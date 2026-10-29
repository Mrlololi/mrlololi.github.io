// Stage 4: small pure helpers shared by the build (src/templates) and the browser; tested in tests/stage4.test.mjs.

// First word of a typed name: «Anna K.» -> «Anna», «Ann» -> «Ann». An empty field uses the fallback.
export function firstName(full, fallback = '') {
  const words = String(full).trim().split(/\s+/).filter(Boolean);
  return words.length ? words[0] : fallback ? firstName(fallback) : '';
}

// RFC 6068: every part percent-encoded, line breaks as CRLF.
export function mailtoHref(email, subject, body) {
  const enc = (s) => encodeURIComponent(s.replace(/\r?\n/g, '\r\n'));
  return `mailto:${email}?subject=${enc(subject)}&body=${enc(body)}`;
}

// The contact brief: one sentence from the four choices, framed as a short e-mail.
// Stage 6b: an open platform gets its own sentence (c.sentenceOpen when the choice is c.viaOpen),
// and in German the text after «Hallo Iva,» goes on in lower case (c.lower).
export function briefMail(c, choices) {
  const tpl = c.sentenceOpen && choices.via === c.viaOpen ? c.sentenceOpen : c.sentence;
  const sentence = tpl.replace(/\{(\w+)\}/g, (m, k) => choices[k] ?? m);
  const first = c.lower ? sentence[0].toLowerCase() : sentence[0].toUpperCase();
  return { subject: c.subject, body: `${c.greeting}\n\n${first}${sentence.slice(1)}\n\n${c.closing}` };
}

export const SUPPORT_RATE = 45;
export const supportTotal = (hours) => hours * SUPPORT_RATE;
