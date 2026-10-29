// Stage 6, the video «Der Weg einer Anmeldung»: two <video> elements (16:9 and 9:16) switched by
// CSS. Only the visible one gets its src (from data-src), on the first press of the big play
// target or a chapter chip, so the other file is never downloaded. Chips jump and play.
export function init() {
  for (const fig of document.querySelectorAll('[data-video]')) setup(fig);
}

function setup(fig) {
  const play = fig.querySelector('.vid__play');
  const poster = fig.querySelector('.vid__poster');
  const visible = () => [...fig.querySelectorAll('.vid__v')].find((v) => v.offsetParent !== null || getComputedStyle(v).display !== 'none');
  const ready = () => {
    const v = visible();
    if (!v.src) {
      v.poster = v.dataset.poster;
      v.src = v.dataset.src;
    }
    fig.classList.add('is-playing');
    poster.hidden = true;
    play.hidden = true;
    return v;
  };
  const start = (at) => {
    const v = ready();
    const go = () => {
      if (at != null) v.currentTime = at;
      v.play().catch(() => {});
    };
    if (v.readyState >= 1 || at == null) go();
    else v.addEventListener('loadedmetadata', go, { once: true });
    v.focus({ preventScroll: true });
  };
  play.hidden = false;
  play.addEventListener('click', () => start());
  for (const chip of fig.querySelectorAll('.vid__chip')) chip.addEventListener('click', () => start(Number(chip.dataset.t)));
}
