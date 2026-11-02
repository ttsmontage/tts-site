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
      slide.classList.toggle('is-prev', i === index - 1);
      slide.classList.toggle('is-next', i === index + 1);
      slide.classList.toggle('is-prev2', i === index - 2);
      slide.classList.toggle('is-next2', i === index + 2);
      slide.setAttribute('aria-hidden', String(Math.abs(i - index) > 2));
    });
    previous.disabled = index === 0;
    next.disabled = index === slides.length - 1;
    count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
  };
  previous.addEventListener('click', () => { if(index > 0){ index--; update(); }});
  next.addEventListener('click', () => { if(index < slides.length - 1){ index++; update(); }});
  let touchStart = 0;
  carousel.addEventListener('touchstart', e => { touchStart = e.changedTouches[0].clientX; }, {passive:true});
  carousel.addEventListener('touchend', e => {
    const delta = e.changedTouches[0].clientX - touchStart;
    if(Math.abs(delta) > 45){
      if(delta < 0 && index < slides.length - 1) index++;
      if(delta > 0 && index > 0) index--;
      update();
    }
  }, {passive:true});
  update();
});
