(() => {
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const ytFromImg=img=>{const m=(img?.src||'').match(/\/vi\/([^/]+)\//);return m?.[1]||''};
const parseYT=s=>{const v=String(s||'').trim();if(/^[A-Za-z0-9_-]{11}$/.test(v))return v;const m=v.match(/(?:youtu\.be\/|v=|shorts\/|embed\/|live\/)([A-Za-z0-9_-]{11})/);return m?.[1]||''};
let tracks=[];
let byYt=new Map();

function ensureUi(){
  if(!document.querySelector('link[href="/stage5.css"]')){const l=document.createElement('link');l.rel='stylesheet';l.href='/stage5.css';document.head.append(l)}
  const tab=$('#tab-tracks');if(!tab)return;
  if(!$('#adminDashboard')){
    tab.insertAdjacentHTML('afterbegin',`<section class="admin-dashboard" id="adminDashboard"><div class="admin-stats"><div class="admin-stat"><b id="statTotal">0</b><span>Total piese</span></div><div class="admin-stat"><b id="statMine">0</b><span>SRGU</span></div><div class="admin-stat"><b id="statMeta">0</b><span>Organizate</span></div><div class="admin-stat"><b id="statGenres">0</b><span>Genuri</span></div></div><div class="admin-tools"><input id="adminSearch" class="admin-search" type="search" placeholder="Caută în bibliotecă…"><select id="adminGenreFilter" class="admin-filter"><option value="">Toate genurile</option></select><select id="adminSort" class="admin-filter"><option value="curated">Ordine SRGU</option><option value="newest">Cele mai noi</option><option value="oldest">Cele mai vechi</option><option value="az">A–Z</option></select></div><div class="admin-results" id="adminResults"></div></section>`);
  }
  if(!$('#duplicateNote')){
    const n=document.createElement('div');n.id='duplicateNote';n.className='duplicate-note';$('#addUrl')?.insertAdjacentElement('afterend',n);
  }
  if(!document.querySelector('.admin-bulk-note')){
    const h=$('.admin-list-head');if(h)h.insertAdjacentHTML('afterend','<div class="admin-bulk-note">✎ editează gen/mood/tag-uri · ↑↓ schimbă ordinea · × șterge</div>');
  }
}

async function loadTracks(){
  try{const r=await fetch('/api/public?resource=tracks',{cache:'no-store'});tracks=r.ok?await r.json():[]}catch{tracks=[]}
  byYt=new Map(tracks.map(t=>[t.yt,t]));
}

function updateStats(){
  $('#statTotal').textContent=tracks.length;
  $('#statMine').textContent=tracks.filter(t=>t.own).length;
  $('#statMeta').textContent=tracks.filter(t=>t.genre||t.mood||(Array.isArray(t.tags)&&t.tags.length)).length;
  $('#statGenres').textContent=new Set(tracks.map(t=>String(t.genre||'').trim()).filter(Boolean)).size;
  const select=$('#adminGenreFilter');if(select){
    const current=select.value;const genres=[...new Set(tracks.map(t=>String(t.genre||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ro'));
    select.innerHTML='<option value="">Toate genurile</option>'+genres.map(g=>`<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join('');
    if(genres.includes(current))select.value=current;
  }
}
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

function decorateRows(){
  $$('#adminRows .admin-item').forEach((row,index)=>{
    const yt=ytFromImg(row.querySelector('img'));const t=byYt.get(yt);if(!t)return;
    row.dataset.yt=yt;row.dataset.genre=t.genre||'';row.dataset.created=t.created_at||'';row.dataset.curated=String(t.sort_order??index);
    const meta=row.querySelector('span');if(meta&&!meta.querySelector('.admin-meta-dot')){
      const d=document.createElement('i');d.className='admin-meta-dot'+((t.genre||t.mood||(Array.isArray(t.tags)&&t.tags.length))?' complete':'');d.title=d.classList.contains('complete')?'Are metadate':'Fără metadate';meta.append(d)
    }
  });
}

function applyAdminFilters(){
  const q=norm($('#adminSearch')?.value);const genre=$('#adminGenreFilter')?.value||'';let shown=0;
  const rows=$$('#adminRows .admin-item');
  rows.forEach(row=>{
    const t=byYt.get(row.dataset.yt)||{};const text=norm([t.title,t.artist,t.genre,t.mood,t.energy,t.origin,t.release_year,...(Array.isArray(t.tags)?t.tags:[])].join(' '));
    const ok=(!q||text.includes(q))&&(!genre||String(t.genre||'')===genre);row.classList.toggle('admin-hidden',!ok);if(ok)shown++;
  });
  const out=$('#adminResults');if(out)out.textContent=`${shown} din ${rows.length} piese`;
  applyAdminSort();
}

function applyAdminSort(){
  const mode=$('#adminSort')?.value||'curated';const box=$('#adminRows');if(!box)return;
  const rows=$$('#adminRows .admin-item');
  rows.sort((a,b)=>{
    const A=byYt.get(a.dataset.yt)||{},B=byYt.get(b.dataset.yt)||{};
    if(mode==='newest')return (Date.parse(B.created_at||'')||0)-(Date.parse(A.created_at||'')||0);
    if(mode==='oldest')return (Date.parse(A.created_at||'')||0)-(Date.parse(B.created_at||'')||0);
    if(mode==='az')return String(A.title||'').localeCompare(String(B.title||''),'ro',{sensitivity:'base'});
    return Number(A.sort_order??999999)-Number(B.sort_order??999999);
  }).forEach((row,i)=>row.style.order=String(i));
  box.style.display='grid';
}

function checkDuplicate(){
  const input=$('#addUrl'),note=$('#duplicateNote');if(!input||!note)return;
  const yt=parseYT(input.value);const found=yt&&byYt.get(yt);const submit=$('#addForm button[type=submit]');
  if(found){note.classList.add('show');note.innerHTML=`Piesa există deja: <b>${escapeHtml(found.title||'Fără titlu')}</b> · ${escapeHtml(found.artist||'')}`;if(submit)submit.disabled=true}
  else{note.classList.remove('show');note.textContent='';if(submit)submit.disabled=false}
}

function bind(){
  $('#adminSearch')?.addEventListener('input',applyAdminFilters);
  $('#adminGenreFilter')?.addEventListener('change',applyAdminFilters);
  $('#adminSort')?.addEventListener('change',applyAdminSort);
  $('#addUrl')?.addEventListener('input',checkDuplicate);
  $('#addUrl')?.addEventListener('change',checkDuplicate);
}

async function refresh(){await loadTracks();updateStats();decorateRows();applyAdminFilters();checkDuplicate()}
function observe(){
  const rows=$('#adminRows');if(rows)new MutationObserver(()=>requestAnimationFrame(()=>{decorateRows();applyAdminFilters()})).observe(rows,{childList:true});
  const modal=$('#adminModal');if(modal)new MutationObserver(()=>{if(modal.classList.contains('open'))refresh()}).observe(modal,{attributes:true,attributeFilter:['class']});
}
async function init(){ensureUi();bind();await refresh();observe()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();