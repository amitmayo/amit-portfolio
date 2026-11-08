/* Private owner editor for Amit's existing portfolio. Never store secrets in this file. */
(async () => {
  'use strict';
  const base = document.documentElement.dataset.siteBase || '';
  const path = r => base + '/' + String(r || '').replace(/^\/+/, '');
  const $ = s => document.querySelector(s);
  const loginPanel = $('#admin-login');
  const shell = $('#admin-shell');
  const form = $('#admin-login-form');
  const errorBox = $('#admin-login-error');
  const setupNote = $('#admin-setup');
  const fieldBox = $('#admin-editor-fields');
  const tabs = $('#admin-section-tabs');
  const preview = $('#admin-preview');
  const status = $('#admin-status');
  let db=null, draft=null, section='home', focused=null, hasChanges=false;
  let lastSaved=null,previewTimer=null,autosaveTimer=null;
  const SEC={home:'Home',work:'Work',academic:'Academic',professional:'Professional',creative:'Creative',about:'About',contact:'Contact'};
  const defaultTone={academic:'clay',professional:'cobalt',creative:'rose'};
  const safeSlug = input => (String(input||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,48) || 'item')+'-'+Math.random().toString(36).slice(2,6);
  const make = (tag, css='', text) => {const e=document.createElement(tag);if(css)e.className=css;if(text!==undefined)e.textContent=text;return e;};
  const heading = (text,description) => {fieldBox.append(make('h3','admin-field-heading',text));if(description)fieldBox.append(make('p','admin-field-help',description));};
  const button = (label,action,cls='') => {const el=make('button','admin-field-button '+cls,label);el.type='button';el.addEventListener('click',action);return el;};
  const group = (parent,label) => {const block=make('div','admin-field');const name=make('label','admin-field-label',label);block.append(name);parent.append(block);return {block,name};};
  function showError(message){errorBox.hidden=false;errorBox.textContent=message;}
  function setStatus(text,mode=''){status.textContent=text;status.dataset.state=mode;}
  const touch=()=>{hasChanges=true;setStatus('Unsaved changes','unsaved');clearTimeout(previewTimer);previewTimer=setTimeout(sendPreview,260);clearTimeout(autosaveTimer);autosaveTimer=setTimeout(()=>saveDraft(true),1800);};
  function sendPreview(){if(draft && preview.contentWindow)preview.contentWindow.postMessage({type:'PORTFOLIO_DRAFT_PREVIEW',content:draft},location.origin);}
  function textField(parent,obj,key,label,large=false,placeholder=''){
    const {block,name}=group(parent,label);const input=make(large?'textarea':'input','admin-input');input.id='admin-'+key+'-'+Math.random().toString(36).slice(2);
    name.htmlFor=input.id;input.value=String(obj[key]??'');input.placeholder=placeholder;
    if(large)input.rows=3;else input.type='text';
    input.addEventListener('input',()=>{obj[key]=input.value;touch();});block.append(input);return input;
  }
  async function upload(file,folder){
    if(!file)return null;
    if(file.size>50*1024*1024)throw new Error('Supabase Free Storage is limited to 50 MB per file. For large PDFs, paste a Google Drive share link with General access → Anyone with the link → Viewer, or use an optimized PDF hosted elsewhere.');
    const accepted=['image/jpeg','image/png','image/webp','image/avif','image/gif','application/pdf','video/mp4','video/webm'];
    if(!accepted.includes(file.type))throw new Error('Unsupported file type. Use JPG, PNG, WebP, AVIF, GIF, PDF, MP4, or WebM.');
    const ext= (file.name.split('.').pop()||'file').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,10);
    const unique=typeof crypto.randomUUID==='function'?crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2);
    const filename=folder+'/'+unique+'.'+ext;
    setStatus('Uploading '+file.name+'…','saving');
    const {error}=await db.storage.from('portfolio-media').upload(filename,file,{contentType:file.type,upsert:false});
    if(error)throw error;
    const {data}=db.storage.from('portfolio-media').getPublicUrl(filename);
    return data.publicUrl;
  }
  function cropControls(parent,obj,src,label,keys=['coverPositionX','coverPositionY','coverZoom']){
    if(!src)return;
    const [xKey,yKey,zoomKey]=keys;
    const block=make('div','admin-crop-tool');
    const headline=make('p','admin-field-help','Image framing · position the image within its button or frame.');block.append(headline);
    const viewport=make('div','admin-crop-window');const layer=make('div','admin-crop-image');
    layer.style.backgroundImage=`url(${JSON.stringify(src)})`;viewport.append(layer);block.append(viewport);
    const update=()=>{layer.style.backgroundPosition=`${obj[xKey]??50}% ${obj[yKey]??50}%`;layer.style.transform=`scale(${obj[zoomKey]??1})`;};
    for(const [key,title,min,max,step,defaultValue] of [[xKey,'Horizontal position',0,100,1,50],[yKey,'Vertical position',0,100,1,50],[zoomKey,'Zoom',1,2.5,.05,1]]){
      const row=make('label','admin-crop-slider');const span=make('span','',title);const val=make('span','admin-crop-value');const input=make('input');input.type='range';input.min=String(min);input.max=String(max);input.step=String(step);input.value=String(obj[key]??defaultValue);
      const apply=()=>{obj[key]=Number(input.value);val.textContent=key===zoomKey?Math.round(obj[key]*100)+'%':Math.round(obj[key])+'%';update();touch();};
      input.oninput=apply;val.textContent=key===zoomKey?Math.round(Number(input.value)*100)+'%':input.value+'%';row.append(span,val,input);block.append(row);
    }
    const reset=button('Reset framing',()=>{obj[xKey]=50;obj[yKey]=50;obj[zoomKey]=1;touch();renderFields();},'small');block.append(reset);
    update();parent.append(block);
  }
  function asHeroRecord(entry){return typeof entry==='string'?{src:entry,positionX:50,positionY:50,zoom:1}:entry;}
  function heroPhotoEditor(photo){
    const panel=make('div','admin-hero-detail');
    const url=make('input','admin-input');url.type='url';url.placeholder='Homepage image HTTPS URL';url.value=photo.src||'';
    url.oninput=()=>{photo.src=url.value.trim();touch();};panel.append(url);
    cropControls(panel,photo,photo.src,'Homepage image',['positionX','positionY','zoom']);
    return panel;
  }

  function mediaField(parent,obj,key,label,kind='image',folder='images'){
    const {block,name}=group(parent,label);const box=make('div','admin-media-editor');const current=make('input','admin-input');
    current.id='admin-'+key+'-'+Math.random().toString(36).slice(2);name.htmlFor=current.id;
    current.type='url';current.placeholder='Paste an HTTPS image, PDF or video URL';current.value=obj[key]||'';
    current.addEventListener('input',()=>{obj[key]=current.value.trim();touch();});
    if(kind==='image')current.addEventListener('change',()=>renderFields());
    const row=make('div','admin-media-row');const file=make('input');file.type='file';file.accept=kind==='pdf'?'.pdf,application/pdf':kind==='video'?'video/mp4,video/webm':'image/jpeg,image/png,image/webp,image/avif,image/gif';
    file.setAttribute('aria-label','Upload '+label);file.addEventListener('change',async()=>{
      try{const url=await upload(file.files?.[0],folder);if(!url)return;obj[key]=url;current.value=url;touch();renderFields();setStatus('File uploaded — save draft, then publish when ready.','unsaved');}
      catch(e){alert('Upload failed: '+(e?.message||e));setStatus('Upload failed','error');}
    });
    row.append(file);if(obj[key] && /^https?:\/\//.test(obj[key])){
      const link=make('a','admin-open-link','Open ↗');link.href=obj[key];link.target='_blank';link.rel='noopener noreferrer';row.append(link);
    }
    box.append(current,row);
    if(kind==='image' && obj[key]){cropControls(box,obj,obj[key],label);}
    if(kind==='pdf'){
      const help=make('p','admin-field-help','Large PDF? In Google Drive: Share → General access → Anyone with the link → Viewer, then copy the FILE link and paste it above. The portfolio will automatically open it in Google Drive’s embedded PDF viewer. Test the link in a private/incognito window. Google may display the owner name.');
      box.append(help);
      const test=make('a','admin-open-link','Test PDF link ↗');test.href=obj[key]||'#';test.target='_blank';test.rel='noopener noreferrer';test.onclick=e=>{if(!obj[key]){e.preventDefault();alert('Paste your public Google Drive URL first.');}};box.append(test);
    }
    block.append(box);
  }
  function rowActions(parent,arr,index,rebuild){
    const actions=make('div','admin-inline-actions');
    actions.append(button('↑',()=>{if(index===0)return;[arr[index-1],arr[index]]=[arr[index],arr[index-1]];touch();rebuild();},'small'));
    actions.append(button('↓',()=>{if(index===arr.length-1)return;[arr[index+1],arr[index]]=[arr[index],arr[index+1]];touch();rebuild();},'small'));
    actions.append(button('Remove',()=>{if(!confirm('Remove this item from the portfolio?'))return;arr.splice(index,1);focused=null;touch();rebuild();},'small danger'));
    return actions;
  }
  function heroImages(){
    heading('Homepage image gallery','Upload multiple images. Each refresh selects another photo (avoiding the last image when possible). Adjust position and zoom per image.');
    draft.site.hero_images=(draft.site.hero_images||[]).map(asHeroRecord);
    const list=make('div','admin-list');fieldBox.append(list);
    draft.site.hero_images.forEach((photo,i)=>{
      const line=make('div','admin-list-row');const image=make('img','admin-list-thumb');image.src=photo.src;image.alt='Homepage image '+(i+1);
      const details=make('div','admin-hero-list-info');const span=make('span','admin-list-label','Homepage image '+String(i+1));details.append(span);
      const toggle=button('Adjust crop',()=>{const old=line.querySelector('.admin-hero-detail');if(old){old.remove();return;}line.append(heroPhotoEditor(photo));},'small');details.append(toggle);
      line.append(image,details,rowActions(line,draft.site.hero_images,i,renderFields));list.append(line);
    });
    const {block}=group(fieldBox,'Upload multiple homepage images');const file=make('input');file.type='file';file.multiple=true;file.accept='image/*';
    file.addEventListener('change',async()=>{try{const chosen=[...(file.files||[])];for(const item of chosen){const url=await upload(item,'home');draft.site.hero_images.push({src:url,positionX:50,positionY:50,zoom:1});}touch();renderFields();setStatus(`${chosen.length} homepage image(s) added. Save draft / Publish changes.`,'unsaved');}catch(e){alert(e.message||e)}});block.append(file);
    const {block:linkBlock}=group(fieldBox,'Or add an image URL');
    const row=make('div','admin-media-row');const input=make('input','admin-input');input.type='url';input.placeholder='https://.../photo.webp';row.append(input,button('Add URL',()=>{if(!/^https:\/\//.test(input.value.trim()))return alert('Enter an HTTPS image URL.');draft.site.hero_images.push({src:input.value.trim(),positionX:50,positionY:50,zoom:1});touch();renderFields();},'small'));linkBlock.append(row);
  }
  function collectionList(kind){
    const key=kind==='academic'?'academic_projects':kind==='professional'?'professional_projects':'creative_collections';
    const items=draft[key]||[];
    const name={academic:'Academic projects',professional:'Professional projects',creative:'Creative sets'}[kind];
    heading(name,'Select an item to edit its title, description, images and media.');
    const list=make('div','admin-list');fieldBox.append(list);
    items.forEach((item,index)=>{
      const line=make('div','admin-list-row');
      if(item.cover){const image=make('img','admin-list-thumb');image.src=item.cover;image.alt='';line.append(image);}
      const label=button(item.title||'Untitled',()=>{focused={kind,index};renderFields();navigatePreview(detailUrl(kind,item));},'admin-list-edit');
      const actions=rowActions(line,items,index,renderFields);
      if(kind==='professional')actions.prepend(button('＋ Episode',()=>addEpisode(item,index),'small'));
      line.append(label,actions);list.append(line);
    });
    fieldBox.append(button('＋ Add '+({academic:'project',professional:'production',creative:'set'}[kind]),()=>{
      const name='Untitled '+(kind==='creative'?'set':'project');let item={slug:safeSlug(name),title:name,subtitle:'',cover:'',tone:defaultTone[kind]};
      if(kind==='academic')Object.assign(item,{description:'',pdf:''});
      else if(kind==='professional')Object.assign(item,{description:'',role:'',responsibilities:'',episodes:[]});
      else item.media=[];
      items.push(item);focused={kind,index:items.length-1};touch();renderFields();navigatePreview(detailUrl(kind,item));
    },'admin-add'));
  }
  function detailUrl(kind,item){
    if(kind==='academic')return path('work/academic/project/?id='+encodeURIComponent(item.slug));
    if(kind==='professional')return path('work/professional/show/?id='+encodeURIComponent(item.slug));
    return path('work/creative-explorations/set/?id='+encodeURIComponent(item.slug));
  }
  function editAcademic(item){
    heading('Academic project','The cover, short introduction and complete PDF shown on this project page.');
    textField(fieldBox,item,'title','Project title');
    textField(fieldBox,item,'subtitle','Subtitle / academic year');
    textField(fieldBox,item,'description','Short description',true);
    mediaField(fieldBox,item,'cover','Project cover image','image','academic');
    mediaField(fieldBox,item,'pdf','Complete PDF document','pdf','academic');
    fieldBox.append(make('p','admin-field-help','Large PDFs can be hosted externally. Paste a public HTTPS link instead of uploading.'));
  }
  function addEpisode(show,index){
    const eps=show.episodes||(show.episodes=[]);
    const ep={slug:safeSlug('episode'),title:'Untitled episode',subtitle:'Watch episode',description:'',cover:'',video_url:''};
    eps.push(ep);focused={kind:'professional',index,episode:eps.length-1};
    touch();renderFields();navigatePreview(path('work/professional/episode/?show='+encodeURIComponent(show.slug)+'&id='+encodeURIComponent(ep.slug)));
    setStatus('New episode added to draft — enter its title, image & video URL, then Save draft.','unsaved');
  }

  function editProfessional(item){
    heading('Professional production','Edit the production information and selected episodes.');
    textField(fieldBox,item,'title','Production title');textField(fieldBox,item,'subtitle','Production subtitle');
    textField(fieldBox,item,'description','Production description',true);
    textField(fieldBox,item,'role','Your role');textField(fieldBox,item,'responsibilities','Your responsibilities',true);
    mediaField(fieldBox,item,'cover','Card cover image','image','professional');
    heading('Selected episodes','Each image-backed episode card opens its own YouTube or Vimeo player page.');
    const eps=item.episodes|| (item.episodes=[]);const list=make('div','admin-list');fieldBox.append(list);
    eps.forEach((episode,index)=>{
      const line=make('div','admin-list-row');const edit=button(episode.title||'Untitled episode',()=>{focused.episode=index;renderFields();navigatePreview(path('work/professional/episode/?show='+encodeURIComponent(item.slug)+'&id='+encodeURIComponent(episode.slug)));},'admin-list-edit');
      line.append(edit,rowActions(line,eps,index,renderFields));list.append(line);
    });
    fieldBox.append(button('＋ Add episode to '+item.title,()=>addEpisode(item,focused.index),'admin-add'));
  }
  function editEpisode(ep){
    heading('Episode','A large image card will link to this episode’s individual video page.');
    textField(fieldBox,ep,'title','Episode title');textField(fieldBox,ep,'subtitle','Subtitle');
    textField(fieldBox,ep,'description','Optional short description',true);
    mediaField(fieldBox,ep,'cover','Episode card image','image','professional');
    textField(fieldBox,ep,'video_url','YouTube / Vimeo URL',false,'https://www.youtube.com/watch?v=…');
    fieldBox.append(make('p','admin-field-help','The video must allow embedding. Use its public URL, not iframe HTML.'));
    const show=draft.professional_projects[focused.index];
    fieldBox.append(button('＋ Add another episode',()=>addEpisode(show,focused.index),'admin-add'));
    fieldBox.append(make('p','admin-field-help','After adding or editing episodes, choose Save draft and then Publish changes.'));
  }
  function editCreative(item){
    heading('Creative set','A single mixed-media set. Add images and videos in any order.');
    textField(fieldBox,item,'title','Set title');textField(fieldBox,item,'subtitle','Short subtitle');
    mediaField(fieldBox,item,'cover','Set cover image','image','creative');
    heading('Images and videos','Click Edit on a visual to change its title, file or link.');
    const media=item.media|| (item.media=[]);const list=make('div','admin-list');fieldBox.append(list);
    media.forEach((visual,index)=>{
      const line=make('div','admin-list-row');if(visual.thumbnail||(visual.type!=='video'&&visual.src)){const img=make('img','admin-list-thumb');img.src=visual.thumbnail||visual.src;img.alt='';line.append(img);}
      line.append(button(visual.title||'Untitled visual',()=>{focused.media=index;renderFields();},'admin-list-edit'),rowActions(line,media,index,renderFields));list.append(line);
    });
    fieldBox.append(button('＋ Add image or video',()=>{
      media.push({title:'Untitled visual',type:'image',src:'',thumbnail:''});focused.media=media.length-1;touch();renderFields();
    },'admin-add'));
  }
  function editVisual(item){
    heading('Visual item','Upload an image, or paste a video URL and upload its thumbnail.');
    textField(fieldBox,item,'title','Image / video title');
    const {block,name}=group(fieldBox,'Media type');const select=make('select','admin-input');name.htmlFor='visual-type';select.id='visual-type';
    [['image','Image'],['video','Video']].forEach(([value,label])=>{const opt=make('option','',label);opt.value=value;select.append(opt);});select.value=item.type||'image';
    select.onchange=()=>{item.type=select.value;touch();renderFields();};block.append(select);
    if(item.type==='video'){
      mediaField(fieldBox,item,'src','Video file or YouTube/Vimeo URL','video','creative');
      mediaField(fieldBox,item,'thumbnail','Video thumbnail','image','creative');
    } else mediaField(fieldBox,item,'src','Image file','image','creative');
  }
  function editWork(){heading('Work category images','These are the three large buttons that visitors see after they press Let’s explore.');
    for(const key of ['academic','professional','creative']){
      const obj=draft.categories[key]|| (draft.categories[key]={title:key,subtitle:'',cover:'',tone:defaultTone[key]});
      const title=make('h4','admin-subheading',SEC[key]);fieldBox.append(title);
      textField(fieldBox,obj,'title','Category title');textField(fieldBox,obj,'subtitle','Subtitle');
      mediaField(fieldBox,obj,'cover','Background image','image','categories');
    }
  }
  function editAbout(){heading('About','Edit your short introduction and the three paragraphs on the About page.');
    textField(fieldBox,draft.site,'about_intro','Introduction',true);
    if(!Array.isArray(draft.site.about_paragraphs))draft.site.about_paragraphs=[];
    for(let i=0;i<3;i++){
      const obj={value:draft.site.about_paragraphs[i]||''};const input=textField(fieldBox,obj,'value','Paragraph '+(i+1),true);
      input.addEventListener('input',()=>{draft.site.about_paragraphs[i]=input.value;touch();});
    }
  }
  function editContact(){heading('Contact','Change your contact information and welcome message.');
    textField(fieldBox,draft.site,'contact_intro','Contact introduction',true);
    textField(fieldBox,draft.site,'email','Public contact email');textField(fieldBox,draft.site,'linkedin','LinkedIn URL');
  }
  function renderTabs(){tabs.replaceChildren();for(const [key,label] of Object.entries(SEC)){
    const b=button(label,()=>{section=key;focused=null;renderTabs();renderFields();navigatePreview(defaultUrl(key));},section===key?'active':'');tabs.append(b);
  }}
  function defaultUrl(key){return path(({home:'',work:'work/',academic:'work/academic/',professional:'work/professional/',creative:'work/creative-explorations/',about:'about/',contact:'contact/'}[key]||'' )+'?portfolio_preview=1');}
  function navigatePreview(url){if(preview.src!==new URL(url,location.origin).href)preview.src=url;else sendPreview();}
  function routeToSection(){
    try{
      const loc=preview.contentWindow.location;
      const pathName=loc.pathname.replace(base,'').split('/').filter(Boolean);
      if(pathName[0]==='about'||pathName[0]==='contact')return [pathName[0],null];
      if(pathName[0]!=='work')return ['home',null];
      if(!pathName[1])return ['work',null];
      if(pathName[1]==='academic')return ['academic', pathName[2] ? ['academic', loc.searchParams?.get('id') || (pathName[2]==='project'?new URLSearchParams(loc.search).get('id'):pathName[2])] : null];
      if(pathName[1]==='professional'){
        if(pathName[2]==='episode')return ['professional',['episode', new URLSearchParams(loc.search).get('show'),new URLSearchParams(loc.search).get('id')]];
        return ['professional',pathName[2]?['professional',pathName[2]==='show'?new URLSearchParams(loc.search).get('id'):pathName[2]]:null];
      }
      if(pathName[1]==='creative-explorations')return ['creative',pathName[2]?['creative',pathName[2]==='set'?new URLSearchParams(loc.search).get('id'):pathName[2]]:null];
    }catch(_){}return [section,null];
  }
  function syncWithPreview(){const [area,id]=routeToSection();
    const prev=focused;
    section=area;focused=null;
    if(id){if(id[0]==='episode'){const i=draft.professional_projects.findIndex(x=>x.slug===id[1]);if(i>=0){focused={kind:'professional',index:i,episode:draft.professional_projects[i].episodes.findIndex(x=>x.slug===id[2])};}}
      else{const key={academic:'academic_projects',professional:'professional_projects',creative:'creative_collections'}[id[0]];const i=draft[key]?.findIndex(x=>x.slug===id[1]);if(i>=0)focused={kind:id[0],index:i};}}
    if(!focused && area==='professional' && prev?.kind==='professional' && prev.index>=0 && (!id || id[0]==='episode'))focused=prev;
    renderTabs();renderFields();sendPreview();
  }
  function renderFields(){if(!draft)return;
    const editor=fieldBox.closest('.admin-editor');const scroll=editor?.scrollTop||0;
    fieldBox.replaceChildren();
    requestAnimationFrame(()=>{if(editor)editor.scrollTop=scroll;});
    if(focused && focused.kind===section){
      const key={academic:'academic_projects',professional:'professional_projects',creative:'creative_collections'}[section];
      const item=draft[key]?.[focused.index];if(!item){focused=null;renderFields();return;}
      fieldBox.append(button('← Back to '+SEC[section],()=>{focused=null;renderFields();navigatePreview(defaultUrl(section));},'admin-back'));
      if(section==='academic')editAcademic(item);
      if(section==='professional'){
        if(Number.isInteger(focused.episode)&&focused.episode>=0){
          const ep=item.episodes?.[focused.episode];if(ep){fieldBox.append(button('← Back to production',()=>{delete focused.episode;renderFields();navigatePreview(detailUrl('professional',item));},'admin-back'));editEpisode(ep);}
          else{delete focused.episode;renderFields();}
        }else editProfessional(item);
      }
      if(section==='creative'){
        if(Number.isInteger(focused.media)&&focused.media>=0){const vis=item.media?.[focused.media];if(vis){fieldBox.append(button('← Back to set',()=>{delete focused.media;renderFields();},'admin-back'));editVisual(vis);}else{delete focused.media;renderFields();}}
        else editCreative(item);
      }
      return;
    }
    if(section==='home'){
      heading('Homepage','The main introduction and your rotating background images.');
      textField(fieldBox,draft.site,'hero_intro','Introduction',true);
      textField(fieldBox,draft.site,'homepage_button','Explore button text');
      if(!Array.isArray(draft.site.hero_images))draft.site.hero_images=[];heroImages();
    }
    if(section==='work')editWork();
    if(section==='academic') {heading('Education intro');textField(fieldBox,draft,'academic_intro','Intro above academic projects',true);collectionList('academic');}
    if(section==='professional')collectionList('professional');
    if(section==='creative')collectionList('creative');
    if(section==='about')editAbout();
    if(section==='contact')editContact();
  }
  async function saveDraft(automatic=false){
    if(!draft)return false;
    clearTimeout(autosaveTimer);
    const snapshot=JSON.stringify(draft);
    if(automatic && snapshot===lastSaved)return true;
    setStatus(automatic?'Auto-saving draft…':'Saving draft…','saving');
    const {error}=await db.from('portfolio_drafts').upsert({id:'main',content:JSON.parse(snapshot),updated_at:new Date().toISOString()});
    if(error){setStatus('Save failed','error');if(!automatic)alert('Cannot save: '+error.message);return false;}
    lastSaved=snapshot;
    if(JSON.stringify(draft)===snapshot){hasChanges=false;setStatus(automatic?'Draft saved automatically':'Draft saved','success');}
    else{setStatus('New unsaved changes','unsaved');clearTimeout(autosaveTimer);autosaveTimer=setTimeout(()=>saveDraft(true),1300);}
    return true;
  }
  async function publish(){if(!confirm('Publish this draft to your public website?'))return;
    if(!await saveDraft(false))return;
    setStatus('Publishing…','saving');
    const {error}=await db.from('portfolio_published').upsert({id:'main',content:draft,updated_at:new Date().toISOString()});
    if(error){setStatus('Publish failed','error');alert('Cannot publish: '+error.message);return;}
    setStatus('Published successfully','success');
  }
  async function startEditor(user){
    const {data:membership,error:memberError}=await db.from('portfolio_admins').select('user_id').eq('user_id',user.id).maybeSingle();
    if(memberError||!membership){await db.auth.signOut();showError('This account is not authorized to edit the portfolio. Add its User ID to portfolio_admins in Supabase.');return;}
    let {data:pub,error:pubError}=await db.from('portfolio_published').select('content').eq('id','main').maybeSingle();
    let {data:dr,error:drError}=await db.from('portfolio_drafts').select('content').eq('id','main').maybeSingle();
    if(pubError||drError){showError((pubError||drError).message);return;}
    let starter=null;
    try{const res=await fetch(path('assets/initial-content.json'));if(res.ok)starter=await res.json();}catch(_){}
    draft=structuredClone(dr?.content||pub?.content||starter);
    if(!draft){showError('The starting content file is missing. Check the GitHub upload.');return;}
    draft.site.about_intro ||= 'A creative-minded person with a soft spot for good ideas, good design, and figuring out how to make them happen.';
    draft.site.about_paragraphs ||= [
      'I like working somewhere between strategy and making — where a clear idea can become a campaign, an experience, an image, or something completely different.',
      'My background combines fashion management, marketing, communication and media with hands-on experience in television production. I care about the thinking behind the work just as much as how it looks and feels.',
      "After three years studying in Milan, I'm now based in Prague and always curious about what comes next."
    ];
    draft.site.contact_intro ||= 'Have a question, an idea, or just want to say hello? My inbox is open.';
    loginPanel.hidden=true;shell.hidden=false;
    lastSaved=JSON.stringify(draft);setStatus(dr?.content?'Draft ready':'Starting content ready');
    preview.addEventListener('load',syncWithPreview);
    window.addEventListener('message',event=>{if(event.origin===location.origin&&event.source===preview.contentWindow&&event.data?.type==='PORTFOLIO_PREVIEW_READY')sendPreview();});
    $('#admin-save').onclick=()=>saveDraft(false);$('#admin-publish').onclick=publish;
    $('#admin-signout').onclick=async()=>{if(hasChanges&&!confirm('You have unsaved changes. Log out anyway?'))return;await db.auth.signOut();location.reload();};
    $('#admin-open-live').onclick=()=>window.open(path(), '_blank', 'noopener,noreferrer');
    renderTabs();renderFields();preview.src=defaultUrl('home');
    window.addEventListener('beforeunload',event=>{if(hasChanges){event.preventDefault();event.returnValue='';}});
  }
  let backend;
  try{const response=await fetch(path('assets/backend.json'),{cache:'no-store'});backend=await response.json();}catch(_){}
  if(!backend?.url||!backend?.publishableKey){setupNote.hidden=false;showError('Admin is not connected yet. Create the separate Supabase project, run schema.sql, and add your project URL + publishable key in config/backend.json.');return;}
  if(!window.supabase?.createClient){showError('The authentication library could not load. Check your connection and refresh.');return;}
  db=window.supabase.createClient(backend.url,backend.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
  const {data:session}=await db.auth.getSession();if(session?.session?.user)await startEditor(session.session.user);
  form.addEventListener('submit',async event=>{
    event.preventDefault();errorBox.hidden=true;
    const submit=form.querySelector('[type=submit]');submit.disabled=true;submit.textContent='Signing in…';
    const f=new FormData(form);
    const {data,error}=await db.auth.signInWithPassword({email:String(f.get('email')||''),password:String(f.get('password')||'')});
    submit.disabled=false;submit.textContent='Sign in ↗';
    if(error){showError(error.message);return;}
    await startEditor(data.user);
  });
})();
