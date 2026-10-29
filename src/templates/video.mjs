import { esc, accent, absUrl, fill } from './util.mjs';

// Stage 6: the video «Der Weg einer Anmeldung» (50 s, German, no sound, text in the picture).
// Phones get the 9:16 file, wider screens the 16:9 one: <source media> is ignored for <video>, so
// there are two <video> elements switched by CSS, and assets/js/video.js sets src only on the
// visible one (data-src), so the hidden one never downloads. Posters: one <picture> over the frame.
const FILES = {
  wide: { video: '/assets/video/anmeldung-16x9.mp4', poster: '/assets/video/anmeldung-16x9', w: 1280, h: 720, vw: 1920, vh: 1080 },
  tall: { video: '/assets/video/anmeldung-9x16.mp4', poster: '/assets/video/anmeldung-9x16', w: 720, h: 1280, vw: 1080, vh: 1920 },
};
const PHONE = '(max-width: 599.98px)';

// «0:04» from seconds (the chapter chips, Stage 6b).
const clock = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
const chipIcon = '<svg class="vid__chip-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M5 3.5v9l7.5-4.5z"/></svg>';
const playIcon = '<svg class="vid__icon" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><circle cx="24" cy="24" r="23"/><path d="M19 15.5v17l14-8.5z"/></svg>';

function videoEl(kind, label) {
  const f = FILES[kind];
  return `<video class="vid__v vid__v--${kind}" controls playsinline muted preload="none" width="${f.vw}" height="${f.vh}" data-src="${f.video}" data-poster="${f.poster}.jpg" aria-label="${esc(label)}"></video>`;
}

// The figure itself (home block 3 and /launch-technik/ under the promise). id: the heading it belongs to.
export function videoFigure(t, labelledby = '') {
  const v = t.s6.video;
  // Stage 6b: each chip shows its time and a play icon; its name says what it does.
  const chips = v.chapters.map(([name, at]) => `<li><button class="vid__chip chip" type="button" data-t="${at}" aria-label="${esc(fill(t.s6.b.chapterLabel, { time: clock(at), name }))}">${chipIcon}<span class="vid__time">${clock(at)}</span> ${esc(name)}</button></li>`).join('');
  // The transcript also says what each scene shows (the film has no sound, WCAG 1.2.1).
  const lines = v.lines.map((l, i) => `<li><p>${esc(l)}</p><p class="vid__scene">${esc(t.s6.b.scenes[i])}</p></li>`).join('');
  return `<figure class="vid" data-video${labelledby ? ` aria-labelledby="${labelledby}"` : ''}>
<div class="vid__frame">
${videoEl('wide', v.label)}
${videoEl('tall', v.label)}
<picture class="vid__poster">
<source media="${PHONE}" type="image/webp" srcset="${FILES.tall.poster}.webp" width="${FILES.tall.w}" height="${FILES.tall.h}">
<source media="${PHONE}" srcset="${FILES.tall.poster}.jpg" width="${FILES.tall.w}" height="${FILES.tall.h}">
<source type="image/webp" srcset="${FILES.wide.poster}.webp" width="${FILES.wide.w}" height="${FILES.wide.h}">
<img src="${FILES.wide.poster}.jpg" width="${FILES.wide.w}" height="${FILES.wide.h}" loading="lazy" decoding="async" alt="">
</picture>
<button class="vid__play" type="button" hidden>${playIcon}<span>${esc(v.play)}</span></button>
<noscript><a class="vid__file" href="${FILES.wide.video}">${esc(v.play)} (MP4)</a></noscript>
</div>
<ol class="vid__chapters" role="list" aria-label="${esc(v.chaptersLabel)}">${chips}</ol>
<details class="vid__text faq__item">
<summary>${esc(v.transcript)}</summary>
<ol class="vid__lines" role="list">${lines}</ol>
</details>
</figure>`;
}

// Home block 3 (DE).
export function videoBlock(t) {
  const v = t.s6.video;
  return `<section class="section video bg-pist edge" id="video" aria-labelledby="video-title">
<div class="wrap">
<div class="section__head">
<h2 id="video-title" data-enter="lines">${accent(v.h2)}</h2>
<p class="lead">${esc(v.text)}</p>
</div>
${videoFigure(t)}
<p class="vid__cta"><span>${esc(t.s6.b.ctaLine)}</span> <a class="btn btn--secondary btn--sm" href="#contact">${esc(t.s6.b.cta)}</a></p>
</div>
</section>`;
}

// Home block 3 (EN, until the English video exists): the hero's four nodes as a static strip.
export function stepStrip(t) {
  const s = t.s6.strip;
  const f = t.hero.flow;
  return `<section class="section flowstrip bg-pist edge" id="path" aria-labelledby="path-title">
<div class="wrap">
<div class="section__head">
<h2 id="path-title" data-enter="lines">${accent(s.h2)}</h2>
<p class="lead">${esc(s.text)}</p>
</div>
<ol class="strip" role="list">
${f.nodes.map((n, i) => `<li class="strip__step card strip__step--${i + 1}"><span class="strip__node">${esc(n)}</span><p>${esc(f.lines[i])}</p></li>`).join('\n')}
</ol>
<p class="vid__cta"><span>${esc(t.s6.b.ctaLine)}</span> <a class="btn btn--secondary btn--sm" href="#contact">${esc(t.s6.b.cta)}</a></p>
</div>
</section>`;
}

// VideoObject for the pages that show the video (DE home, /launch-technik/).
export function videoLd(t, config) {
  const v = t.s6.video;
  return {
    '@type': 'VideoObject',
    '@id': absUrl(config, '/#video-anmeldung'),
    name: v.name,
    description: v.description,
    thumbnailUrl: [absUrl(config, `${FILES.wide.poster}.jpg`), absUrl(config, `${FILES.tall.poster}.jpg`)],
    uploadDate: '2026-10-29',
    duration: 'PT50S',
    contentUrl: absUrl(config, FILES.wide.video),
    inLanguage: 'de',
  };
}
