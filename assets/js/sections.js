// «Über mich»: each timeline stop opens its two-line story (Stage 6: the scroll-driven lines, the
// browser frame, the quote fan, the photo reveal and the tool rows are gone; everything is static).
export function init() {
  const path = document.querySelector('.path');
  if (!path) return;
  const stops = [...path.querySelectorAll('.path__stop')];
  const buttons = stops.map((stop) => {
    const label = stop.querySelector('.path__label');
    const story = stop.querySelector('.path__story');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'path__btn';
    b.textContent = label.textContent;
    b.setAttribute('aria-expanded', 'false');
    b.setAttribute('aria-controls', story.id);
    label.replaceWith(b);
    story.hidden = true;
    b.addEventListener('click', () => {
      const open = b.getAttribute('aria-expanded') !== 'true';
      buttons.forEach((o) => { o.setAttribute('aria-expanded', 'false'); document.getElementById(o.getAttribute('aria-controls')).hidden = true; });
      b.setAttribute('aria-expanded', String(open));
      story.hidden = !open;
    });
    return b;
  });
  path.classList.add('has-buttons');
}
