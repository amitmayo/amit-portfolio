/* Private CV Studio. CV contents live ONLY in the admin-restricted portfolio_cv table.
   This module is never loaded on any public portfolio page. */
(() => {
  'use strict';
  const $ = (q, root=document) => root.querySelector(q);
  const TEMPLATES = [
    ['editorial-split', 'Editorial Split', 'An ivory page with a deep burgundy rule and classic two-column typography.'],
    ['burgundy-masthead', 'Burgundy Masthead', 'A strong wine-red masthead and carefully ruled content.'],
    ['quiet-ivory', 'Quiet Ivory', 'Restrained ivory editorial layout with understated accents.'],
    ['dark-atelier', 'Dark Atelier', 'Near-black paper, ivory type and subtle rose details.'],
    ['typewriter-index', 'Typewriter Index', 'An archival, monospaced editorial system with quiet borders.'],
    ['gallery-frame', 'Gallery Frame', 'A contemporary framed composition with an inset profile image.']
  ];
  const studio = {
    db: null, cv: null, lastSaved: '', timer: null, queue: Promise.resolve(), ready: false,
    showing: false, busy: false, root: null, sheet: null, fieldBox: null,
    async init(db) {
      this.db=db;
      const { data, error } = await db.from('portfolio_cv').select('content').eq('id','main').maybeSingle();
      if(error){this.error='Private CV table not configured: '+error.message;this.ready=false;return;}
      if(!data?.content){this.error='The private CV record is missing. Run the separate CV setup SQL in your portfolio Supabase project.';this.ready=false;return;}
      this.cv=structuredClone(data.content);
      this.cv.template ||= TEMPLATES[0][0];
      this.cv.photo ||= '';
      this.lastSaved=JSON.stringify(this.cv);
      this.ready=true;
    },
    show(){
      this.showing=true;
      const frame=$('#admin-preview'), top=$('.admin-preview-top span'), live=$('#admin-open-live');
      if(frame)frame.hidden=true;
      if(live)live.hidden=true;
      if(top)top.textContent='PRIVATE CV PREVIEW · A4';
      this.root=$('#cv-preview-root');if(this.root){this.root.hidden=false;this.draw();}
      const publish=$('#admin-publish');if(publish)publish.hidden=true;
      const save=$('#admin-save');if(save)save.textContent='Save CV';
      const description=$('.admin-editor-top p');if(description)description.textContent='Private document · never published to your website.';
    },
    hide(){
      this.showing=false;
      const frame=$('#admin-preview'), top=$('.admin-preview-top span'), live=$('#admin-open-live');
      if(frame)frame.hidden=false;
      if(live)live.hidden=false;
      if(top)top.textContent='WEBSITE PREVIEW';
      const root=$('#cv-preview-root');if(root)root.hidden=true;
      const publish=$('#admin-publish');if(publish)publish.hidden=false;
      const save=$('#admin-save');if(save)save.textContent='Save draft';
      const description=$('.admin-editor-top p');if(description)description.textContent='Changes are private until you publish.';
    },
    status(text,mode=''){
      if(!this.showing)return;
      const s=$('#admin-status');if(s){s.textContent=text;s.dataset.state=mode;}
    },
    changed(){
      this.draw();this.status('CV changes not saved yet','unsaved');
      clearTimeout(this.timer);
      this.timer=setTimeout(()=>this.save(true),1600);
    },
    async save(automatic=false){
      if(!this.ready)return false;
      clearTimeout(this.timer);
      const snapshot=JSON.stringify(this.cv);
      if(snapshot===this.lastSaved){if(!automatic)this.status('CV already saved','success');return true;}
      const run=async()=>{
        this.status(automatic?'Auto-saving CV…':'Saving CV…','saving');
        const {error}=await this.db.from('portfolio_cv').upsert({id:'main',content:JSON.parse(snapshot),updated_at:new Date().toISOString()});
        if(error){this.status('CV save failed','error');if(!automatic)alert('Could not save CV: '+error.message);return false;}
        this.lastSaved=snapshot;
        if(JSON.stringify(this.cv)===snapshot)this.status('Private CV saved','success');
        else {this.status('New changes to save','unsaved');clearTimeout(this.timer);this.timer=setTimeout(()=>this.save(true),1400);}
        return true;
      };
      this.queue=this.queue.then(run,run);
      return this.queue;
    },
    node(tag,cls='',value){const n=document.createElement(tag);if(cls)n.className=cls;if(value!==undefined)n.textContent=String(value);return n;},
    appendText(parent, tag, className, value){const n=this.node(tag,className,value);parent.append(n);return n;},
    makeSheet(){
      const c=this.cv, e=this.node.bind(this), outer=e('article','cv-sheet cv-'+c.template);
      outer.setAttribute('aria-label', 'One-page curriculum vitae of '+(c.name||'Amit Dahan Mayo'));
      const header=e('header','cv-sheet-header');
      const title=e('div','cv-name-block');
      this.appendText(title,'div','cv-kicker','CURRICULUM VITAE');
      this.appendText(title,'h1','cv-name',c.name);
      this.appendText(title,'p','cv-tagline',c.tagline);
      const photo=e('div','cv-photo-frame');
      if(c.photo){const img=e('img');img.src=c.photo;img.alt='CV portrait';img.style.objectPosition='50% '+Number(c.photoPositionY??50)+'%';photo.append(img);}
      else {this.appendText(photo,'span','cv-photo-placeholder','YOUR PHOTO');}
      header.append(title,photo);
      const summary=e('p','cv-summary',c.summary);
      const contacts=e('div','cv-contacts');
      const contactEntries=[['Email',c.contact?.email],['Phone',c.contact?.phone],['Location',c.contact?.location],['Date of birth',c.contact?.birthday],['LinkedIn',c.contact?.linkedin]];
      for(const [label,value] of contactEntries){const group=e('div','cv-contact');this.appendText(group,'span','cv-contact-label',label);this.appendText(group,'span','cv-contact-value',value||'');contacts.append(group);}
      const grid=e('div','cv-grid');
      const aside=e('aside','cv-sidebar'), main=e('main','cv-main-column');
      const section=(container,name,additionalClass='')=>{const block=e('section','cv-section '+additionalClass);this.appendText(block,'h2','cv-section-heading',name);container.append(block);return block;};
      let part=section(aside,'EDUCATION');
      for(const edu of c.education||[]){const entry=e('div','cv-school');this.appendText(entry,'h3','cv-item-title',edu.institution);
        for(const s of [edu.degree,edu.detail,edu.grade].filter(Boolean))this.appendText(entry,'div','cv-school-detail',s);
        this.appendText(entry,'div','cv-quiet', [edu.date,edu.location].filter(Boolean).join(' · '));part.append(entry);}
      part=section(aside,'LANGUAGES');for(const item of c.languages||[])this.appendText(part,'p','cv-short-line',item);
      part=section(aside,'SOFT SKILLS');this.bulletList(part,c.softSkills,'compact');
      part=section(aside,'SOFTWARES');this.bulletList(part,c.software,'compact');
      this.appendText(part,'h3','cv-subsection-label','ONLINE PLATFORMS:');this.bulletList(part,c.onlinePlatforms,'compact');
      part=section(aside,'STUDY FIELDS');
      this.appendText(part,'h3','cv-subsection-label','MAIN STUDY FIELDS:');this.bulletList(part,c.studyFields,'compact');
      this.appendText(part,'h3','cv-subsection-label','KEY ACADEMIC PROJECTS:');
      for(const proj of c.academicProjects||[]){
        const projWrap=e('div','cv-project-group');this.appendText(projWrap,'h3','cv-project-title',proj.title);
        this.bulletList(projWrap,proj.details,'nested');part.append(projWrap);
      }
      part=section(main,'EXPERIENCE','cv-experience');
      for(const x of c.experience||[]){
        const entry=e('div','cv-role');
        this.appendText(entry,'h3','cv-role-title',x.title);
        if(x.subtitle)this.appendText(entry,'p','cv-role-subtitle',x.subtitle);
        this.appendText(entry,'p','cv-role-company',x.company);
        this.bulletList(entry,x.bullets);
        if(x.note)this.appendText(entry,'p','cv-role-note',x.note);
        part.append(entry);
      }
      grid.append(aside,main);outer.append(header,summary,contacts,grid);
      return outer;
    },
    bulletList(parent,values,variant=''){
      if(!values?.length)return;
      const ul=this.node('ul','cv-bullets '+variant);
      values.forEach(x=>this.appendText(ul,'li','',x));parent.append(ul);
    },
    draw(){
      if(!this.root)return;
      this.root.replaceChildren();
      if(!this.ready){this.root.append(this.node('p','cv-setup-error',this.error||'CV has not been initialized.'));return;}
      const stage=this.node('div','cv-preview-scroll');
      const holder=this.node('div','cv-sheet-holder');
      const sheet=this.makeSheet();holder.append(sheet);stage.append(holder);this.root.append(stage);this.sheet=sheet;
      this.resizePreview();
      // Scale content typesetting a little if the total CV grows; keep all information on one A4 page.
      this.fitPage();
    },
    fitPage(){
      if(!this.sheet)return;
      this.sheet.style.setProperty('--cv-copy-size','10.0px');
      const grid=$('.cv-grid',this.sheet);if(!grid)return;
      const available=this.sheet.clientHeight-grid.offsetTop-30;
      let font=10;
      while(grid.scrollHeight>available && font>8.1){font-=.2;this.sheet.style.setProperty('--cv-copy-size',font.toFixed(1)+'px');}
      const overflowing=grid.scrollHeight>available+2;
      this.sheet.dataset.overflow=overflowing?'true':'false';
    },
    resizePreview(){
      const root=this.root;if(!root||!this.sheet)return;
      const holder=$('.cv-sheet-holder',root);if(!holder)return;
      const maxWidth=Math.max(220,root.clientWidth-44);
      const factor=Math.min(1,maxWidth/794);
      holder.style.width=(794*factor)+'px';holder.style.height=(1123*factor)+'px';
      this.sheet.style.transform=`scale(${factor})`;
      this.sheet.style.transformOrigin='top left';
    },
    renderFields(parent){
      this.fieldBox=parent;
      if(!this.ready){parent.append(this.node('p','admin-field-help',this.error||'Run the private CV setup SQL, then refresh Admin Mode.'));return;}
      this.appendText(parent,'h3','admin-field-heading','CV Studio');
      this.appendText(parent,'p','admin-field-help','Private A4 résumé. The imported wording is preserved. Changes here never appear on public portfolio pages.');
      this.appendText(parent,'h4','admin-subheading','Choose a design');
      const cards=this.node('div','cv-template-choices');
      for(const [id,title,description] of TEMPLATES){
        const b=this.node('button','cv-template-option');b.type='button';b.setAttribute('aria-pressed',String(id===this.cv.template));b.title=description;
        const swatch=this.node('span','cv-template-thumbnail cv-swatch-'+id);swatch.append(this.node('i'),this.node('b'),this.node('i'));
        b.append(swatch,this.node('span','cv-template-name',title));
        b.addEventListener('click',()=>{this.cv.template=id;this.changed();this.renderAdminFields();});cards.append(b);
      }
      parent.append(cards);
      const actions=this.node('div','cv-export-actions');
      const button=(name,fn,css='')=>{const b=this.node('button','admin-field-button '+css,name);b.type='button';b.onclick=fn;actions.append(b);return b;};
      button('Export PDF',()=>this.export('pdf'),'admin-add');
      button('Export JPEG',()=>this.export('jpeg'),'admin-add');
      button('Save CV',()=>this.save(false));
      parent.append(actions);
      this.appendText(parent,'p','admin-field-help','Exports are single-page A4 (PDF) or a high-resolution JPEG. Your text remains editable here.');
      this.appendText(parent,'h4','admin-subheading','Portrait');
      const photoPicker=this.node('input','admin-input');photoPicker.type='file';photoPicker.accept='image/png,image/jpeg,image/webp,image/avif';
      photoPicker.setAttribute('aria-label','Upload or replace CV portrait');parent.append(photoPicker);
      photoPicker.onchange=async()=>{const file=photoPicker.files?.[0];if(!file)return;
        try{this.cv.photo=await this.photoDataUrl(file);this.changed();this.status('Portrait loaded. CV will auto-save.','unsaved');}
        catch(e){alert('Could not use the photo: '+(e?.message||e));}
      };
      if(this.cv.photo){
        const position=this.node('label','cv-photo-control','Portrait vertical position');
        const range=this.node('input');range.type='range';range.min='0';range.max='100';range.value=String(this.cv.photoPositionY??50);
        range.oninput=()=>{this.cv.photoPositionY=Number(range.value);this.changed();};position.append(range);parent.append(position);
        parent.append(this.node('button','admin-field-button cv-remove-photo','Remove portrait'));
        parent.lastElementChild.onclick=()=>{this.cv.photo='';this.changed();this.renderAdminFields();};
      }
      this.appendText(parent,'h4','admin-subheading','Edit CV text');
      const simple=(title,entries,open=false)=>{
        const details=this.node('details','cv-editor-group');details.open=open;
        const summary=this.node('summary','',title);details.append(summary);
        for(const [label,obj,key,large] of entries)this.field(details,label,obj,key,large);
        parent.append(details);
        return details;
      };
      simple('Identity & introduction',[
        ['Name',this.cv,'name'],['Professional headline',this.cv,'tagline',true],['Profile paragraph',this.cv,'summary',true]
      ],true);
      simple('Contact information',Object.entries(this.cv.contact||{}).map(([key])=>[key,this.cv.contact,key]));
      simple('Education', (this.cv.education||[]).flatMap((e,i)=>Object.keys(e).map(k=>[`Education ${i+1} — ${k}`,e,k,k==='degree'])));
      for(const [title,key] of [['Languages','languages'],['Soft skills','softSkills'],['Software','software'],['Online platforms','onlinePlatforms'],['Study fields','studyFields']]){
        const items=this.cv[key]||[];simple(title,items.map((_,i)=>[`Item ${i+1}`,items,i]));
      }
      const academic=[];for(const [i,x] of (this.cv.academicProjects||[]).entries()){
        academic.push([`Project ${i+1} title`,x,'title']);for(const [j] of (x.details||[]).entries())academic.push([`Project ${i+1} detail ${j+1}`,x.details,j,true]);
      }simple('Key academic projects',academic);
      const experience=[];for(const [i,x] of (this.cv.experience||[]).entries()){
        for(const k of ['title','subtitle','company'])experience.push([`Experience ${i+1} — ${k}`,x,k]);
        for(const [j] of (x.bullets||[]).entries())experience.push([`Experience ${i+1} — bullet ${j+1}`,x.bullets,j,true]);
        experience.push([`Experience ${i+1} — closing note`,x,'note',true]);
      }simple('Professional experience',experience);
    },
    field(container,label,obj,key,large=false){
      const wrapper=this.node('label','cv-editor-field');
      wrapper.append(this.node('span','admin-field-label',label));
      const input=this.node(large?'textarea':'input','admin-input');
      if(!large)input.type='text';else input.rows=3;
      input.value=String(obj?.[key]??'');input.setAttribute('aria-label',label);
      input.oninput=()=>{obj[key]=input.value;this.changed();};wrapper.append(input);container.append(wrapper);
    },
    renderAdminFields(){if(this.fieldBox){this.fieldBox.replaceChildren();this.renderFields(this.fieldBox);}},
    async photoDataUrl(file){
      if(file.size>20*1024*1024)throw new Error('Choose a photo smaller than 20 MB.');
      const url=URL.createObjectURL(file);
      try{const image=await new Promise((res,rej)=>{const img=new Image();img.onload=()=>res(img);img.onerror=()=>rej(new Error('Image could not be read'));img.src=url;});
        const scale=Math.min(1,900/Math.max(image.naturalWidth,image.naturalHeight));
        const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
        const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,canvas.width,canvas.height);
        // Keep the portrait private as a compressed data URI within the admin-only database record.
        return canvas.toDataURL('image/jpeg',.82);
      }finally{URL.revokeObjectURL(url);}
    },
    async export(format){
      if(!this.ready||!this.sheet||this.busy)return;
      this.busy=true;this.status('Preparing '+format.toUpperCase()+'…','saving');
      const sheet=this.sheet;
      const originalTransform=sheet.style.transform,originalOrigin=sheet.style.transformOrigin;
      try{
        if(!window.html2canvas)throw new Error('Image export library did not load. Refresh the page and try again.');
        await document.fonts.ready;
        // Render an unscaled A4 sheet even when the on-screen preview is zoomed out.
        sheet.style.transform='none';sheet.style.transformOrigin='top left';
        const c=await html2canvas(sheet,{scale:3,useCORS:true,backgroundColor:getComputedStyle(sheet).backgroundColor,logging:false,windowWidth:1400});
        const filename=(this.cv.name||'Amit Dahan Mayo').replace(/[^\w\s-]/g,'').trim().replace(/\s+/g,'-')+'-CV';
        if(format==='jpeg'){
          const link=document.createElement('a');link.download=filename+'.jpg';link.href=c.toDataURL('image/jpeg',.95);link.click();
        }else{
          const JsPDF=window.jspdf?.jsPDF;
          if(!JsPDF)throw new Error('PDF export library did not load. Refresh the page and try again.');
          const pdf=new JsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});
          pdf.addImage(c.toDataURL('image/jpeg',.94),'JPEG',0,0,210,297,undefined,'FAST');
          pdf.setProperties({title:'CV — '+(this.cv.name||'Amit Dahan Mayo'),subject:'Portfolio CV'});
          pdf.save(filename+'.pdf');
        }
        this.status(format.toUpperCase()+' exported','success');
      }catch(error){this.status('Export failed','error');alert('Export failed: '+(error?.message||error));}
      finally{sheet.style.transform=originalTransform;sheet.style.transformOrigin=originalOrigin;this.busy=false;}
    }
  };
  window.CVStudio=studio;
  window.addEventListener('resize',()=>{if(studio.showing)studio.resizePreview();});
})();
