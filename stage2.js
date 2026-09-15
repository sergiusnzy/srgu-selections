(() => {
'use strict';

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const toast=msg=>{const e=document.createElement('div');e.className='toast';e.textContent=msg;$('#toasts')?.append(e);setTimeout(()=>e.remove(),2600)};
const ytFromImg=img=>{const m=(img?.src||'').match(/\/vi\/([^/]+)\//);return m?.[1]||''};
const tagList=v=>Array.isArray(v)?v:[];
const parseTags=s=>[...new Set(String(s||'').split(/[\s,]+/).map(x=>x.trim().replace(/^#+/,'').toLowerCase()).filter(Boolean))].slice(0,20);

let rows=[];
let byYt=new Map();
let activeSmart={kind:'',value:''};
let sort='curated';
let adminPass='';

async function fetchRows(){
  try{
    const r=await fetch('/api/public?resource=tracks',{cache:'no-store'});
    if(!r.ok) throw new Error('load');
    rows=await r.json();
    byYt=new Map(rows.map(r=>[r.yt,r]));
    return rows;
  }catch(e){rows=[];byYt=new Map();return []}
}

function rowForCard(card){return byYt.get(ytFromImg(card.querySelector('.thumb img')))||null}

function taxonomyHtml(r){
  if(!r) return '';
  const bits=[];
  if(r.genre) bits.push(`<button class="tax-chip" data-tax-kind="genre" data-tax-value="${esc(r.genre)}">${esc(r.genre)}</button>`);
  if(r.mood) bits.push(`<button class="tax-chip muted" data-tax-kind="mood" data-tax-value="${esc(r.mood)}">${esc(r.mood)}</button>`);
  for(const t of tagList(r.tags).slice(0,4)) bits.push(`<button class="tax-chip hash" data-tax-kind="tag" data-tax-value="${esc(t)}">#${esc(t)}</button>`);
  return bits.length?`<div class="track-taxonomy">${bits.join('')}</div>`:'';
}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

function decorateCards(){
  $$('#feed .card').forEach((card,index)=>{
    if(!card.dataset.curatedOrder) card.dataset.curatedOrder=String(index);
    const r=rowForCard(card);
    card.dataset.genre=r?.genre||'';card.dataset.mood=r?.mood||'';card.dataset.energy=r?.energy||'';card.dataset.origin=r?.origin||'';card.dataset.tags=tagList(r?.tags).join(' ');card.dataset.created=r?.created_at||'';
    card.querySelector('.track-taxonomy')?.remove();
    if(r){
      const p=card.querySelector('p');
      if(p) p.insertAdjacentHTML('afterend',taxonomyHtml(r));
      if(r.curator_note && !card.querySelector('.curator-note')){
        const note=document.createElement('div');note.className='curator-note';note.textContent=`“${r.curator_note}”`;card.append(note);
      } else if(!r.curator_note) card.querySelector('.curator-note')?.remove();
    }
  });
}

function buildSmartFilters(){
  const box=$('#smartFilters'); if(!box) return;
  const genres=[...new Set(rows.map(r=>r.genre).filter(Boolean))].slice(0,7);
  const moods=[...new Set(rows.map(r=>r.mood).filter(Boolean))].slice(0,4);
  const buttons=[`<button class="smart-chip" data-smart-kind="recent" data-smart-value="30">Nou adăugate</button>`];
  genres.forEach(v=>buttons.push(`<button class="smart-chip" data-smart-kind="genre" data-smart-value="${esc(v)}">${esc(v)}</button>`));
  moods.forEach(v=>buttons.push(`<button class="smart-chip subtle" data-smart-kind="mood" data-smart-value="${esc(v)}">${esc(v)}</button>`));
  if(activeSmart.kind) buttons.unshift('<button class="smart-chip clear-smart" data-smart-kind="clear">× Filtru</button>');
  box.innerHTML=buttons.join('');
}

function matchesSmart(card){
  if(!activeSmart.kind) return true;
  const r=rowForCard(card); if(!r) return false;
  if(activeSmart.kind==='genre') return norm(r.genre)===norm(activeSmart.value);
  if(activeSmart.kind==='mood') return norm(r.mood)===norm(activeSmart.value);
  if(activeSmart.kind==='tag') return tagList(r.tags).map(norm).includes(norm(activeSmart.value));
  if(activeSmart.kind==='recent'){
    const ts=Date.parse(r.created_at||''); return Number.isFinite(ts) && Date.now()-ts<=30*86400000;
  }
  return true;
}

function applyAllFilters(){
  const input=$('#searchInput'); const q=norm(input?.value);
  let shown=0;
  $$('#feed .card').forEach(card=>{
    const r=rowForCard(card);
    const title=card.querySelector('h3')?.textContent||'';
    const artist=card.querySelector('p')?.textContent||'';
    const hay=norm([title,artist,r?.genre,r?.mood,r?.energy,r?.origin,r?.release_year,r?.curator_note,...tagList(r?.tags)].join(' '));
    const textOk=!q || hay.includes(q.replace(/^#/,'').trim());
    const smartOk=matchesSmart(card);
    card.hidden=!(textOk&&smartOk);
    if(!card.hidden) shown++;
  });
  const status=$('#searchStatus');
  if(status){
    const desc=[]; if(q) desc.push(`„${input.value.trim()}”`); if(activeSmart.kind) desc.push(activeSmart.kind==='recent'?'ultimele 30 zile':activeSmart.value);
    status.textContent=desc.length?`${shown} ${shown===1?'selecție':'selecții'} · ${desc.join(' · ')}`:'';
  }
  sortCards();
}

function sortCards(){
  const feed=$('#feed');if(!feed)return;
  const cards=$$('#feed .card');
  cards.sort((a,b)=>{
    if(sort==='curated') return Number(a.dataset.curatedOrder)-Number(b.dataset.curatedOrder);
    const at=Date.parse(a.dataset.created||'')||0,bt=Date.parse(b.dataset.created||'')||0;
    return sort==='newest'?bt-at:at-bt;
  }).forEach(c=>feed.append(c));
}

function replaceSearchControls(){
  const old=$('#searchInput'); if(old){const n=old.cloneNode(true);old.replaceWith(n);n.addEventListener('input',applyAllFilters)}
  const oldClear=$('#clearSearch');if(oldClear){const n=oldClear.cloneNode(true);oldClear.replaceWith(n);n.addEventListener('click',()=>{const i=$('#searchInput');i.value='';n.hidden=true;applyAllFilters();i.focus()});$('#searchInput')?.addEventListener('input',()=>n.hidden=!$('#searchInput').value)}
  const oldSurprise=$('#surpriseBtn');if(oldSurprise){const n=oldSurprise.cloneNode(true);oldSurprise.replaceWith(n);n.addEventListener('click',()=>{const cards=$$('#feed .card').filter(c=>!c.hidden);if(!cards.length)return toast('Nu există selecții în filtrul acesta.');cards[Math.floor(Math.random()*cards.length)].click()})}
  $('#sortSelect')?.addEventListener('change',e=>{sort=e.target.value;sortCards()});
}

function bindSmart(){
  $('#smartFilters')?.addEventListener('click',e=>{
    const b=e.target.closest('[data-smart-kind]');if(!b)return;
    const k=b.dataset.smartKind;
    if(k==='clear') activeSmart={kind:'',value:''}; else activeSmart={kind:k,value:b.dataset.smartValue||''};
    buildSmartFilters();applyAllFilters();
  });
  $('#feed')?.addEventListener('click',e=>{
    const b=e.target.closest('[data-tax-kind]');if(!b)return;
    e.preventDefault();e.stopPropagation();activeSmart={kind:b.dataset.taxKind,value:b.dataset.taxValue||''};buildSmartFilters();applyAllFilters();
    document.querySelector('.discovery')?.scrollIntoView({behavior:'smooth',block:'start'});
  },true);
}

function adminCall(action,payload={}){
  if(!adminPass) adminPass=sessionStorage.getItem('srgu_stage2_admin')||'';
  return fetch('/api/admin',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password:adminPass,action,...payload})}).then(async r=>{const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Eroare Admin');return d});
}

function captureAdminPassword(){
  $('#gateForm')?.addEventListener('submit',()=>{adminPass=$('#gatePass')?.value||'';if(adminPass)sessionStorage.setItem('srgu_stage2_admin',adminPass)},true);
}

function metadataFromAddForm(){return {
  genre:$('#addGenre')?.value.trim()||'',mood:$('#addMood')?.value.trim()||'',energy:$('#addEnergy')?.value.trim()||'',origin:$('#addOrigin')?.value.trim()||'',release_year:$('#addYear')?.value||null,tags:parseTags($('#addTags')?.value),curator_note:$('#addNote')?.value.trim()||''
}}

function bindAddMetadata(){
  $('#addForm')?.addEventListener('submit',e=>{
    const yt=parseYT($('#addUrl')?.value);const meta=metadataFromAddForm();
    if(!yt || !Object.values(meta).some(v=>Array.isArray(v)?v.length:Boolean(v))) return;
    setTimeout(async()=>{
      try{
        const fresh=await fetch('/api/public?resource=tracks',{cache:'no-store'}).then(r=>r.json());
        const row=fresh.find(x=>x.yt===yt);if(!row)return;
        await adminCall('updateTrack',{id:row.id,patch:meta});
        await refresh();toast('Metadatele au fost salvate ✓');
      }catch(err){toast('Piesa s-a salvat, dar metadatele necesită upgrade-ul SQL.');}
    },1400);
  });
}
function parseYT(s){if(!s)return null;const m=String(s).match(/(?:youtu\.be\/|v=|shorts\/|embed\/|live\/)([A-Za-z0-9_-]{11})/);return m?.[1]||(/^[A-Za-z0-9_-]{11}$/.test(String(s).trim())?String(s).trim():null)}

function decorateAdmin(){
  $$('#adminRows .admin-item').forEach(item=>{
    if(item.querySelector('.meta-edit'))return;
    const yt=ytFromImg(item.querySelector('img')),r=byYt.get(yt);if(!r)return;
    const actions=item.querySelector('.admin-actions');if(!actions)return;
    const b=document.createElement('button');b.type='button';b.className='tiny meta-edit';b.title='Gen, mood și hashtaguri';b.textContent='✎';b.dataset.trackId=r.id;actions.prepend(b);
    if(r.genre||r.mood){const meta=item.querySelector('span');if(meta)meta.textContent+=`${r.genre?' · '+r.genre:''}${r.mood?' · '+r.mood:''}`}
  });
}

function openMeta(id){
  const r=rows.find(x=>x.id===id);if(!r)return;
  $('#metaId').value=r.id;$('#metaGenre').value=r.genre||'';$('#metaMood').value=r.mood||'';$('#metaEnergy').value=r.energy||'';$('#metaOrigin').value=r.origin||'';$('#metaYear').value=r.release_year||'';$('#metaTags').value=tagList(r.tags).map(t=>'#'+t).join(' ');$('#metaNote').value=r.curator_note||'';
  $('#metaModal').classList.add('open');$('#metaModal').setAttribute('aria-hidden','false');
}
function closeMeta(){$('#metaModal')?.classList.remove('open');$('#metaModal')?.setAttribute('aria-hidden','true')}
function bindMetaEditor(){
  $('#adminRows')?.addEventListener('click',e=>{const b=e.target.closest('.meta-edit');if(!b)return;e.preventDefault();e.stopPropagation();openMeta(b.dataset.trackId)},true);
  $$('[data-meta-close]').forEach(b=>b.addEventListener('click',closeMeta));
  $('#metaForm')?.addEventListener('submit',async e=>{e.preventDefault();const id=$('#metaId').value;const patch={genre:$('#metaGenre').value.trim(),mood:$('#metaMood').value.trim(),energy:$('#metaEnergy').value.trim(),origin:$('#metaOrigin').value.trim(),release_year:$('#metaYear').value||null,tags:parseTags($('#metaTags').value),curator_note:$('#metaNote').value.trim()};try{await adminCall('updateTrack',{id,patch});closeMeta();await refresh();toast('Metadate actualizate ✓')}catch(err){toast(err.message)}});
}

async function refresh(){await fetchRows();decorateCards();buildSmartFilters();decorateAdmin();applyAllFilters()}

async function init(){
  replaceSearchControls();bindSmart();captureAdminPassword();bindAddMetadata();bindMetaEditor();
  await refresh();
  const feed=$('#feed');if(feed)new MutationObserver(()=>requestAnimationFrame(()=>{decorateCards();decorateAdmin();applyAllFilters()})).observe(feed,{childList:true});
  const admins=$('#adminRows');if(admins)new MutationObserver(()=>requestAnimationFrame(decorateAdmin)).observe(admins,{childList:true});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
