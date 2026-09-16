(() => {
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
let tracks=[];

function ensureUi(){
  if(!document.querySelector('link[href="/stage9.css"]')){
    const l=document.createElement('link');l.rel='stylesheet';l.href='/stage9.css';document.head.append(l);
  }
  if(!$('#discoveryCollections')){
    const s=document.createElement('section');s.id='discoveryCollections';s.className='discovery-collections';s.setAttribute('aria-label','Colecții recomandate');
    $('.discovery')?.insertAdjacentElement('afterend',s);
  }
}

function thumb(yt){return `https://i.ytimg.com/vi/${encodeURIComponent(yt)}/mqdefault.jpg`}
function tags(t){return Array.isArray(t?.tags)?t.tags.map(norm):[]}
function isNight(t){const hay=norm([t.mood,t.genre,t.energy,t.origin,...(Array.isArray(t.tags)?t.tags:[])].join(' '));return hay.includes('night drive')||hay.includes('nightdrive')||hay.includes('late night')||hay.includes('latenight')}
function isHigh(t){const e=norm(t.energy);return e==='high'||e==='peak'||tags(t).some(x=>x==='energy'||x==='highenergy'||x==='peak')}
function isPick(t){return !!t.own || !!String(t.curator_note||'').trim() || tags(t).some(x=>['srgu','srgupick','srgupicks','pick'].includes(x))}

function card(t){
  const meta=[t.artist,t.genre||t.mood].filter(Boolean).join(' · ');
  return `<button class="discovery-card" type="button" data-discovery-yt="${esc(t.yt)}" aria-label="Redă ${esc(t.title||'piesa')}"><span class="discovery-thumb"><img loading="lazy" src="${thumb(t.yt)}" alt=""><span class="discovery-play">▶</span></span><span class="discovery-card-title">${esc(t.title||'Fără titlu')}</span><span class="discovery-card-meta">${esc(meta||'SRGU Selections')}</span></button>`;
}

function rail(title,subtitle,items,key){
  if(items.length<2)return '';
  return `<section class="discovery-rail" data-rail="${key}"><div class="discovery-rail-head"><div><span class="eyebrow">${esc(subtitle)}</span><h2>${esc(title)}</h2></div><button class="rail-see-all" type="button" data-rail-filter="${key}">Vezi toate →</button></div><div class="discovery-track">${items.slice(0,10).map(card).join('')}</div></section>`;
}

function render(){
  const root=$('#discoveryCollections');if(!root)return;
  const newest=[...tracks].sort((a,b)=>(Date.parse(b.created_at||'')||0)-(Date.parse(a.created_at||'')||0)).slice(0,10);
  const picks=tracks.filter(isPick).sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0));
  const night=tracks.filter(isNight);
  const high=tracks.filter(isHigh);
  root.innerHTML=[
    rail('Nou adăugate','Fresh in',newest,'newest'),
    rail('SRGU Picks','Curated',picks,'picks'),
    rail('Night Drive','Mood',night,'night'),
    rail('High Energy','Energy',high,'high')
  ].join('');
  root.hidden=!root.innerHTML.trim();
}

async function load(){
  try{const r=await fetch('/api/public?resource=tracks',{cache:'no-store'});tracks=r.ok?await r.json():[]}catch{tracks=[]}
  render();
}

function findFeedCard(yt){
  return $$('#feed .card').find(c=>{const src=c.querySelector('.thumb img')?.src||'';return src.includes(`/vi/${yt}/`)})||null;
}
function play(yt){
  const c=findFeedCard(yt);
  if(c){c.click();document.querySelector('.player-sticky')?.scrollIntoView({behavior:'smooth',block:'start'});return}
  location.hash=`track=${encodeURIComponent(yt)}`;
}
function filterRail(key){
  if(key==='newest'){$('#sortSelect').value='newest';$('#sortSelect').dispatchEvent(new Event('change',{bubbles:true}));}
  else if(key==='night'){
    const nightMood=tracks.find(isNight)?.mood||'';
    if(nightMood){const b=[...document.querySelectorAll('[data-smart-kind="mood"]')].find(x=>norm(x.dataset.smartValue)===norm(nightMood));b?.click()}
  }else if(key==='high'){
    const input=$('#searchInput');if(input){input.value='High';input.dispatchEvent(new Event('input',{bubbles:true}))}
  }else if(key==='picks'){
    const mine=$('[data-filter="mine"]');mine?.click();
  }
  document.querySelector('.feed-section')?.scrollIntoView({behavior:'smooth',block:'start'});
}

function bind(){
  document.addEventListener('click',e=>{
    const c=e.target.closest('[data-discovery-yt]');if(c){play(c.dataset.discoveryYt);return}
    const f=e.target.closest('[data-rail-filter]');if(f){filterRail(f.dataset.railFilter);return}
  },true);
}
function init(){ensureUi();bind();load()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
