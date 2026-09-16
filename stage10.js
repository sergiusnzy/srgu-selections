(() => {
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const BASE='https://srgu.vercel.app';
const parseYT=s=>{const m=String(s||'').match(/(?:youtu\.be\/|v=|shorts\/|embed\/|live\/)([A-Za-z0-9_-]{11})/);return m?.[1]||(/^[A-Za-z0-9_-]{11}$/.test(String(s||''))?String(s):'')};
const currentYT=()=>parseYT($('#youtubeBtn')?.href||'');
const shareUrl=id=>`${BASE}/t/${id}`;
let deepLinked=false;

function ensureCss(){if(!document.querySelector('link[href="/stage10.css"]')){const l=document.createElement('link');l.rel='stylesheet';l.href='/stage10.css';document.head.append(l)}}
function ensureInfoButton(){
  if($('#trackInfoBtn'))return;
  const a=document.createElement('a');a.id='trackInfoBtn';a.className='round track-info-btn';a.href='#';a.title='Pagina piesei';a.setAttribute('aria-label','Pagina piesei');a.textContent='i';
  $('#shareTrackBtn')?.insertAdjacentElement('afterend',a);
}
function refreshInfo(){
  const id=currentYT(),a=$('#trackInfoBtn');if(a){a.href=id?`/t/${id}`:'#';a.hidden=!id}
}
function decorateCards(){
  $$('#feed .card').forEach(card=>{
    const img=card.querySelector('.thumb img');const id=parseYT(img?.src||'');const thumb=card.querySelector('.thumb');if(!id||!thumb)return;
    let a=thumb.querySelector('.track-detail-link');
    if(!a){a=document.createElement('a');a.className='track-detail-link';a.textContent='i';a.title='Pagina piesei';a.setAttribute('aria-label','Pagina piesei');thumb.append(a)}
    a.href=`/t/${id}`;
  });
}
function openDeepLink(){
  if(deepLinked)return;
  const id=new URLSearchParams(location.search).get('track');if(!id)return;
  const clean=parseYT(id);if(!clean)return;
  const card=$$('#feed .card').find(c=>parseYT(c.querySelector('.thumb img')?.src||'')===clean);
  if(card){deepLinked=true;card.click();setTimeout(()=>window.scrollTo({top:0,behavior:'smooth'}),120)}
}
async function shareCurrent(){
  const id=currentYT();if(!id)return;
  const url=shareUrl(id);const title=$('#title')?.textContent||'SRGU Selections';const text=$('#meta')?.textContent||'Ascultă în SRGU Selections';
  try{if(navigator.share)await navigator.share({title,text,url});else{await navigator.clipboard.writeText(url);const e=document.createElement('div');e.className='toast';e.textContent='Link SRGU copiat ✓';$('#toasts')?.append(e);setTimeout(()=>e.remove(),2200)}}catch{}
}
function bind(){
  document.addEventListener('click',e=>{
    const detail=e.target.closest('.track-detail-link');if(detail){e.stopPropagation();return}
    if(e.target.closest('#trackInfoBtn')){const id=currentYT();if(!id){e.preventDefault()}return}
    if(e.target.closest('#shareTrackBtn')){e.preventDefault();e.stopImmediatePropagation();shareCurrent();return}
  },true);
  const title=$('#title');if(title)new MutationObserver(()=>{refreshInfo();}).observe(title,{childList:true,subtree:true,characterData:true});
  const feed=$('#feed');if(feed)new MutationObserver(()=>requestAnimationFrame(()=>{decorateCards();openDeepLink()})).observe(feed,{childList:true});
}
function init(){ensureCss();ensureInfoButton();decorateCards();refreshInfo();bind();openDeepLink()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
