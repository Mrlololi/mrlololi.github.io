import { esc, accent, absUrl, fill } from './util.mjs';
import { viewTabs } from './runlog.mjs';

// Stage 6: the video «Der Weg einer Anmeldung» (50 s, German, no sound, text in the picture).
// Stage 6g (4.11.2026): one <video> element. Phones held upright get the 9:16 file, everything else
// the 16:9 one; assets/js/video.js picks the file on the first play and switches file and poster when
// the phone turns, keeping the position and play state, so the frame is never empty. Before the
// first play the <picture> poster (switched by the same media query) covers the frame, with one
// play button; after it the native controls take over (never both at once).
const FILES = {
  wide: { video: '/assets/video/anmeldung-16x9.mp4', poster: '/assets/video/anmeldung-16x9', w: 1280, h: 720, vw: 1920, vh: 1080 },
  tall: { video: '/assets/video/anmeldung-9x16.mp4', poster: '/assets/video/anmeldung-9x16', w: 720, h: 1280, vw: 1080, vh: 1920 },
};
export const TALL = '(orientation: portrait) and (max-width: 767px)';

// «0:04» from seconds (the chapter chips, Stage 6b).
const clock = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
const playIcon = '<svg class="vid__icon" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><circle cx="24" cy="24" r="23"/><path d="M19 15.5v17l14-8.5z"/></svg>';

function videoEl(label) {
  const { wide, tall } = FILES;
  return `<video class="vid__v" playsinline muted preload="none" tabindex="-1" width="${wide.vw}" height="${wide.vh}" data-wide="${wide.video}" data-tall="${tall.video}" data-poster-wide="${wide.poster}.jpg" data-poster-tall="${tall.poster}.jpg" data-media="${TALL}" aria-label="${esc(label)}"></video>`;
}

// The figure itself (home block 3 and /launch-technik/ under the promise). id: the heading it belongs to.
export function videoFigure(t, labelledby = '') {
  const v = t.s6.video;
  // Stage 6g: the chapters as a small list inside the transcript (no big buttons under a 50 s film).
  const chips = v.chapters.map(([name, at]) => `<li><button class="vid__chip" type="button" data-t="${at}" aria-label="${esc(fill(t.s6.b.chapterLabel, { time: clock(at), name }))}"><span class="vid__time">${clock(at)}</span> ${esc(name)}</button></li>`).join('');
  // The transcript also says what each scene shows (the film has no sound, WCAG 1.2.1).
  const lines = v.lines.map((l, i) => `<li><p>${esc(l)}</p><p class="vid__scene">${esc(t.s6.b.scenes[i])}</p></li>`).join('');
  return `<figure class="vid" data-video${labelledby ? ` aria-labelledby="${labelledby}"` : ''}>
<div class="vid__frame">
${videoEl(v.label)}
<picture class="vid__poster">
<source media="${TALL}" type="image/webp" srcset="${FILES.tall.poster}.webp" width="${FILES.tall.w}" height="${FILES.tall.h}">
<source media="${TALL}" srcset="${FILES.tall.poster}.jpg" width="${FILES.tall.w}" height="${FILES.tall.h}">
<source type="image/webp" srcset="${FILES.wide.poster}.webp" width="${FILES.wide.w}" height="${FILES.wide.h}">
<img src="${FILES.wide.poster}.jpg" width="${FILES.wide.w}" height="${FILES.wide.h}" loading="lazy" decoding="async" alt="">
</picture>
<button class="vid__play" type="button" hidden>${playIcon}<span>${esc(v.play)}</span></button>
<noscript><a class="vid__file" href="${FILES.wide.video}">${esc(v.play)} (MP4)</a></noscript>
</div>
<details class="vid__text faq__item">
<summary>${esc(v.transcript)}</summary>
<p class="vid__chapters-title" id="vid-chapters">${esc(v.chaptersTitle)}</p>
<ol class="vid__chapters" role="list" aria-labelledby="vid-chapters">${chips}</ol>
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
${viewTabs(t, videoFigure(t))}
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
${viewTabs(t, `<ol class="strip" role="list">
${f.nodes.map((n, i) => `<li class="strip__step card strip__step--${i + 1}"><span class="strip__node">${esc(n)}</span><p>${esc(f.lines[i])}</p></li>`).join('\n')}
</ol>`)}
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
