(() => {
'use strict';
const KEY='srgu_recent_v1';
const MAX=30;
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}};
const write=v=>{try{localStorage.setItem(KEY,JSON.stringify(v))}catch{}};
const ytFromUrl=s=>{const m=String(s||'').match(/(?:youtu\.be\/|v=|\/vi\/)([A-Za-z0-9_-]{11})/);return m?.[1]||''};

function ensureCss(){if(document.querySelector('link[href="/stage11.css"]'))return;const l=document.createElement('link');l.rel='stylesheet';l.href='/stage11.css';document.head.append(l)}
function ensureUi(){
  if($('#recentSection'))return;
  const anchor=$('.discovery')||$('.feed-section');if(!anchor)return;
  const sec=document.createElement('section');sec.id='recentSection';sec.className='recent-section';sec.hidden=true;
  sec.innerHTML=`<div class="recent-head"><div><span class="eyebrow">Pe dispozitivul tău</span><h2>Ascultate recent</h2><div class="recent-privacy">Istoricul rămâne doar în acest browser.</div></div><span class="spacer"></span><button class="recent-clear" id="recentClear" type="button">Șterge istoricul</button></div><div class="recent-rail" id="recentRail"></div>`;
  anchor.insertAdjacentElement('afterend',sec);
}
function render(){
  const sec=$('#recentSection'),rail=$('#recentRail');if(!sec||!rail)return;
  const items=read().slice(0,8);sec.hidden=!items.length;
  rail.innerHTML=items.map(t=>`<button class="recent-card" type="button" data-recent-yt="${esc(t.yt)}"><div class="recent-cover"><img src="https://i.ytimg.com/vi/${esc(t.yt)}/mqdefault.jpg" alt="" loading="lazy"><span class="recent-play">▶</span></div><h3>${esc(t.title||'Fără titlu')}</h3><p>${esc(t.artist||'Necunoscut')}</p></button>`).join('');
}
function saveTrack(t){
  if(!t?.yt)return;
  const items=read().filter(x=>x.yt!==t.yt);
  items.unshift({yt:t.yt,title:t.title||'Fără titlu',artist:t.artist||'Necunoscut',playedAt:Date.now()});
  write(items.slice(0,MAX));render();
}
function captureCurrent(){
  const title=$('#title')?.textContent?.trim();
  if(!title||title==='Alege o melodie')return;
  const yt=ytFromUrl($('#youtubeBtn')?.href)||ytFromUrl($('#feed .card.active img')?.src);
  if(!yt)return;
  let artist='Necunoscut';
  const meta=$('#meta')?.textContent?.trim()||'';
  if(meta) artist=meta.split(' · ')[0]||artist;
  saveTrack({yt,title,artist});
}
function playRecent(yt){
  const card=[...document.querySelectorAll('#feed .card')].find(c=>ytFromUrl(c.querySelector('img')?.src)===yt);
  if(card){card.click();return}
  location.href='/?track='+encodeURIComponent(yt);
}
function bind(){
  document.addEventListener('click',e=>{
    const c=e.target.closest('[data-recent-yt]');if(c){playRecent(c.dataset.recentYt);return}
    if(e.target.closest('#recentClear')){write([]);render();return}
  });
  const title=$('#title');if(title)new MutationObserver(()=>setTimeout(captureCurrent,120)).observe(title,{childList:true,characterData:true,subtree:true});
  document.addEventListener('click',e=>{if(e.target.closest('#feed .card,.discovery-card,.queue-row'))setTimeout(captureCurrent,220)},true);
  window.addEventListener('srgu:track-play',e=>saveTrack(e.detail||{}));
}
function init(){ensureCss();ensureUi();render();bind();setTimeout(captureCurrent,1200)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
