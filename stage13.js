(() => {
'use strict';
const $=s=>document.querySelector(s);
let playerVisible=true;

function ytId(){
  const href=$('#youtubeBtn')?.href||'';
  const m=href.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([A-Za-z0-9_-]{11})/);
  return m?.[1]||'';
}
function ensureCss(){
  if(document.querySelector('link[href="/stage13.css"]'))return;
  const l=document.createElement('link');l.rel='stylesheet';l.href='/stage13.css';document.head.append(l);
}
function ensureUi(){
  if($('#miniPlayer'))return;
  document.body.insertAdjacentHTML('beforeend',`<aside class="mini-player" id="miniPlayer" aria-label="Mini player"><div class="mini-cover"><img id="miniCover" alt=""></div><button class="mini-copy" id="miniOpen" type="button" aria-label="Mergi la player"><b id="miniTitle">—</b><span id="miniArtist">—</span></button><div class="mini-controls"><button class="mini-btn primary" id="miniPlay" type="button" aria-label="Redă sau pune pauză">▶</button><button class="mini-btn" id="miniNext" type="button" aria-label="Următoarea piesă">▶|</button></div></aside>`);
}
function sync(){
  const wrap=$('#miniPlayer');if(!wrap)return;
  const id=ytId();
  const title=($('#title')?.textContent||'').trim();
  const meta=($('#meta')?.textContent||'').trim();
  const hasTrack=!!id&&title&&title!=='Alege o melodie';
  const mobile=matchMedia('(max-width:820px)').matches;
  const show=mobile&&hasTrack&&!playerVisible;
  wrap.classList.toggle('show',show);
  document.body.classList.toggle('mini-player-visible',show);
  if(id) $('#miniCover').src=`https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
  $('#miniTitle').textContent=title||'—';
  $('#miniArtist').textContent=meta.split(' · ')[0]||'—';
  const p=($('#playBtn')?.textContent||'').trim();
  $('#miniPlay').textContent=p==='❚❚'?'❚❚':'▶';
}
function observePlayer(){
  const target=$('.player-sticky');if(!target)return;
  if('IntersectionObserver' in window){
    new IntersectionObserver(entries=>{playerVisible=!!entries[0]?.isIntersecting;sync()},{threshold:.2}).observe(target);
  }else{
    const check=()=>{const r=target.getBoundingClientRect();playerVisible=r.bottom>80&&r.top<innerHeight;sync()};
    addEventListener('scroll',check,{passive:true});addEventListener('resize',check);check();
  }
}
function bind(){
  $('#miniPlay')?.addEventListener('click',()=>$('#playBtn')?.click());
  $('#miniNext')?.addEventListener('click',()=>$('#nextBtn')?.click());
  $('#miniOpen')?.addEventListener('click',()=>$('.player-sticky')?.scrollIntoView({behavior:'smooth',block:'start'}));
  const targets=['#title','#meta','#playBtn','#youtubeBtn'];
  targets.forEach(sel=>{const el=$(sel);if(el)new MutationObserver(sync).observe(el,{childList:true,subtree:true,characterData:true,attributes:true})});
  addEventListener('resize',sync,{passive:true});
  document.addEventListener('visibilitychange',sync);
}
function init(){ensureCss();ensureUi();observePlayer();bind();setTimeout(sync,300);setInterval(sync,1500)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
