(() => {
'use strict';

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const STORE='srgu_local_playlists_v1';
const ACTIVE='srgu_active_playlist_v1';
const read=()=>{try{return JSON.parse(localStorage.getItem(STORE)||'{}')}catch{return {}}};
const write=v=>localStorage.setItem(STORE,JSON.stringify(v));
const toast=msg=>{const e=document.createElement('div');e.className='toast';e.textContent=msg;$('#toasts')?.append(e);setTimeout(()=>e.remove(),2200)};
const ytFromCard=card=>{const m=(card?.querySelector('.thumb img')?.src||'').match(/\/vi\/([^/]+)\//);return m?.[1]||''};
const currentYt=()=>{const href=$('#youtubeBtn')?.href||'';const m=href.match(/youtu\.be\/([^?&#]+)/);return m?.[1]||''};
let playlists=read();
let pendingYt='';
let active=localStorage.getItem(ACTIVE)||'';

function allTrackMeta(){
  return Object.fromEntries($$('#feed .card').map(card=>{
    const yt=ytFromCard(card);return [yt,{yt,title:card.querySelector('h3')?.textContent||'Fără titlu',artist:card.querySelector('p')?.textContent||'',thumb:card.querySelector('.thumb img')?.src||''}];
  }).filter(([yt])=>yt));
}

function ensureUi(){
  if(!document.querySelector('link[href="/stage3.css"]')){
    const l=document.createElement('link');l.rel='stylesheet';l.href='/stage3.css';document.head.append(l);
  }
  if(!$('#saveCurrentBtn')){
    const b=document.createElement('button');b.id='saveCurrentBtn';b.className='save-current';b.type='button';b.textContent='+ Salvează';
    $('#subBtn')?.insertAdjacentElement('afterend',b);
  }
  if(!$('#playlistLibraryBtn')){
    const b=document.createElement('button');b.id='playlistLibraryBtn';b.className='library-btn';b.type='button';b.textContent='▣ Playlisturile mele';
    $('.smart-toolbar')?.append(b);
  }
  if(!$('#playlistPickerModal')){
    document.body.insertAdjacentHTML('beforeend',`
      <div class="modal" id="playlistPickerModal" aria-hidden="true">
        <button class="backdrop" data-playlist-close="playlistPickerModal" aria-label="Închide"></button>
        <section class="dialog small">
          <div class="modal-head"><div><span class="eyebrow">Colecția ta</span><h3>Salvează în playlist</h3></div><button class="round" data-playlist-close="playlistPickerModal">×</button></div>
          <div class="admin-scroll">
            <div class="playlist-picker-track" id="playlistTrackPreview"></div>
            <form class="playlist-create" id="playlistCreateForm"><input id="playlistName" type="text" maxlength="50" placeholder="Ex. Night Drive" required><button class="btn solid" type="submit">+ Playlist nou</button></form>
            <div id="playlistChoices"></div>
            <p class="hint">Playlisturile se păstrează doar în acest browser. Nu ai nevoie de cont.</p>
          </div>
        </section>
      </div>`);
  }
  if(!$('#playlistLibraryModal')){
    document.body.insertAdjacentHTML('beforeend',`
      <div class="modal" id="playlistLibraryModal" aria-hidden="true">
        <button class="backdrop" data-playlist-close="playlistLibraryModal" aria-label="Închide"></button>
        <section class="dialog small">
          <div class="modal-head"><div><span class="eyebrow">Fără cont</span><h3>Playlisturile mele</h3></div><button class="round" data-playlist-close="playlistLibraryModal">×</button></div>
          <div class="admin-scroll">
            <div class="playlist-section-title"><h4>Biblioteca ta</h4><span id="playlistCount">0 playlisturi</span></div>
            <form class="playlist-create" id="playlistLibraryCreateForm"><input id="playlistLibraryName" type="text" maxlength="50" placeholder="Playlist nou" required><button class="btn solid" type="submit">Creează</button></form>
            <div class="playlist-list" id="playlistList"></div>
            <div class="playlist-backup"><button id="playlistExport" type="button">Copiază backup</button><button id="playlistReset" type="button">Șterge toate</button></div>
            <p class="hint">Playlisturile sunt private și rămân pe dispozitivul tău. Mai târziu putem adăuga și share prin link, fără login.</p>
          </div>
        </section>
      </div>`);
  }
}

function decorateCards(){
  $$('#feed .card').forEach(card=>{
    const thumb=card.querySelector('.thumb'),yt=ytFromCard(card);if(!thumb||!yt)return;
    let b=thumb.querySelector('.card-save');
    if(!b){b=document.createElement('button');b.type='button';b.className='card-save';b.title='Salvează în playlist';b.setAttribute('aria-label','Salvează în playlist');b.textContent='+';thumb.append(b)}
    const saved=Object.values(playlists).some(p=>p.items?.includes(yt));b.classList.toggle('saved',saved);b.textContent=saved?'✓':'+';
  });
  updateSaveCurrent();
  applyActivePlaylist();
}

function updateSaveCurrent(){
  const b=$('#saveCurrentBtn'),yt=currentYt();if(!b)return;
  const saved=yt&&Object.values(playlists).some(p=>p.items?.includes(yt));b.classList.toggle('saved',!!saved);b.textContent=saved?'✓ Salvat':'+ Salvează';
}

function openModal(id){const m=$('#'+id);if(!m)return;m.classList.add('open');m.setAttribute('aria-hidden','false')}
function closeModal(id){const m=$('#'+id);if(!m)return;m.classList.remove('open');m.setAttribute('aria-hidden','true')}

function renderPicker(){
  const box=$('#playlistChoices'),meta=allTrackMeta()[pendingYt];
  if($('#playlistTrackPreview')) $('#playlistTrackPreview').innerHTML=meta?`<img src="${meta.thumb}" alt=""><div><b>${escapeHtml(meta.title)}</b><span>${escapeHtml(meta.artist)}</span></div>`:'<div><b>Alege o piesă</b></div>';
  if(!box)return;
  const entries=Object.entries(playlists);
  box.innerHTML=entries.length?entries.map(([id,p])=>`<label class="playlist-choice"><input type="checkbox" data-playlist-id="${id}" ${p.items?.includes(pendingYt)?'checked':''}><div><b>${escapeHtml(p.name)}</b><span>${p.items?.length||0} piese</span></div></label>`).join(''):'<div class="playlist-empty">Nu ai încă playlisturi. Creează primul playlist mai sus.</div>';
}

function renderLibrary(){
  const box=$('#playlistList');if(!box)return;
  const entries=Object.entries(playlists);
  box.innerHTML=entries.length?entries.map(([id,p])=>`<div class="playlist-row ${active===id?'active':''}" data-id="${id}"><button class="playlist-row-main" data-open-playlist="${id}"><b>${escapeHtml(p.name)}</b><span>${p.items?.length||0} piese</span></button><button class="playlist-mini" data-rename-playlist="${id}" title="Redenumește">✎</button><button class="playlist-mini" data-delete-playlist="${id}" title="Șterge">×</button></div>`).join(''):'<div class="playlist-empty">Nu ai playlisturi încă. Salvează o melodie și creează primul playlist.</div>';
  const count=$('#playlistCount');if(count)count.textContent=`${entries.length} ${entries.length===1?'playlist':'playlisturi'}`;
}

function createPlaylist(name){
  name=String(name||'').trim();if(!name)return null;
  const id='p_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  playlists[id]={name,items:[]};write(playlists);renderPicker();renderLibrary();return id;
}

function toggleInPlaylist(id,yt,on){
  const p=playlists[id];if(!p||!yt)return;
  p.items=Array.isArray(p.items)?p.items:[];
  const has=p.items.includes(yt);
  if(on&&!has)p.items.push(yt);if(!on&&has)p.items=p.items.filter(x=>x!==yt);
  write(playlists);decorateCards();renderLibrary();
}

function applyActivePlaylist(){
  const feed=$('#feed');if(!feed)return;
  $$('.active-playlist-banner').forEach(x=>x.remove());
  if(!active||!playlists[active])return;
  const allowed=new Set(playlists[active].items||[]);
  $$('#feed .card').forEach(card=>{if(!allowed.has(ytFromCard(card)))card.hidden=true});
  const banner=document.createElement('div');banner.className='active-playlist-banner';banner.innerHTML=`Playlist: <b>${escapeHtml(playlists[active].name)}</b><span class="spacer"></span><button class="clear-playlist" type="button">Arată toate ×</button>`;
  feed.parentElement?.insertBefore(banner,feed);
}

function clearActive(){active='';localStorage.removeItem(ACTIVE);renderLibrary();location.reload()}
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

function bind(){
  document.addEventListener('click',e=>{
    const save=e.target.closest('.card-save');if(save){e.preventDefault();e.stopPropagation();pendingYt=ytFromCard(save.closest('.card'));renderPicker();openModal('playlistPickerModal');return}
    if(e.target.closest('#saveCurrentBtn')){pendingYt=currentYt();if(!pendingYt)return toast('Pornește mai întâi o melodie.');renderPicker();openModal('playlistPickerModal');return}
    if(e.target.closest('#playlistLibraryBtn')){renderLibrary();openModal('playlistLibraryModal');return}
    const c=e.target.closest('[data-playlist-close]');if(c){closeModal(c.dataset.playlistClose);return}
    if(e.target.closest('.clear-playlist')){clearActive();return}
    const open=e.target.closest('[data-open-playlist]');if(open){active=open.dataset.openPlaylist;localStorage.setItem(ACTIVE,active);closeModal('playlistLibraryModal');location.reload();return}
    const del=e.target.closest('[data-delete-playlist]');if(del){const id=del.dataset.deletePlaylist;if(confirm(`Ștergi playlistul „${playlists[id]?.name||''}”?`)){delete playlists[id];write(playlists);if(active===id){active='';localStorage.removeItem(ACTIVE)}renderLibrary();decorateCards()}return}
    const ren=e.target.closest('[data-rename-playlist]');if(ren){const id=ren.dataset.renamePlaylist;const n=prompt('Nume nou pentru playlist:',playlists[id]?.name||'');if(n?.trim()){playlists[id].name=n.trim();write(playlists);renderLibrary();applyActivePlaylist()}return}
  },true);

  $('#playlistChoices')?.addEventListener('change',e=>{const i=e.target.closest('[data-playlist-id]');if(i)toggleInPlaylist(i.dataset.playlistId,pendingYt,i.checked)});
  $('#playlistCreateForm')?.addEventListener('submit',e=>{e.preventDefault();const inp=$('#playlistName');const id=createPlaylist(inp.value);if(id&&pendingYt)toggleInPlaylist(id,pendingYt,true);inp.value='';toast('Playlist creat ✓')});
  $('#playlistLibraryCreateForm')?.addEventListener('submit',e=>{e.preventDefault();const inp=$('#playlistLibraryName');if(createPlaylist(inp.value)){inp.value='';toast('Playlist creat ✓')}});
  $('#playlistExport')?.addEventListener('click',async()=>{const text=JSON.stringify({v:1,playlists},null,2);try{await navigator.clipboard.writeText(text);toast('Backup playlisturi copiat ✓')}catch{}});
  $('#playlistReset')?.addEventListener('click',()=>{if(confirm('Ștergi toate playlisturile locale?')){playlists={};write(playlists);clearActive()}});
}

function observe(){
  const feed=$('#feed');if(feed)new MutationObserver(()=>requestAnimationFrame(decorateCards)).observe(feed,{childList:true,subtree:false});
  const title=$('#title');if(title)new MutationObserver(updateSaveCurrent).observe(title,{childList:true,characterData:true,subtree:true});
}

function init(){ensureUi();bind();renderLibrary();decorateCards();observe()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
