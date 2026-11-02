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
  const filters = group.querySelectorAll('[data-filter]');
  let index = 0;
  let activeSlides = slides.slice();
  const update = () => {
    const total = activeSlides.length;
    if (!total) return;
    index = (index + total) % total;
    slides.forEach(slide => {
      slide.classList.add('is-filtered-out');
      slide.classList.remove('is-active','is-prev','is-next','is-prev2','is-next2','is-prev3','is-next3');
      slide.setAttribute('aria-hidden','true');
    });
    activeSlides.forEach((slide,i) => {
      const prev = total > 1 && i === (index - 1 + total) % total;
      const following = total > 1 && i === (index + 1) % total;
      slide.classList.remove('is-filtered-out');
      slide.classList.toggle('is-active',i===index);
      slide.classList.toggle('is-prev',prev);
      slide.classList.toggle('is-next',following);
      slide.setAttribute('aria-hidden',String(i!==index && !prev && !following));
    });
    previous.disabled = total < 2;
    next.disabled = total < 2;
    count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
  };
  filters.forEach(button => button.addEventListener('click', () => {
    const category = button.dataset.filter;
    activeSlides = category === 'all' ? slides.slice() : slides.filter(slide => slide.dataset.category === category);
    index = 0;
    filters.forEach(item => item.classList.toggle('is-selected',item===button));
    update();
  }));
  previous.addEventListener('click', () => { index = (index - 1 + activeSlides.length) % activeSlides.length; update(); });
  next.addEventListener('click', () => { index = (index + 1) % activeSlides.length; update(); });
  let touchStart = 0;
  carousel.addEventListener('touchstart', e => { touchStart = e.changedTouches[0].clientX; }, {passive:true});
  carousel.addEventListener('touchend', e => {
    const delta = e.changedTouches[0].clientX - touchStart;
    if(activeSlides.length>1 && Math.abs(delta)>45){
      if(delta<0) index=(index+1)%activeSlides.length;
      if(delta>0) index=(index-1+activeSlides.length)%activeSlides.length;
      update();
    }
  }, {passive:true});
  update();
});
