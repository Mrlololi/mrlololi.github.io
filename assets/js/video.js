// Stage 6, the video «Der Weg einer Anmeldung». Stage 6g (4.11.2026): one <video>. The first press of
// the play button loads the file for the orientation (9:16 on a phone held upright, else 16:9),
// hides the poster and the button and gives the native controls (one set of controls at a time).
// When the phone turns, file and poster switch, keeping the position and whether it was playing; the
// poster attribute shows until the new frames are there, so the frame is never empty. The chapter
// buttons in the transcript jump there and play.
export function init() {
  for (const fig of document.querySelectorAll('[data-video]')) setup(fig);
}

function setup(fig) {
  const v = fig.querySelector('.vid__v');
  const play = fig.querySelector('.vid__play');
  const poster = fig.querySelector('.vid__poster');
  if (!v) return;
  const tall = matchMedia(v.dataset.media);
  const kind = () => (tall.matches ? 'tall' : 'wide');
  const file = () => v.dataset[kind()];
  const still = () => v.dataset[kind() === 'tall' ? 'posterTall' : 'posterWide'];
  const jump = (at) => {
    v.currentTime = at;
    if (v.readyState < 1) v.addEventListener('loadedmetadata', () => { v.currentTime = at; }, { once: true });
  };
  // With preload="none" nothing loads (no metadata either) until play(): play first, then jump.
  const start = (at) => {
    if (!v.getAttribute('src')) { v.poster = still(); v.src = file(); }
    fig.classList.add('is-playing');
    poster.hidden = true;
    play.hidden = true;
    v.controls = true;
    v.removeAttribute('tabindex');
    if (at != null) jump(at);
    v.play().catch(() => {});
    v.focus({ preventScroll: true });
  };
  tall.addEventListener('change', () => {
    fig.dataset.kind = kind();
    if (!v.getAttribute('src')) return; // still the poster: the <picture> switches by itself
    const at = v.currentTime;
    const playing = !v.paused && !v.ended;
    v.poster = still();
    v.src = file();
    v.load();
    jump(at);
    if (playing) v.play().catch(() => {});
  });
  fig.dataset.kind = kind();
  play.hidden = false;
  play.addEventListener('click', () => start());
  for (const chip of fig.querySelectorAll('.vid__chip')) chip.addEventListener('click', () => start(Number(chip.dataset.t)));
}
