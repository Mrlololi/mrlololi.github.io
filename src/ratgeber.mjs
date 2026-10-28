// Stage 5: Ratgeber articles are Markdown files in src/content/ratgeber/ (format: _FORMAT.md there).
// A small parser is enough for what the articles use: front matter, ## and ### headings,
// paragraphs, lists, **bold**, *italic*, `code` and [links](/path/).
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { esc } from './templates/util.mjs';

const DIR = fileURLToPath(new URL('./content/ratgeber/', import.meta.url));

export const slugify = (s) =>
  s.toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const inline = (s) =>
  esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, text, href) =>
      /^https?:/.test(href) ? `<a class="ext" href="${href}" target="_blank" rel="noopener">${text}</a>` : `<a href="${href}">${text}</a>`);

function body(md) {
  const toc = [];
  const html = md.trim().split(/\n\s*\n/).map((block) => {
    const lines = block.split('\n').map((l) => l.trim());
    const h = lines[0].match(/^(#{2,3})\s+(.+)$/);
    if (h && lines.length === 1) {
      const id = slugify(h[2]);
      if (h[1] === '##') toc.push({ id, text: h[2] });
      return `<h${h[1].length} id="${id}">${inline(h[2])}</h${h[1].length}>`;
    }
    if (lines.every((l) => /^- /.test(l))) return `<ul>${lines.map((l) => `<li>${inline(l.slice(2))}</li>`).join('')}</ul>`;
    if (lines.every((l) => /^\d+\. /.test(l))) return `<ol>${lines.map((l) => `<li>${inline(l.replace(/^\d+\. /, ''))}</li>`).join('')}</ol>`;
    return `<p>${inline(lines.join(' '))}</p>`;
  }).join('\n');
  return { html, toc };
}

// Front matter keys: title, description, slug, datePublished, dateModified (YYYY-MM-DD), package (service page key).
export function parseArticle(src) {
  const m = src.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error('Ratgeber article without front matter');
  const meta = Object.fromEntries(m[1].split('\n').filter(Boolean).map((l) => {
    const i = l.indexOf(':');
    return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  }));
  for (const k of ['title', 'description', 'slug', 'datePublished']) if (!meta[k]) throw new Error(`Ratgeber article: «${k}» missing`);
  const words = m[2].replace(/[#*`[\]()-]/g, ' ').split(/\s+/).filter(Boolean).length;
  return {
    ...meta,
    dateModified: meta.dateModified || meta.datePublished,
    minutes: Math.max(1, Math.ceil(words / 200)),
    ...body(m[2]),
  };
}

// All articles, newest first. Files starting with «_» (the format note) are skipped.
export function loadArticles(dir = DIR) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
    .map((f) => parseArticle(readFileSync(path.join(dir, f), 'utf8')))
    .sort((a, b) => b.datePublished.localeCompare(a.datePublished));
}
