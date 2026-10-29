// Stage 6, FAQ «reading beat»: on the first open of a question Logik (40 px) tilts and moves his
// eyes as if reading, three dots, 350 ms (Stage 6b, shorter), then the answer fades in and Logik
// stays next to it. The answer keeps its place while hidden (laid out, not shown), so nothing jumps. Reopening is instant; so is any
// open from the keyboard, and everything under reduced motion.
const BEAT = 350;

export function init({ reduceMotion }) {
  const list = document.querySelector('#faq .faq__list');
  const tpl = document.getElementById('faq-reader');
  if (!list || !tpl) return;
  const seen = new Set();
  let keyboard = false;
  list.addEventListener('keydown', () => { keyboard = true; });
  list.addEventListener('pointerdown', () => { keyboard = false; });
  for (const item of list.querySelectorAll('.faq__item')) {
    item.addEventListener('toggle', () => {
      if (!item.open || seen.has(item)) return;
      seen.add(item);
      if (keyboard || reduceMotion.matches) return;
      const a = item.querySelector('.faq__a');
      const reader = tpl.content.firstElementChild.cloneNode(true);
      a.prepend(reader);
      item.classList.add('is-reading');
      setTimeout(() => {
        item.classList.remove('is-reading');
        reader.querySelector('.faq__dots')?.remove();
      }, BEAT);
    });
  }
}
