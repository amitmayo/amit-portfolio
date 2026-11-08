/* Homepage typography model: only text, bold, italic and a fixed palette. */
(() => {
  'use strict';
  const palette = Object.freeze({
    ivory: '#f3eee9',
    pearl: '#fffaf3',
    rose: '#e5b0bf',
    burgundy: '#c17e8d',
    burgundyDeep: '#944a5c'
  });
  const choices = Object.keys(palette);
  const limit = 900;
  const defaultHeading = Object.freeze([
    {text:'hey ',bold:false,italic:false,color:'ivory'},
    {text:'you.',bold:false,italic:true,color:'ivory'}
  ]);
  const defaultEffects = Object.freeze(['burgundy-veil','soft-spotlight','velvet-gradient','rose-glow']);
  const effect = input => defaultEffects.includes(input) ? input : 'burgundy-veil';
  const color = input => Object.hasOwn(palette,input) ? input : 'ivory';
  function normalize(input, fallback='') {
    const source=Array.isArray(input)&&input.length ? input : [{text:String(fallback??'')}];
    const out=[];let length=0;
    for(const raw of source){
      if(!raw || typeof raw.text!=='string' || length>=limit)continue;
      const text=raw.text.replace(/\r/g,'').slice(0,limit-length);if(!text)continue;
      const run={text,bold:raw.bold===true,italic:raw.italic===true,color:color(raw.color)};
      const previous=out[out.length-1];
      if(previous&&previous.bold===run.bold&&previous.italic===run.italic&&previous.color===run.color)previous.text+=text;
      else out.push(run);
      length+=text.length;
    }
    return out;
  }
  const heading = input => Array.isArray(input)&&input.length?normalize(input):defaultHeading.map(x=>({...x}));
  const flat = runs => normalize(runs).map(r=>r.text).join('');
  function nodes(runs, documentRef=document) {
    const fragment=documentRef.createDocumentFragment();
    for(const r of normalize(runs)){
      const span=documentRef.createElement('span');
      span.className='hero-rich-run'+(r.bold?' is-bold':'')+(r.italic?' is-italic':'');
      span.dataset.heroRun='';span.dataset.heroColor=r.color;
      span.dataset.heroBold=r.bold?'true':'false';span.dataset.heroItalic=r.italic?'true':'false';
      span.textContent=r.text;fragment.append(span);
    }
    return fragment;
  }
  function write(node,runs){if(node)node.replaceChildren(nodes(runs,node.ownerDocument));}
  function fromDOM(node,fallback=''){
    if(!node)return normalize([],fallback);
    const result=[];
    const walker=node.ownerDocument.createTreeWalker(node,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()){
      const el=walker.currentNode;let ancestor=el.parentElement;
      while(ancestor&&ancestor!==node&&!ancestor.hasAttribute('data-hero-run'))ancestor=ancestor.parentElement;
      const marked=ancestor&&ancestor!==node?ancestor:null;
      result.push({text:el.textContent,bold:marked?.dataset.heroBold==='true',italic:marked?.dataset.heroItalic==='true',color:marked?.dataset.heroColor||'ivory'});
    }
    return normalize(result,fallback);
  }
  function portion(runs,count){
    const out=[];let available=Math.max(0,count);
    for(const r of normalize(runs)){
      if(!available)break;
      const text=r.text.slice(0,available);
      if(text)out.push({...r,text});
      available-=text.length;
    }
    return out;
  }
  window.PortfolioHero=Object.freeze({palette,choices,normalize,heading,flat,nodes,write,fromDOM,portion,effect,defaultHeading});
})();
