document.getElementById('year').textContent = new Date().getFullYear();
const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
}));
document.querySelectorAll('[data-carousel]').forEach(carousel => {
  const track = carousel.querySelector('.carousel-track');
  const slides = Array.from(track.children);
  const group = carousel.closest('.format-group');
  const previous = group.querySelector('.carousel-prev');
  const next = group.querySelector('.carousel-next');
  const count = group.querySelector('.carousel-count');
  let index = 0;
  const update = () => {
    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === index);
      const previousIndex = (index - 1 + slides.length) % slides.length;
      const nextIndex = (index + 1) % slides.length;
      const isPrevious = i === previousIndex;
      const isNext = i === nextIndex;
      slide.classList.toggle('is-prev', isPrevious);
      slide.classList.toggle('is-next', isNext);
      slide.classList.toggle('is-prev2', false);
      slide.classList.toggle('is-next2', false);
      slide.classList.toggle('is-prev3', false);
      slide.classList.toggle('is-next3', false);
      slide.setAttribute('aria-hidden', String(i !== index && !isPrevious && !isNext));
    });
    previous.disabled = false;
    next.disabled = false;
    count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
  };
  previous.addEventListener('click', () => { index = (index - 1 + slides.length) % slides.length; update(); });
  next.addEventListener('click', () => { index = (index + 1) % slides.length; update(); });
  let touchStart = 0;
  carousel.addEventListener('touchstart', e => { touchStart = e.changedTouches[0].clientX; }, {passive:true});
  carousel.addEventListener('touchend', e => {
    const delta = e.changedTouches[0].clientX - touchStart;
    if(Math.abs(delta) > 45){
      if(delta < 0) index = (index + 1) % slides.length;
      if(delta > 0) index = (index - 1 + slides.length) % slides.length;
      update();
    }
  }, {passive:true});
  update();
});
