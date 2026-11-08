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
  const imageBg = (value, item={}) => {
    if (!asset(value)) return '';
    const x=Math.min(100,Math.max(0,Number(item.coverPositionX??50)||0));
    const y=Math.min(100,Math.max(0,Number(item.coverPositionY??50)||0));
    const zoom=Math.min(2.5,Math.max(1,Number(item.coverZoom??1)||1));
    return `style="background-image:url('${esc(asset(value)).replace(/'/g,'&#39;')}');background-position:${x}% ${y}%;--media-zoom:${zoom}"`;
  };
  const card = (item, route, count, compact=false,wide=false) => {
    const tone = String(item.tone || 'clay').replace(/[^a-z]/g,'');
    return `<a class="visual-card ${compact?'small':''} ${wide?'wide':''}" href="${esc(route)}" aria-label="Explore ${esc(item.title)}">
      <div class="visual-card-image tone-${tone}" ${imageBg(item.cover,item)}></div><div class="visual-card-shape"></div><div class="visual-card-shade"></div>
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
  let lastSelectedHero=null;
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
      if(host==='drive.google.com' || host==='www.drive.google.com') {
        const id=u.pathname.match(/\/file\/d\/([A-Za-z0-9_-]{15,})/)?.[1] || u.searchParams.get('id');
        return /^[A-Za-z0-9_-]{15,}$/.test(id||'') ? `https://drive.google.com/file/d/${id}/preview` : '';
      }
    } catch (_) {}
    return '';
  };

  const pdfLink = raw => {
    const source=asset(raw);if(!source)return {embed:'',open:''};
    try{
      const u=new URL(source);
      if(u.hostname==='drive.google.com'||u.hostname==='www.drive.google.com'){
        const id=u.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1] || u.searchParams.get('id');
        if(id&&/^[a-zA-Z0-9_-]{15,}$/.test(id))return {embed:`https://drive.google.com/file/d/${id}/preview`,open:`https://drive.google.com/file/d/${id}/view`};
      }
    }catch(_){}
    return {embed:source+(source.includes('#')?'':'#toolbar=1&navpanes=0'),open:source};
  };

  function render(data) {
    if (!data || !data.site) return;
    currentContent=data;
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
      const imgs = (data.site.hero_images||[]).map(entry => typeof entry==='string' ? {src:entry} : entry).filter(entry=>entry&&asset(entry.src));
      const bg=main.querySelector('[data-hero-background]');
      if(bg){
        if(imgs.length){
          let previous='';try{previous=sessionStorage.getItem('amit-portfolio-last-hero')||'';}catch(_){}
          const other=imgs.filter(entry=>asset(entry.src)!==previous);
          const pool=other.length?other:imgs;
          // In editor preview, keep the current photo stable while adjusting its framing.
          const previewing=window.parent!==window && new URLSearchParams(location.search).has('portfolio_preview');
          const chosen=(previewing && imgs.find(x=>asset(x.src)===lastSelectedHero)) || pool[Math.floor(Math.random()*pool.length)];
          lastSelectedHero=asset(chosen.src);
          const src=asset(chosen.src);
          const apply=()=>{
            bg.style.backgroundImage=`url(${JSON.stringify(src)})`;
            bg.style.backgroundPosition=`${Math.min(100,Math.max(0,Number(chosen.positionX??50)))}% ${Math.min(100,Math.max(0,Number(chosen.positionY??50)))}%`;
            bg.style.setProperty('--media-zoom',Math.min(2.5,Math.max(1,Number(chosen.zoom??1))));
            bg.classList.add('has-photo');
            try{sessionStorage.setItem('amit-portfolio-last-hero',src);}catch(_){}
          };
          if(bg.dataset.currentHero!==src){bg.dataset.currentHero=src;const img=new Image();img.onload=apply;img.src=src;}
          else apply();
        }else{bg.classList.remove('has-photo');bg.style.backgroundImage='';bg.style.removeProperty('--media-zoom');}
      }
      if(window.PortfolioTyping?.setText){window.PortfolioTyping.setText(data.site.hero_intro||'',true);}
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
      const documentRecords=Array.isArray(x.pdfs)?x.pdfs:(x.pdf?[{title:'Project document',url:x.pdf}]:[]);
      const documents=documentRecords.map((d,i)=>({title:String(d.title||`Document ${i+1}`),link:pdfLink(d.url||d.src||'')})).filter(d=>d.link.embed);
      const first=documents[0];
      const chooser=documents.length>1?`<div class="pdf-switcher" aria-label="Choose a project document">${documents.map((d,i)=>`<button type="button" class="pdf-switch ${i===0?'active':''}" data-live-pdf-select data-pdf-embed="${esc(d.link.embed)}" data-pdf-open="${esc(d.link.open)}" data-pdf-title="${esc(d.title)}" aria-pressed="${i===0}">${esc(d.title)}</button>`).join('')}</div>`:'';
      const doc=first?`<div class="pdf-viewport"><iframe data-live-pdf-frame title="${esc(x.title)} — ${esc(first.title)}" src="${esc(first.link.embed)}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`:`<div class="pdf-empty">${icon('file')}<strong>Full project coming soon</strong><p>The PDFs will appear here once they're added to the portfolio.</p></div>`;
      const actions=first?`<a data-live-pdf-open href="${esc(first.link.open)}" target="_blank" rel="noopener noreferrer">Open document ↗</a><button type="button" data-live-pdf-fullscreen>Fullscreen</button>`:'';
      markup=wrap(crumb([['Work','work/'],['Academic Work','work/academic/'],[x.title,null]])+`<div class="project-hero-cover"><div class="visual-card-image tone-${esc(x.tone||'clay')}" ${imageBg(x.cover,x)}></div><div class="visual-card-shape"></div><div class="visual-card-shade"></div><span class="cover-label">${esc(x.subtitle)}</span></div><div class="project-detail-head reveal"><p class="eyebrow">${esc(x.subtitle)}</p><h1 class="display-title small">${esc(x.title)}</h1><p class="project-description">${esc(x.description||'')}</p></div><section class="pdf-block" id="project-pdf"><div class="pdf-bar"><div class="pdf-bar-left">${icon('file')}<span>Project document${documents.length>1?'s':''}</span></div><div class="pdf-actions">${actions}</div></div>${chooser}${doc}</section>`+back('All academic projects','work/academic/'));
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
      const visibleCover=set=>set.cover || (set.media||[]).find(m=>m.type!=='video'&&m.src)?.src || (set.media||[]).find(m=>m.thumbnail)?.thumbnail || '';
      markup=wrap(crumb([['Work','work/'],['Creative Explorations',null]])+intro('03 / Creative Explorations','Less talking. <em>More looking.</em>','An assortment of images, videos, experiments, and things I felt like making — each set is its own little mix.',true)+listHead('Browse the sets',`${String(sets.length).padStart(2,'0')} sets`)+`<div class="tile-grid">${sets.map((x,i)=>card({...x,cover:visibleCover(x)},urlCreative(x),`${String(i+1).padStart(2,'0')} / ${String(sets.length).padStart(2,'0')}`).replace('<a class="visual-card','<a data-live-open-set="'+esc(x.slug)+'" class="visual-card')).join('')}</div>`+back('Back to Work','work/'));
    }
    if(type==='creative-detail') {
      const set=sets.find(x=>x.slug===slug);if(!set)return renderNotFound(main);
      const items=(set.media||[]).filter(x=>asset(x.src)&&(asset(x.thumbnail)||(x.type==='image'&&asset(x.src))));
      const tiles=items.map(x=>{const kind=x.type==='video'?'video':'image';const src=kind==='video'?iframeSafe(x.src)||asset(x.src):asset(x.src);return `<button type="button" class="gallery-item" data-live-gallery-item data-kind="${kind}" data-src="${esc(src)}" data-caption="${esc(x.title||'Visual work')}" aria-label="Open ${esc(x.title||'image')} fullscreen"><img src="${esc(asset(x.thumbnail)||asset(x.src))}" alt="${esc(x.title||'Visual work')}" loading="lazy" style="object-position:${Math.min(100,Math.max(0,Number(x.coverPositionX??50)))}% ${Math.min(100,Math.max(0,Number(x.coverPositionY??50)))}%;--media-zoom:${Math.min(2.5,Math.max(1,Number(x.coverZoom??1)))}">${kind==='video'?'<span class="play-marker" aria-hidden="true">▶</span>':''}<span class="gallery-caption">${esc(x.title||'')}</span></button>`}).join('');
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

  // Media viewer: set cards open over the category page. A single visual opens alone;
  // multi-item sets offer previous/next navigation AND an optional grid view.
  let currentContent=null, viewer=null, viewerItems=[],viewerIndex=0,viewerMode='slide',restoreFocus=null;
  function mediaItems(set){
    return (set?.media||[]).map((x,i)=>{
      const kind=x.type==='video'?'video':'image', src=kind==='video'?(iframeSafe(x.src)||asset(x.src)):asset(x.src);
      const thumb=asset(x.thumbnail)||(kind==='image'?src:'');
      return {kind,src,thumb,title:x.title||`Visual ${i+1}`,crop:x};
    }).filter(x=>x.src);
  }
  function ensureViewer(){
    if(viewer)return;
    viewer=document.createElement('div');viewer.className='lightbox portfolio-collection-viewer';viewer.setAttribute('role','dialog');viewer.setAttribute('aria-modal','true');viewer.setAttribute('aria-label','Creative collection');viewer.setAttribute('tabindex','-1');
    viewer.innerHTML=`<div class="lightbox-top"><span class="lightbox-counter"></span><button type="button" class="collection-grid-switch" data-c-grid hidden>Grid view</button><button type="button" class="lightbox-btn" data-c-close aria-label="Close viewer">×</button></div><button type="button" class="lightbox-btn lightbox-arrow lightbox-prev" data-c-prev aria-label="Previous item">‹</button><div class="collection-stage" data-c-stage></div><button type="button" class="lightbox-btn lightbox-arrow lightbox-next" data-c-next aria-label="Next item">›</button><div class="lightbox-bottom"></div>`;
    document.body.append(viewer);
    viewer.querySelector('[data-c-close]').onclick=closeViewer;
    viewer.querySelector('[data-c-prev]').onclick=()=>stepViewer(-1);
    viewer.querySelector('[data-c-next]').onclick=()=>stepViewer(1);
    viewer.querySelector('[data-c-grid]').onclick=()=>{viewerMode=viewerMode==='grid'?'slide':'grid';drawViewer()};
    viewer.addEventListener('click',e=>{if(e.target===viewer)closeViewer()});
  }
  function openViewer(items,index=0){
    if(!items.length)return;
    ensureViewer();restoreFocus=document.activeElement;viewerItems=items;viewerIndex=Math.min(Math.max(index,0),items.length-1);
    viewerMode='slide';viewer.classList.add('open');document.body.style.overflow='hidden';drawViewer();viewer.querySelector('[data-c-close]').focus();
  }
  function drawViewer(){
    if(!viewer?.classList.contains('open'))return;
    const stage=viewer.querySelector('[data-c-stage]');stage.replaceChildren();
    const grid=viewer.querySelector('[data-c-grid]');grid.hidden=viewerItems.length<2;grid.textContent=viewerMode==='grid'?'Slideshow':'Grid view';
    viewer.querySelector('[data-c-prev]').hidden=viewer.querySelector('[data-c-next]').hidden=viewerMode==='grid'||viewerItems.length<2;
    viewer.querySelector('.lightbox-counter').textContent=viewerItems.length>1?`${viewerIndex+1} / ${viewerItems.length}`:'';
    if(viewerMode==='grid'){
      const tiles=document.createElement('div');tiles.className='collection-modal-grid';
      viewerItems.forEach((item,i)=>{
        const btn=document.createElement('button');btn.type='button';btn.className='collection-grid-tile';btn.setAttribute('aria-label','Open '+item.title);
        if(item.thumb){const img=document.createElement('img');img.src=item.thumb;img.alt=item.title;btn.append(img);}else btn.textContent=item.title;
        btn.onclick=()=>{viewerIndex=i;viewerMode='slide';drawViewer();};tiles.append(btn);
      });stage.append(tiles);viewer.querySelector('.lightbox-bottom').textContent='Select an image or video';return;
    }
    const item=viewerItems[viewerIndex],node=item.kind==='image'?document.createElement('img'):(/youtube-nocookie\.com\/embed|player\.vimeo\.com\/video|drive\.google\.com\/file\/d\/.+\/preview/.test(item.src)?document.createElement('iframe'):document.createElement('video'));
    node.className=item.kind==='image'?'lightbox-media':'lightbox-video';
    if(node.tagName==='IMG')node.alt=item.title;
    if(node.tagName==='IFRAME'){node.title=item.title;node.allow='autoplay; encrypted-media; picture-in-picture';node.allowFullscreen=true;}
    if(node.tagName==='VIDEO'){node.controls=true;node.playsInline=true;}
    node.src=item.src;stage.append(node);
    const caption=viewer.querySelector('.lightbox-bottom');caption.replaceChildren(document.createTextNode(item.title));
    if(node.tagName==='IFRAME' && item.src.startsWith('https://drive.google.com/')) {
      const link=document.createElement('a');link.href=item.src.replace(/\/preview(?:[?#].*)?$/,'/view');link.target='_blank';link.rel='noopener noreferrer';link.textContent='Open in Google Drive ↗';link.className='drive-fallback-link';caption.append(' · ',link);
    }
  }
  function stepViewer(delta){if(viewerMode==='grid'||viewerItems.length<2)return;viewerIndex=(viewerIndex+delta+viewerItems.length)%viewerItems.length;drawViewer()}
  function closeViewer(){if(!viewer)return;viewer.classList.remove('open');viewer.querySelector('[data-c-stage]').replaceChildren();document.body.style.overflow='';restoreFocus?.focus?.();}
  document.addEventListener('click',event=>{
    const pdfChoice=event.target.closest('[data-live-pdf-select]');
    if(pdfChoice){
      const block=pdfChoice.closest('.pdf-block');const iframe=block?.querySelector('[data-live-pdf-frame]');const open=block?.querySelector('[data-live-pdf-open]');
      if(iframe){iframe.src=pdfChoice.dataset.pdfEmbed;iframe.title=pdfChoice.dataset.pdfTitle+' — PDF';}
      if(open)open.href=pdfChoice.dataset.pdfOpen;
      block?.querySelectorAll('[data-live-pdf-select]').forEach(b=>{const active=b===pdfChoice;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});return;
    }
    const pdfButton=event.target.closest('[data-live-pdf-fullscreen]');
    if(pdfButton){const frame=pdfButton.closest('.pdf-block');if(frame?.requestFullscreen)frame.requestFullscreen().catch(()=>{});return;}
    const setLink=event.target.closest('[data-live-open-set]');
    if(setLink){event.preventDefault();const set=(currentContent?.creative_collections||[]).find(x=>x.slug===setLink.dataset.liveOpenSet);const items=mediaItems(set);if(items.length)openViewer(items);else window.location.href=setLink.href;return;}
    const item=event.target.closest('[data-live-gallery-item]');
    if(item){const all=[...document.querySelectorAll('[data-live-gallery-item]')];openViewer(all.map(x=>({kind:x.dataset.kind,src:x.dataset.src,thumb:x.querySelector('img')?.src||'',title:x.dataset.caption||'Visual work'})),all.indexOf(item));}
  });
  document.addEventListener('keydown',e=>{if(!viewer?.classList.contains('open'))return;if(e.key==='Escape'){e.preventDefault();closeViewer();}if(e.key==='ArrowRight'){e.preventDefault();stepViewer(1);}if(e.key==='ArrowLeft'){e.preventDefault();stepViewer(-1);}if(e.key==='Tab'){const allowed=[...viewer.querySelectorAll('button:not([hidden])')];if(!allowed.length)return;const i=allowed.indexOf(document.activeElement);if(e.shiftKey&&i===0){e.preventDefault();allowed.at(-1).focus();}else if(!e.shiftKey&&i===allowed.length-1){e.preventDefault();allowed[0].focus();}}});

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
        if(response.ok){const rows=await response.json();if(rows?.[0]?.content && !(window.parent!==window && new URLSearchParams(location.search).has('portfolio_preview')))render(rows[0].content);}
      } catch(error){console.warn('Public portfolio uses the built-in content fallback.',error);}
    }
    // Enables working static fallback if an item is created only in site.json.
    if(fallback && !currentContent){currentContent=fallback;}
    if(window.parent!==window && new URLSearchParams(location.search).has('portfolio_preview'))window.parent.postMessage({type:'PORTFOLIO_PREVIEW_READY'},location.origin);
  });
})();
