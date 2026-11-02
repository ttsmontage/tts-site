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

/* Retours clients : ajout d'images depuis l'explorateur, conservées dans ce navigateur. */
const testimonialArea = document.querySelector('.testimonial-empty');
if (testimonialArea) {
  const storageKey = 'tts-testimonial-images-v1';
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch (_) { saved = []; }

  testimonialArea.className = 'testimonial-uploader';
  testimonialArea.innerHTML = `
    <div class="testimonial-uploader-head">
      <div><span class="testimonial-mark">“</span><div><h3>Retours clients</h3><p>Ajoute tes captures directement depuis ton ordinateur. Elles restent enregistrées dans ce navigateur.</p></div></div>
      <span class="testimonial-tag">AVIS & ÉCHANGES</span>
    </div>
    <div class="testimonial-slots" aria-label="Captures de retours clients"></div>
  `;

  const slots = testimonialArea.querySelector('.testimonial-slots');
  const render = () => {
    slots.innerHTML = '';
    for (let i = 0; i < 4; i++) {
      const item = saved[i];
      const slot = document.createElement('div');
      slot.className = `testimonial-slot${item ? ' has-image' : ''}`;
      slot.innerHTML = item
        ? `<img src="${item}" alt="Capture d'un retour client ${i + 1}"><button type="button" class="testimonial-remove" aria-label="Supprimer cette capture">×</button>`
        : `<input type="file" accept="image/png,image/jpeg,image/webp" aria-label="Ajouter une capture client ${i + 1}"><span class="testimonial-plus">+</span><span class="testimonial-add-label">Ajouter une capture</span>`;
      if (item) {
        slot.querySelector('.testimonial-remove').addEventListener('click', e => {
          e.stopPropagation();
          saved.splice(i, 1);
          localStorage.setItem(storageKey, JSON.stringify(saved));
          render();
        });
      } else {
        const input = slot.querySelector('input');
        slot.addEventListener('click', () => input.click());
        input.addEventListener('change', () => {
          const file = input.files && input.files[0];
          if (!file || !file.type.startsWith('image/')) return;
          const reader = new FileReader();
          reader.onload = () => {
            saved[i] = reader.result;
            localStorage.setItem(storageKey, JSON.stringify(saved));
            render();
          };
          reader.readAsDataURL(file);
        });
      }
      slots.appendChild(slot);
    }
  };
  render();
}


/* Formulaire de contact : prépare un e-mail adressé à TTS. */
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!contactForm.reportValidity()) return;
    const data = new FormData(contactForm);
    const subject = String(data.get('subject') || '').trim();
    const body = [
      'Bonjour,',
      '',
      String(data.get('message') || '').trim(),
      '',
      '—',
      'Nom : ' + String(data.get('name') || '').trim(),
      'E-mail : ' + String(data.get('email') || '').trim()
    ].join('\\n');
    window.location.href = 'mailto:ttsmontagepro@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  });
}


/* Portfolio : remplacement local des vidéos de chaque slide (IndexedDB). */
(() => {
  const slides = Array.from(document.querySelectorAll('.portfolio [data-carousel] .carousel-slide'));
  if (!slides.length || !('indexedDB' in window)) return;
  const DB_NAME = 'tts-portfolio-media';
  const STORE = 'videos';
  const openDB = () => new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const withStore = async (mode, action) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = action(tx.objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
      tx.onerror = () => reject(tx.error);
    });
  };
  const setVideo = (slide, blob) => {
    const frame = slide.querySelector('.video-frame');
    if (!frame) return;
    const old = frame.querySelector('video');
    if (old) URL.revokeObjectURL(old.src);
    const iframe = frame.querySelector('iframe');
    if (iframe) iframe.remove();
    let video = frame.querySelector('video');
    if (!video) {
      video = document.createElement('video');
      video.controls = true;
      video.playsInline = true;
      video.preload = 'metadata';
      frame.appendChild(video);
    }
    video.src = URL.createObjectURL(blob);
    frame.classList.add('has-local-video');
  };
  const restore = async () => {
    for (let i = 0; i < slides.length; i++) {
      try {
        const blob = await withStore('readonly', store => store.get('slide-' + i));
        if (blob) setVideo(slides[i], blob);
      } catch (error) { console.warn('Vidéo locale non restaurée', error); }
    }
  };
  slides.forEach((slide, i) => {
    const frame = slide.querySelector('.video-frame');
    if (!frame) return;
    const tools = document.createElement('div');
    tools.className = 'portfolio-slide-tools';
    const label = document.createElement('label');
    label.className = 'portfolio-upload-label';
    label.textContent = '＋ Remplacer la vidéo';
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/mp4,video/webm,video/quicktime';
    input.setAttribute('aria-label', 'Remplacer la vidéo de la slide ' + (i + 1));
    label.appendChild(input);
    tools.appendChild(label);
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'portfolio-reset-video';
    reset.textContent = 'Restaurer la vidéo du site';
    tools.appendChild(reset);
    slide.appendChild(tools);
    input.addEventListener('change', async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      if (!file.type.startsWith('video/')) { alert('Choisis un fichier vidéo.'); return; }
      try {
        await withStore('readwrite', store => store.put(file, 'slide-' + i));
        setVideo(slide, file);
      } catch (error) {
        alert("La vidéo n'a pas pu être enregistrée dans ce navigateur. Essaie un fichier plus léger.");
        console.error(error);
      }
      input.value = '';
    });
    reset.addEventListener('click', async () => {
      try {
        await withStore('readwrite', store => store.delete('slide-' + i));
        const video = frame.querySelector('video');
        if (video) { URL.revokeObjectURL(video.src); video.remove(); }
        frame.classList.remove('has-local-video');
        const original = slide.dataset.originalSrc;
        if (original && !frame.querySelector('iframe')) {
          const iframe = document.createElement('iframe');
          iframe.src = original;
          iframe.title = slide.dataset.originalTitle || 'Vidéo du portfolio';
          iframe.loading = 'lazy';
          iframe.allowFullscreen = true;
          iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
          frame.appendChild(iframe);
        }
      } catch (error) { console.error(error); }
    });
    const iframe = frame.querySelector('iframe');
    if (iframe) {
      slide.dataset.originalSrc = iframe.src;
      slide.dataset.originalTitle = iframe.title;
    }
  });
  restore();
})();
