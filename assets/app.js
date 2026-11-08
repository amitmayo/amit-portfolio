/* Small enhancements: navigation, image reveal, fullscreen media, and PDF fullscreen. */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  // Mobile navigation.
  const menuToggle = $('[data-menu-toggle]');
  const menu = $('#site-nav');
  if (menuToggle && menu) {
    const setMenu = (open) => {
      menu.classList.toggle('open', open);
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    };
    menuToggle.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
    menu.addEventListener('click', (event) => {
      if (event.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setMenu(false);
    });
    document.addEventListener('click', (event) => {
      if (menu.classList.contains('open') && !event.target.closest('.site-header')) setMenu(false);
    });
  }

  // One randomly selected hero image per visit, avoiding the last seen image when possible.
  // If no images have been uploaded yet, the curated dark gradient is the fallback.
  const hero = $('.hero');
  const heroBackground = $('[data-hero-background]');
  const heroButton = $('[data-hero-reveal]');
  if (hero && heroBackground) {
    const images = Array.isArray(window.PORTFOLIO_HERO_IMAGES) ? window.PORTFOLIO_HERO_IMAGES.map(x => typeof x==='string'?{src:x}:x).filter(x=>x?.src) : [];
    if (images.length) {
      let previous = null;
      try { previous = localStorage.getItem('amit-portfolio-last-hero'); } catch (_) {}
      const candidates = images.length > 1 ? images.filter(x => x.src !== previous) : images;
      const selected = candidates[Math.floor(Math.random() * candidates.length)] || images[0];
      const preload = new Image();
      preload.onload = () => {
        heroBackground.style.backgroundImage = `url(${JSON.stringify(selected.src)})`;
        heroBackground.style.backgroundPosition=`${selected.positionX??50}% ${selected.positionY??50}%`;
        heroBackground.style.setProperty('--media-zoom',Math.min(2.5,Math.max(1,Number(selected.zoom??1))));
        heroBackground.classList.add('has-photo');
        try { localStorage.setItem('amit-portfolio-last-hero', selected.src); } catch (_) {}
      };
      preload.src = selected;
    }
    if (heroButton) {
      for (const eventName of ['mouseenter', 'focus', 'pointerdown']) {
        heroButton.addEventListener(eventName, () => hero.classList.add('is-revealed'));
      }
      for (const eventName of ['mouseleave', 'blur']) {
        heroButton.addEventListener(eventName, () => hero.classList.remove('is-revealed'));
      }
    }
  }

  // Intro starts as gentle typing; the caret remains after the last character.
  // Reduced-motion visitors see the full text immediately.
  const intro=document.querySelector('.hero-intro');
  if(intro){
    const saved=intro.textContent;
    const heading=document.querySelector('.hero-title');
    let activeText=saved,timer=null,token=0;
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    intro.classList.add('typewriter-intro');
    const setText=(text,fromData=false)=>{
      const next=String(text||'');
      if(fromData && next===activeText)return;
      activeText=next;token++;if(timer)clearTimeout(timer);
      if(reduced){intro.textContent=next;intro.classList.add('typing-done');return;}
      intro.textContent='';intro.classList.remove('typing-done');
      let i=0;const id=token;
      const tick=()=>{if(id!==token)return;intro.textContent=next.slice(0,++i);
        if(i<next.length)timer=setTimeout(tick,/[,.]/.test(next[i-1])?180:26);
        else intro.classList.add('typing-done');
      };
      timer=setTimeout(tick,380);
    };
    window.PortfolioTyping={setText};
    if(heading&&!reduced){
      const plain='hey ',italic='you.';
      heading.setAttribute('aria-label','hey you.');
      const first=document.createElement('span'),em=document.createElement('em');
      first.setAttribute('aria-hidden','true');em.setAttribute('aria-hidden','true');heading.replaceChildren(first,em);
      let n=0;
      const titleTick=()=>{
        n++;
        first.textContent=plain.slice(0,Math.min(n,plain.length));
        if(n>plain.length)em.textContent=italic.slice(0,n-plain.length);
        if(n<plain.length+italic.length)setTimeout(titleTick,95);
        else setText(saved);
      };
      setTimeout(titleTick,260);
    }else setText(saved);
  }

  // Browser-native PDF embeds already provide page and zoom controls. This expands the frame.
  for (const button of $$('[data-pdf-fullscreen]')) {
    button.addEventListener('click', async () => {
      const frame = button.closest('.pdf-block');
      if (!frame) return;
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else if (typeof frame.requestFullscreen === 'function') await frame.requestFullscreen();
        else {
          const url = frame.querySelector('iframe')?.getAttribute('src')?.split('#')[0];
          if (url) window.open(url, '_blank', 'noopener,noreferrer');
        }
      } catch (error) {
        // Browsers with restricted fullscreen can still open the PDF using the adjacent link.
        console.info('Fullscreen not available in this browser.', error);
      }
    });
  }

  // Fullscreen photo / video gallery; the controls only appear on real uploaded media.
  const galleryButtons = $$('[data-gallery-item]');
  if (galleryButtons.length) {
    let active = 0;
    let lastFocused = null;
    const root = document.createElement('div');
    root.className = 'lightbox';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Gallery viewer');
    root.setAttribute('tabindex', '-1');

    const makeButton = (className, title, svg) => {
      const button = document.createElement('button');
      button.className = `lightbox-btn ${className}`;
      button.type = 'button';
      button.setAttribute('aria-label', title);
      button.innerHTML = svg;
      return button;
    };
    const svg = (path) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
    const closeButton = makeButton('', 'Close gallery', svg('<path d="M18 6 6 18M6 6l12 12"/>'));
    const previousButton = makeButton('lightbox-arrow lightbox-prev', 'Previous image', svg('<path d="m15 18-6-6 6-6"/>'));
    const nextButton = makeButton('lightbox-arrow lightbox-next', 'Next image', svg('<path d="m9 18 6-6-6-6"/>'));
    const counter = document.createElement('span');
    counter.className = 'lightbox-counter';
    const top = document.createElement('div');
    top.className = 'lightbox-top';
    top.append(counter, closeButton);
    const mediaContainer = document.createElement('div');
    mediaContainer.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;';
    const caption = document.createElement('div');
    caption.className = 'lightbox-bottom';
    root.append(top, previousButton, mediaContainer, nextButton, caption);
    document.body.appendChild(root);

    const render = () => {
      const item = galleryButtons[active];
      const kind = item.dataset.kind;
      const url = item.dataset.src;
      const title = item.dataset.caption || 'Visual work';
      mediaContainer.replaceChildren();
      if (kind === 'video') {
        if (url.includes('youtube-nocookie.com/embed/') || url.includes('player.vimeo.com/video/')) {
          const iframe = document.createElement('iframe');
          iframe.src = url;
          iframe.title = title;
          iframe.className = 'lightbox-video';
          iframe.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
          iframe.allowFullscreen = true;
          mediaContainer.appendChild(iframe);
        } else {
          const video = document.createElement('video');
          video.src = url;
          video.controls = true;
          video.autoplay = true;
          video.playsInline = true;
          video.className = 'lightbox-video';
          mediaContainer.appendChild(video);
        }
      } else {
        const image = document.createElement('img');
        image.className = 'lightbox-media';
        image.src = url;
        image.alt = title;
        mediaContainer.appendChild(image);
      }
      counter.textContent = `${active + 1} / ${galleryButtons.length}`;
      caption.textContent = title;
      previousButton.hidden = nextButton.hidden = galleryButtons.length < 2;
    };
    const close = () => {
      root.classList.remove('open');
      mediaContainer.replaceChildren();
      document.body.style.overflow = '';
      lastFocused?.focus();
    };
    const step = (delta) => {
      active = (active + delta + galleryButtons.length) % galleryButtons.length;
      render();
    };
    galleryButtons.forEach((button, index) => {
      button.addEventListener('click', () => {
        lastFocused = button;
        active = index;
        render();
        root.classList.add('open');
        document.body.style.overflow = 'hidden';
        closeButton.focus();
      });
    });
    closeButton.addEventListener('click', close);
    previousButton.addEventListener('click', () => step(-1));
    nextButton.addEventListener('click', () => step(1));
    root.addEventListener('click', (event) => { if (event.target === root) close(); });
    document.addEventListener('keydown', (event) => {
      if (!root.classList.contains('open')) return;
      if (event.key === 'Escape') { event.preventDefault(); close(); }
      if (event.key === 'ArrowRight') { event.preventDefault(); step(1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); }
      if (event.key === 'Tab') {
        const buttons = [closeButton, previousButton, nextButton].filter((item) => !item.hidden);
        if (!buttons.includes(document.activeElement)) { event.preventDefault(); closeButton.focus(); }
      }
    });
  }
})();
