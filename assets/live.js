/* Portfolio content bridge: static pages are the fallback; published Supabase data is the live source. */
(() => {
  'use strict';
  const base = document.documentElement.dataset.siteBase || '';
  const prefix = base + '/';
  const p = (route = '') => prefix + String(route).replace(/^\/+/, '');
  const asset = value => {
    const s = String(value || '').trim();
    if (!s) return '';
    if (/^https:\/\//i.test(s) || /^http:\/\//i.test(s)) return s;
    if (/^(?:javascript|data|file|blob):/i.test(s)) return '';
    return p(s);
  };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeSlug = value => String(value || '').replace(/[^a-z0-9-]/g, '').slice(0,90);
  const icon = name => name === 'arrow' ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m7 17 10-10M8 7h9v9"/></svg>' : name === 'file' ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8"/></svg>' : '<span aria-hidden="true">←</span>';
  const intro = (label, heading, description='', small=false) => `<section class="page-intro reveal"><p class="eyebrow">${esc(label)}</p><h1 class="display-title ${small?'small':''}">${heading}</h1>${description?`<p class="lead">${esc(description)}</p>`:''}</section>`;
  const listHead = (label, count) => `<div class="section-topline"><span class="small-label">${esc(label)}</span><span class="count-label">${esc(count)}</span></div>`;
  const crumb = steps => `<nav aria-label="Breadcrumb" class="breadcrumbs"><a href="${p()}">Home</a>${steps.map(([label,route])=>`<span class="sep">/</span>${route!==null?`<a href="${p(route)}">${esc(label)}</a>`:`<span>${esc(label)}</span>`}`).join('')}</nav>`;
  const back = (label, route) => `<div class="back-row"><a class="back-link" href="${p(route)}">← ${esc(label)}</a></div>`;
  const imageBg = value => asset(value) ? `style="background-image:url('${esc(asset(value)).replace(/'/g,'&#39;')}')"` : '';
  const card = (item, route, count, compact=false,wide=false) => {
    const tone = String(item.tone || 'clay').replace(/[^a-z]/g,'');
    return `<a class="visual-card ${compact?'small':''} ${wide?'wide':''}" href="${esc(route)}" aria-label="Explore ${esc(item.title)}">
      <div class="visual-card-image tone-${tone}" ${imageBg(item.cover)}></div><div class="visual-card-shape"></div><div class="visual-card-shade"></div>
      <div class="visual-card-content"><div class="tile-top"><span class="tile-index">${esc(count)}</span><span class="tile-icon">${icon('arrow')}</span></div>
      <div class="tile-bottom"><h2 class="tile-title ${compact?'smaller':''}">${esc(item.title)}</h2><p class="tile-subtitle">${esc(item.subtitle || '')}</p></div></div></a>`;
  };
  const wrap = inner => `<div class="page-shell content-frame">${inner}</div>`;
  const section = route => p(route);
  const urlAcademic = x => section('work/academic/project/?id='+encodeURIComponent(x.slug));
  const urlProfessional = x => section('work/professional/show/?id='+encodeURIComponent(x.slug));
  const urlEpisode = (show,ep) => section('work/professional/episode/?show='+encodeURIComponent(show.slug)+'&id='+encodeURIComponent(ep.slug));
  const urlCreative = x => section('work/creative-explorations/set/?id='+encodeURIComponent(x.slug));
  const getRoute = () => {
    let path = location.pathname;
    if (base && path.startsWith(base + '/')) path = path.slice(base.length+1);
    else path = path.replace(/^\/+/, '');
    const parts = path.split('/').filter(Boolean);
    const q = new URLSearchParams(location.search);
    if (parts.length===0) return ['home'];
    if (parts.length===1 && parts[0]==='work') return ['work'];
    if (parts.length===2 && parts[0]==='work') return [parts[1]];
    if (parts.length===3 && parts[0]==='work' && parts[1]==='academic') return ['academic-detail',parts[2]==='project' ? q.get('id') : parts[2]];
    if (parts.length===3 && parts[0]==='work' && parts[1]==='professional' && parts[2]==='episode') return ['episode',q.get('show'),q.get('id')];
    if (parts.length===3 && parts[0]==='work' && parts[1]==='professional') return ['professional-detail',parts[2]==='show'?q.get('id'):parts[2]];
    if (parts.length===4 && parts[0]==='work' && parts[1]==='professional') return ['episode',parts[2],parts[3]];
    if (parts.length===3 && parts[0]==='work' && parts[1]==='creative-explorations') return ['creative-detail',parts[2]==='set'?q.get('id'):parts[2]];
    if (parts[0]==='about'||parts[0]==='contact') return [parts[0]];
    return ['unknown'];
  };
  window.PortfolioLive = {getRoute,asset,render};

  const iframeSafe = url => {
    try {
      const u = new URL(url);
      const host = u.hostname.toLowerCase();
      if (host==='youtu.be' || host==='www.youtube.com' || host==='youtube.com' || host==='m.youtube.com') {
        const id = host==='youtu.be' ? u.pathname.split('/')[1] : (u.searchParams.get('v') || u.pathname.match(/\/(?:shorts|embed)\/([^/]+)/)?.[1]);
        return /^[\w-]{11}$/.test(id||'') ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : '';
      }
      if (host==='vimeo.com' || host==='www.vimeo.com' || host==='player.vimeo.com') {
        const id=u.pathname.match(/(?:\/video)?\/(\d+)/)?.[1];
        return id ? `https://player.vimeo.com/video/${id}` : '';
      }
    } catch (_) {}
    return '';
  };

  function render(data) {
    if (!data || !data.site) return;
    const main = document.getElementById('main');
    if (!main) return;
    const [type,slug,subslug] = getRoute();
    const academics = data.academic_projects||[];
    const professionals = data.professional_projects||[];
    const sets = data.creative_collections||[];
    let markup='';
    if (type==='home') {
      const title = main.querySelector('.hero-intro');
      if (title) title.textContent = data.site.hero_intro||'';
      const link = main.querySelector('.explore-button');
      if (link) link.firstChild.textContent = data.site.homepage_button||"Let's explore";
      const imgs = (data.site.hero_images||[]).map(asset).filter(Boolean);
      const bg = main.querySelector('[data-hero-background]');
      if (bg && imgs.length) {
        let old = '';try {old=localStorage.getItem('amit-portfolio-last-hero')||'';}catch(_){}
        const pool = imgs.filter(x=>x!==old);const img=pool[Math.floor(Math.random()*pool.length)]||imgs[0];
        const preload=new Image();preload.onload=()=>{bg.style.backgroundImage=`url(${JSON.stringify(img)})`;bg.classList.add('has-photo');try{localStorage.setItem('amit-portfolio-last-hero',img);}catch(_){} };preload.src=img;
      } else if (bg) {bg.classList.remove('has-photo');bg.style.backgroundImage='';}
      return;
    }
    if (type==='work') {
      const cats=data.categories||{};const keys=['academic','professional','creative'];
      const dest=['work/academic/','work/professional/','work/creative-explorations/'];
      markup=wrap(intro('The portfolio','A little bit of <em>everything.</em>','Some things started as an idea on paper. Others found their way onto a screen. Here is a little of both.')+listHead('Find your way through','03 categories')+`<div class="tile-grid three">${keys.map((key,i)=>card(cats[key]||{title:key},section(dest[i]),`0${i+1} / 03`,true)).join('')}</div>`);
    }
    if (type==='academic') {
      markup=wrap(crumb([['Work','work/'],['Academic Work',null]])+intro('01 / Academic Work','A few years of <em>ideas.</em>',data.academic_intro||'',true)+listHead('Selected projects',`${String(academics.length).padStart(2,'0')} projects`)+`<div class="tile-grid">${academics.map((x,i)=>card(x,urlAcademic(x),`${String(i+1).padStart(2,'0')} / ${String(academics.length).padStart(2,'0')}`)).join('')}</div>`+back('Back to Work','work/'));
    }
    if (type==='academic-detail') {
      const x=academics.find(v=>v.slug===slug);if(!x) return renderNotFound(main);
      const pdf=asset(x.pdf);const doc=pdf?`<div class="pdf-viewport"><iframe title="${esc(x.title)} — full project PDF" src="${esc(pdf)}#toolbar=1&navpanes=0" loading="lazy"></iframe></div>`:`<div class="pdf-empty">${icon('file')}<strong>Full project coming soon</strong><p>The PDF will appear here once it's been added to the portfolio.</p></div>`;
      const actions=pdf?`<a href="${esc(pdf)}" target="_blank" rel="noopener noreferrer">Open PDF ↗</a><button type="button" data-live-pdf-fullscreen>Fullscreen</button>`:'';
      markup=wrap(crumb([['Work','work/'],['Academic Work','work/academic/'],[x.title,null]])+`<div class="project-hero-cover"><div class="visual-card-image tone-${esc(x.tone||'clay')}" ${imageBg(x.cover)}></div><div class="visual-card-shape"></div><div class="visual-card-shade"></div><span class="cover-label">${esc(x.subtitle)}</span></div><div class="project-detail-head reveal"><p class="eyebrow">${esc(x.subtitle)}</p><h1 class="display-title small">${esc(x.title)}</h1><p class="project-description">${esc(x.description||'')}</p></div><section class="pdf-block" id="project-pdf"><div class="pdf-bar"><div class="pdf-bar-left">${icon('file')}<span>Project document</span></div><div class="pdf-actions">${actions}</div></div>${doc}</section>`+back('All academic projects','work/academic/'));
      document.title=x.title+' — Amit Dahan Mayo';
    }
    if (type==='professional') {
      markup=wrap(crumb([['Work','work/'],['Professional Work',null]])+intro('02 / Professional Work','Behind the <em>story.</em>','Selected documentary productions and the work behind bringing them to the screen.',true)+listHead('Selected productions',`${String(professionals.length).padStart(2,'0')} projects`)+`<div class="tile-grid">${professionals.map((x,i)=>card(x,urlProfessional(x),`${String(i+1).padStart(2,'0')} / ${String(professionals.length).padStart(2,'0')}`,false,true)).join('')}</div>`+back('Back to Work','work/'));
    }
    if (type==='professional-detail') {
      const show=professionals.find(v=>v.slug===slug);if(!show)return renderNotFound(main);
      const eps=show.episodes||[];
      const tiles=eps.length?eps.map((ep,i)=>card(ep,urlEpisode(show,ep),`${String(i+1).padStart(2,'0')} / ${String(eps.length).padStart(2,'0')}`,true)).join(''):`<div class="episode-placeholder"><p class="eyebrow muted">Selected episodes</p><strong>Episodes coming soon.</strong><p>Episode images and links will appear here when added.</p></div>`;
      markup=wrap(crumb([['Work','work/'],['Professional Work','work/professional/'],[show.title,null]])+`<section class="page-intro reveal" style="padding-bottom:65px"><p class="eyebrow">${esc(show.subtitle)}</p><h1 class="display-title small">${esc(show.title)}</h1><p class="lead compact">${esc(show.description||'')}</p></section><section class="project-summary" aria-label="My contribution"><div><p class="eyebrow">My contribution</p></div><div class="role-detail"><span class="role-label">Role</span><div><h3>${esc(show.role||'')}</h3><p>${esc(show.responsibilities||'')}</p></div></div></section>`+listHead('Selected episodes',`${String(eps.length).padStart(2,'0')} episodes`)+`<div class="tile-grid episode-grid">${tiles}</div>`+back('All professional work','work/professional/'));
      document.title=show.title+' — Amit Dahan Mayo';
    }
    if(type==='episode') {
      const show=professionals.find(x=>x.slug===slug);const ep=show?.episodes?.find(x=>x.slug===subslug);
      if(!show||!ep)return renderNotFound(main);
      const src=iframeSafe(ep.video_url);
      const player=src?`<iframe src="${esc(src)}" title="${esc(ep.title)}" loading="lazy" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`:`<div class="video-placeholder"><p>The player will appear when a YouTube or Vimeo link is added.</p></div>`;
      markup=wrap(crumb([['Work','work/'],['Professional Work','work/professional/'],[show.title,urlProfessional(show).replace(prefix,'')],[ep.title,null]])+intro(show.title,esc(ep.title),ep.description||'Selected episode',true)+`<section class="video-embed" aria-label="Episode player">${player}</section>`+back('Back to episodes',urlProfessional(show).replace(prefix,'')));
      document.title=ep.title+' — Amit Dahan Mayo';
    }
    if(type==='creative-explorations') {
      markup=wrap(crumb([['Work','work/'],['Creative Explorations',null]])+intro('03 / Creative Explorations','Less talking. <em>More looking.</em>','An assortment of images, videos, experiments, and things I felt like making — each set is its own little mix.',true)+listHead('Browse the sets',`${String(sets.length).padStart(2,'0')} sets`)+`<div class="tile-grid">${sets.map((x,i)=>card(x,urlCreative(x),`${String(i+1).padStart(2,'0')} / ${String(sets.length).padStart(2,'0')}`)).join('')}</div>`+back('Back to Work','work/'));
    }
    if(type==='creative-detail') {
      const set=sets.find(x=>x.slug===slug);if(!set)return renderNotFound(main);
      const items=(set.media||[]).filter(x=>asset(x.src)&&(asset(x.thumbnail)||(x.type==='image'&&asset(x.src))));
      const tiles=items.map(x=>{const kind=x.type==='video'?'video':'image';const src=kind==='video'?iframeSafe(x.src)||asset(x.src):asset(x.src);return `<button type="button" class="gallery-item" data-live-gallery-item data-kind="${kind}" data-src="${esc(src)}" data-caption="${esc(x.title||'Visual work')}" aria-label="Open ${esc(x.title||'image')} fullscreen"><img src="${esc(asset(x.thumbnail)||asset(x.src))}" alt="${esc(x.title||'Visual work')}" loading="lazy">${kind==='video'?'<span class="play-marker" aria-hidden="true">▶</span>':''}<span class="gallery-caption">${esc(x.title||'')}</span></button>`}).join('');
      const gallery=tiles?`<div class="gallery-grid" data-live-gallery>${tiles}</div>`:`<div class="placeholder-panel"><p class="eyebrow">A work in progress</p><h2>More to show soon.</h2><p>This set will hold a mix of images and videos once they've been added.</p></div>`;
      markup=wrap(crumb([['Work','work/'],['Creative Explorations','work/creative-explorations/'],[set.title,null]])+intro('Creative Explorations',esc(set.title),set.subtitle||'',true)+gallery+back('All creative sets','work/creative-explorations/'));
      document.title=set.title+' — Amit Dahan Mayo';
    }
    if(type==='about') {
      if(data.site.about_intro){const lead=main.querySelector('.page-intro .lead'); if(lead)lead.textContent=data.site.about_intro;}
      if(data.site.about_paragraphs){const paras=main.querySelectorAll('.about-copy p');data.site.about_paragraphs.forEach((v,i)=>{if(paras[i])paras[i].textContent=v;});}
    }
    if(type==='contact') {
      const email=main.querySelector('.contact-email');if(email){email.textContent=data.site.email||'';email.href='mailto:'+String(data.site.email||'').replace(/[\r\n<>]/g,'');}
      const description=main.querySelector('.contact-lead');if(description && data.site.contact_intro)description.textContent=data.site.contact_intro;
    }
    if(markup){main.innerHTML=markup;}
    const footerEmail=document.querySelector('.site-footer-right a[href^="mailto:"]');
    if(footerEmail && data.site.email) footerEmail.href='mailto:'+data.site.email.replace(/[\r\n<>]/g,'');
  }
  function renderNotFound(main){ main.innerHTML=wrap(intro('Not found','This project is unavailable.','','true')+back('Browse work','work/')); }

  // PDF fullscreen and dynamic lightbox must be delegated because published media can change.
  document.addEventListener('click', event => {
    const pdfButton=event.target.closest('[data-live-pdf-fullscreen]');
    if (pdfButton){const section=pdfButton.closest('.pdf-block');if(section?.requestFullscreen)section.requestFullscreen().catch(()=>{});return;}
    const btn=event.target.closest('[data-live-gallery-item]');
    if(btn){const all=[...document.querySelectorAll('[data-live-gallery-item]')];openGallery(all,all.indexOf(btn));}
  });
  let modal=null,activeItems=[],activeIndex=0;
  function openGallery(items,index){
    activeItems=items;activeIndex=Math.max(0,index);
    if(!modal){modal=document.createElement('div');modal.className='lightbox open';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');
      modal.innerHTML='<div class="lightbox-top"><span class="lightbox-counter"></span><button type="button" class="lightbox-btn" data-l-close aria-label="Close">×</button></div><button type="button" class="lightbox-btn lightbox-arrow lightbox-prev" data-l-prev aria-label="Previous">‹</button><div data-l-media style="width:100%;height:100%;display:flex;align-items:center;justify-content:center"></div><button type="button" class="lightbox-btn lightbox-arrow lightbox-next" data-l-next aria-label="Next">›</button><div class="lightbox-bottom"></div>';
      document.body.appendChild(modal);modal.querySelector('[data-l-close]').onclick=closeGallery;modal.querySelector('[data-l-prev]').onclick=()=>step(-1);modal.querySelector('[data-l-next]').onclick=()=>step(1);modal.addEventListener('click',e=>{if(e.target===modal)closeGallery()});}
    modal.classList.add('open');document.body.style.overflow='hidden';showGallery();modal.querySelector('[data-l-close]').focus();
  }
  function showGallery(){
    const item=activeItems[activeIndex];if(!item)return;
    const holder=modal.querySelector('[data-l-media]');holder.replaceChildren();let node;
    if(item.dataset.kind==='video') {if(/youtube-nocookie\.com\/embed|player\.vimeo\.com\/video/.test(item.dataset.src)){node=document.createElement('iframe');node.allow='autoplay; encrypted-media; picture-in-picture';node.allowFullscreen=true;}else{node=document.createElement('video');node.controls=true;node.autoplay=true;node.playsInline=true;}node.className='lightbox-video';}
    else{node=document.createElement('img');node.alt=item.dataset.caption||'';node.className='lightbox-media';}
    node.src=item.dataset.src;holder.appendChild(node);
    modal.querySelector('.lightbox-counter').textContent=`${activeIndex+1} / ${activeItems.length}`;
    modal.querySelector('.lightbox-bottom').textContent=item.dataset.caption||'';
    modal.querySelector('[data-l-prev]').hidden=modal.querySelector('[data-l-next]').hidden=activeItems.length<2;
  }
  function step(delta){activeIndex=(activeIndex+delta+activeItems.length)%activeItems.length;showGallery();}
  function closeGallery(){if(!modal)return;modal.classList.remove('open');modal.querySelector('[data-l-media]').replaceChildren();document.body.style.overflow='';}
  document.addEventListener('keydown',e=>{if(!modal?.classList.contains('open'))return;if(e.key==='Escape')closeGallery();if(e.key==='ArrowRight')step(1);if(e.key==='ArrowLeft')step(-1);});

  // Draft preview messages are accepted only from the same-origin admin iframe parent.
  window.addEventListener('message',event=>{
    if(window.parent===window || event.origin!==location.origin)return;
    if(event.source!==window.parent)return;
    if(event.data?.type==='PORTFOLIO_DRAFT_PREVIEW' && event.data.content)render(event.data.content);
  });
  const configUrl=p('assets/backend.json');
  Promise.all([fetch(configUrl,{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null),fetch(p('assets/initial-content.json')).then(r=>r.ok?r.json():null).catch(()=>null)]).then(async ([backend,fallback])=>{
    if(backend?.url && backend?.publishableKey){
      try{
        const url=backend.url.replace(/\/$/,'')+'/rest/v1/portfolio_published?id=eq.main&select=content';
        const response=await fetch(url,{headers:{apikey:backend.publishableKey,'Accept':'application/json'},cache:'no-store'});
        if(response.ok){const rows=await response.json();if(rows?.[0]?.content)render(rows[0].content);}
      } catch(error){console.warn('Public portfolio uses the built-in content fallback.',error);}
    }
    // Enables working static fallback if an item is created only in site.json.
    if(!backend?.url && fallback){ /* build.py already rendered the fallback content */ }
    if(window.parent!==window && new URLSearchParams(location.search).has('portfolio_preview'))window.parent.postMessage({type:'PORTFOLIO_PREVIEW_READY'},location.origin);
  });
})();
