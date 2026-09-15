(() => {
'use strict';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const KEYS = {
  tracks:'acord_tracks_v3', ad:'acord_ad_v3', prefs:'acord_prefs_v3',
  likes:'acord_likes_v3', sub:'acord_sub_v3', theme:'acord_theme_v3', pwd:'acord_pwd_v2'
};
const DEMO = [
  {id:'demo1',yt:'kJQP7kiw5Fk',title:'Despacito',artist:'Luis Fonsi',views:'8,9 mld.',own:false},
  {id:'demo2',yt:'JGwWNGJdvx8',title:'Shape of You',artist:'Ed Sheeran',views:'6,4 mld.',own:false},
  {id:'demo3',yt:'4NRXx6U8ABQ',title:'Blinding Lights',artist:'The Weeknd',views:'4,1 mld.',own:false},
  {id:'demo4',yt:'djV11Xbc914',title:'Take On Me',artist:'a-ha',views:'1,6 mld.',own:false}
];
const defaultAd = {active:true,title:'Spațiu sponsorizat',desc:'Poți pune aici un produs, link afiliat sau propriul proiect.',img:'',url:''};

const read = (k,d) => { try { const v=localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const write = (k,v) => { try { localStorage.setItem(k,JSON.stringify(v)); } catch {} };
const uid = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ytThumb = (id,q='hqdefault') => `https://i.ytimg.com/vi/${id}/${q}.jpg`;
const parseYT = s => {
  if (!s) return null;
  s = String(s).trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  const m = s.match(/(?:youtu\.be\/|v=|shorts\/|embed\/|live\/)([A-Za-z0-9_-]{11})/);
  return m?.[1] || null;
};
const toast = msg => {
  const e = document.createElement('div'); e.className='toast'; e.textContent=msg; $('#toasts').append(e);
  setTimeout(()=>e.remove(),2400);
};
const copyText = async text => {
  try { await navigator.clipboard.writeText(text); toast('Copiat ✓'); }
  catch { const t=document.createElement('textarea');t.value=text;document.body.append(t);t.select();document.execCommand('copy');t.remove();toast('Copiat ✓'); }
};
const b64e = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const b64d = s => { s=s.replace(/-/g,'+').replace(/_/g,'/'); while(s.length%4)s+='='; return decodeURIComponent(escape(atob(s))); };

const state = {
  tracks:read(KEYS.tracks,DEMO),
  ad:read(KEYS.ad,defaultAd),
  prefs:read(KEYS.prefs,{shuffle:false,repeat:0,filter:'all',current:-1}),
  likes:read(KEYS.likes,[]),
  sub:read(KEYS.sub,false),
  current:-1,
  playing:false
};
state.current = Number.isInteger(state.prefs.current) && state.prefs.current < state.tracks.length ? state.prefs.current : -1;

let player=null, pending=null, pendingPayload=null;

function save(){
  state.prefs.current=state.current;
  write(KEYS.tracks,state.tracks); write(KEYS.ad,state.ad); write(KEYS.prefs,state.prefs);
  write(KEYS.likes,state.likes); write(KEYS.sub,state.sub);
}
function queue(){
  return state.tracks.map((_,i)=>i).filter(i=>{
    const t=state.tracks[i];
    if(state.prefs.filter==='mine') return !!t.own;
    if(state.prefs.filter==='others') return !t.own;
    if(state.prefs.filter==='fav') return state.likes.includes(t.id);
    return true;
  });
}
function qPos(){ return queue().indexOf(state.current); }
function currentTrack(){ return state.current>=0 ? state.tracks[state.current] : null; }

function applyTheme(theme){
  document.documentElement.dataset.theme=theme;
  write(KEYS.theme,theme);
  document.querySelector('meta[name=theme-color]').content = theme==='dark' ? '#0b0b0b' : '#ffffff';
  $('#themeBtn').textContent=theme==='dark'?'☀':'◐';
}
applyTheme(read(KEYS.theme,matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'));

function render(){
  renderNow(); renderFeed(); renderAd(); renderControls(); renderUpnext(); renderAdmin();
}
function renderNow(){
  const t=currentTrack(), q=queue(), p=qPos();
  $('#title').textContent=t?.title || 'Alege o melodie';
  $('#meta').textContent=t ? `${t.artist||'Necunoscut'}${t.views?' · '+t.views+' vizionări':''}${p>=0?' · '+(p+1)+'/'+q.length:''}` : 'Selectează o piesă din feed.';
  $('#youtubeBtn').href=t?`https://youtu.be/${t.yt}`:'#';
  $('#likeBtn').textContent=t && state.likes.includes(t.id)?'♥':'♡';
  $('#subBtn').textContent=state.sub?'Abonat ✓':'Abonează-te';
  $('#subBtn').classList.toggle('on',state.sub);
  document.title=t?`${t.title} — ACORD`:'ACORD — playlistul meu';
}
function renderControls(){
  $('#playBtn').textContent=state.playing?'❚❚':'▶';
  $('#shuffleBtn').classList.toggle('on',state.prefs.shuffle);
  $('#repeatBtn').classList.toggle('on',state.prefs.repeat>0);
  $('#repeatOne').hidden=state.prefs.repeat!==2;
  document.body.classList.toggle('paused',!state.playing);
  $$('#chips .chip').forEach(b=>b.classList.toggle('active',b.dataset.filter===state.prefs.filter));
}
function renderFeed(){
  const list=queue(), box=$('#feed'); box.innerHTML='';
  $('#feedMeta').textContent=`Feed · ${list.length} piese`;
  $('#empty').hidden = state.tracks.length>0;
  if(state.tracks.length && !list.length){
    box.innerHTML='<div class="empty"><b>Nimic în filtrul acesta.</b><span>Încearcă alt filtru.</span></div>'; return;
  }
  list.forEach(i=>{
    const t=state.tracks[i], active=i===state.current;
    const el=document.createElement('article'); el.className='card'+(active?' active':''); el.dataset.index=i;
    el.innerHTML=`<div class="thumb"><img src="${ytThumb(t.yt)}" alt="" loading="lazy"><span class="badge">${active?(state.playing?'REDĂ':'PAUZĂ'):(t.own?'A MEA':'▶')}</span></div>
      <h3>${esc(t.title)}</h3><p>${esc(t.artist||'Necunoscut')}${t.views?' · '+esc(t.views):''}${t.own?'<span class="own">canalul meu</span>':''}</p>`;
    el.querySelector('img').addEventListener('error',e=>e.currentTarget.style.visibility='hidden',{once:true});
    box.append(el);
  });
}
function safeUrl(s){
  try { const u=new URL(s,location.origin); return /^https?:$/.test(u.protocol)?u.href:''; } catch { return ''; }
}
function renderAd(){
  const a=state.ad, box=$('#adSlot'); box.innerHTML='';
  if(!a?.active) return;
  const url=safeUrl(a.url), img=safeUrl(a.img);
  box.innerHTML=`<article class="ad-card">
    ${img?`<a class="ad-media" href="${esc(url||'#')}" target="_blank" rel="sponsored noopener"><img src="${esc(img)}" alt=""></a>`:''}
    <div class="ad-body"><div><span>Sponsorizat</span><b>${esc(a.title||'Reclamă')}</b><span>${esc(a.desc||'')}</span></div><span class="spacer"></span>${url?`<a class="ad-cta" href="${esc(url)}" target="_blank" rel="sponsored noopener">Vezi oferta ↗</a>`:''}</div>
  </article>`;
}
function renderUpnext(){
  const q=queue(), p=qPos(), bar=$('#upnext');
  if(!q.length){bar.hidden=true;return;}
  let next;
  if(p<0) next=q[0];
  else if(p<q.length-1) next=q[p+1];
  else if(state.prefs.repeat===1 || state.prefs.shuffle) next=q[0];
  else {bar.hidden=true;return;}
  bar.hidden=false;
  $('#upTitle').textContent=state.tracks[next]?.title||'—';
  $('#upMeta').textContent=`${Math.max(p+1,0)} / ${q.length} · deschide coada ↑`;
}
function renderQueue(){
  const q=queue(), box=$('#queue'); box.innerHTML='';
  q.forEach((i,n)=>{
    const t=state.tracks[i], row=document.createElement('div');
    row.className='queue-row'+(i===state.current?' active':''); row.dataset.index=i;
    row.innerHTML=`<span>${String(n+1).padStart(2,'0')}</span><img src="${ytThumb(t.yt,'mqdefault')}" alt=""><div><b>${esc(t.title)}</b><small>${esc(t.artist||'Necunoscut')}</small></div>`;
    box.append(row);
  });
}
function renderAdmin(){
  $('#adminCount').textContent=state.tracks.length;
  const box=$('#adminRows'); if(!box) return; box.innerHTML='';
  state.tracks.forEach((t,i)=>{
    const row=document.createElement('div'); row.className='admin-item'; row.dataset.index=i;
    row.innerHTML=`<img src="${ytThumb(t.yt,'mqdefault')}" alt=""><div><b>${esc(t.title)}</b><span>${esc(t.artist||'Necunoscut')}${t.own?' · A MEA':''}</span></div>
      <div class="admin-actions"><button class="tiny" data-act="own" title="A mea / alta">●</button><button class="tiny" data-act="up" title="Sus">↑</button><button class="tiny" data-act="down" title="Jos">↓</button><button class="tiny" data-act="del" title="Șterge">×</button></div>`;
    box.append(row);
  });
  $('#adActive').checked=!!state.ad.active; $('#adTitle').value=state.ad.title||''; $('#adDesc').value=state.ad.desc||''; $('#adImage').value=state.ad.img||''; $('#adUrl').value=state.ad.url||'';
}

function playIndex(i,scroll=false){
  if(i<0||i>=state.tracks.length) return;
  state.current=i; state.playing=true; save(); render();
  if(player?.loadVideoById) player.loadVideoById(state.tracks[i].yt); else pending=i;
  if(scroll) window.scrollTo({top:0,behavior:'smooth'});
  setMediaSession();
}
function togglePlay(){
  if(state.current<0){const q=queue(); if(q.length) playIndex(q[0],true); else toast('Lista este goală'); return;}
  if(!player) return;
  state.playing?player.pauseVideo():player.playVideo();
}
function next(auto=false){
  const q=queue(); if(!q.length) return;
  const p=qPos();
  if(state.prefs.shuffle && q.length>1){
    let n=p; while(n===p) n=Math.floor(Math.random()*q.length);
    playIndex(q[n]); return;
  }
  let np=p+1;
  if(np>=q.length){
    if(auto && state.prefs.repeat!==1){state.playing=false;renderControls();renderUpnext();return;}
    np=0;
  }
  playIndex(q[np]);
}
function prev(){
  const q=queue(); if(!q.length) return;
  if(player?.getCurrentTime?.()>3){player.seekTo(0,true);return;}
  let p=qPos()-1;if(p<0)p=q.length-1;playIndex(q[p]);
}
function setMediaSession(){
  if(!('mediaSession' in navigator)) return;
  const t=currentTrack(); if(!t) return;
  try{navigator.mediaSession.metadata=new MediaMetadata({title:t.title,artist:t.artist||'Necunoscut',album:'ACORD',artwork:[{src:ytThumb(t.yt),sizes:'480x360',type:'image/jpeg'}]});}catch{}
}

function injectYT(){
  window.onYouTubeIframeAPIReady=()=>{
    const first=currentTrack()?.yt||'M7lc1UVf-VE';
    player=new YT.Player('ytplayer',{videoId:first,playerVars:{controls:1,rel:0,playsinline:1},events:{
      onReady(){ if(pending!=null){const i=pending;pending=null;playIndex(i);} },
      onStateChange(e){
        if(e.data===YT.PlayerState.PLAYING) state.playing=true;
        if(e.data===YT.PlayerState.PAUSED) state.playing=false;
        if(e.data===YT.PlayerState.ENDED){ if(state.prefs.repeat===2){player.seekTo(0,true);player.playVideo();} else next(true); }
        renderControls(); renderFeed();
      },
      onError(){state.playing=false;renderControls();toast('Videoul nu poate fi redat aici.');}
    }});
  };
  const s=document.createElement('script');s.src='https://www.youtube.com/iframe_api';document.head.append(s);
}

function openModal(id){const m=$('#'+id);m.classList.add('open');m.setAttribute('aria-hidden','false');}
function closeModal(id){const m=$('#'+id);m.classList.remove('open');m.setAttribute('aria-hidden','true');}
function password(){try{return localStorage.getItem(KEYS.pwd)||'admin2026'}catch{return'admin2026'}}
function openAdmin(){renderAdmin();openModal('adminModal');}
function gate(){
  if(sessionStorage.getItem('acord_admin')==='1') openAdmin(); else {openModal('gateModal');setTimeout(()=>$('#gatePass').focus(),60);}
}
function normalizeTracks(arr){
  return (Array.isArray(arr)?arr:[]).map(t=>{
    const yt=parseYT(t?.yt); if(!yt) return null;
    return {id:uid(),yt,title:String(t.title||'Fără titlu').slice(0,120),artist:String(t.artist||'').slice(0,120),views:String(t.views||'').slice(0,40),own:!!t.own};
  }).filter(Boolean).slice(0,100);
}
function shareUrl(){
  const payload={v:2,title:'ACORD',tracks:state.tracks.map(({yt,title,artist,views,own})=>({yt,title,artist,views,own})),ad:{
    active:!!state.ad.active,title:state.ad.title||'',desc:state.ad.desc||'',img:safeUrl(state.ad.img),url:safeUrl(state.ad.url)
  }};
  return `${location.origin}${location.pathname}#p=${b64e(JSON.stringify(payload))}`;
}
function applyPayload(p){
  const tracks=normalizeTracks(p?.tracks); if(!tracks.length) return false;
  state.tracks=tracks; state.current=0;
  if(p.ad&&typeof p.ad==='object') state.ad={active:!!p.ad.active,title:String(p.ad.title||'').slice(0,120),desc:String(p.ad.desc||'').slice(0,200),img:safeUrl(p.ad.img||''),url:safeUrl(p.ad.url||'')};
  save(); render(); return true;
}

$('#brandBtn').onclick=()=>window.scrollTo({top:0,behavior:'smooth'});
$('#themeBtn').onclick=()=>applyTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');
$('#playBtn').onclick=togglePlay; $('#nextBtn').onclick=()=>next(false); $('#prevBtn').onclick=prev;
$('#shuffleBtn').onclick=()=>{state.prefs.shuffle=!state.prefs.shuffle;save();renderControls();renderUpnext();toast(state.prefs.shuffle?'Shuffle activ':'Shuffle oprit')};
$('#repeatBtn').onclick=()=>{state.prefs.repeat=(state.prefs.repeat+1)%3;save();renderControls();renderUpnext();toast(['Repeat oprit','Repeat listă','Repeat piesă'][state.prefs.repeat])};
$('#playAllBtn').onclick=()=>{const q=queue();q.length?playIndex(q[0],true):toast('Nimic de redat')};
$('#subBtn').onclick=()=>{state.sub=!state.sub;save();renderNow();toast(state.sub?'Abonat ✓':'Dezabonat')};
$('#likeBtn').onclick=()=>{const t=currentTrack();if(!t)return toast('Alege o melodie');const i=state.likes.indexOf(t.id);i>=0?state.likes.splice(i,1):state.likes.push(t.id);save();render();};
$('#shareTrackBtn').onclick=()=>{const t=currentTrack();t?copyText(`https://youtu.be/${t.yt}`):toast('Alege o melodie')};
$('#shareBtn').onclick=async()=>{const url=shareUrl(); if(navigator.share){try{await navigator.share({title:'ACORD',text:'Playlistul meu ACORD',url});}catch{}} else copyText(url)};
$('#adminBtn').onclick=gate; $('#emptyAdmin').onclick=gate;
$('#feed').onclick=e=>{const card=e.target.closest('.card');if(!card)return;const i=+card.dataset.index;i===state.current?togglePlay():playIndex(i,true)};
$('#chips').onclick=e=>{const b=e.target.closest('[data-filter]');if(!b)return;state.prefs.filter=b.dataset.filter;save();render()};
$('#upnext').onclick=()=>{renderQueue();openModal('queueModal')};
$('#queue').onclick=e=>{const row=e.target.closest('.queue-row');if(!row)return;closeModal('queueModal');playIndex(+row.dataset.index,true)};
$$('[data-close]').forEach(b=>b.onclick=()=>closeModal(b.dataset.close));
document.addEventListener('keydown',e=>{if(e.key==='Escape')$$('.modal.open').forEach(m=>closeModal(m.id))});

$('#gateForm').onsubmit=e=>{
  e.preventDefault();
  if($('#gatePass').value===password()){sessionStorage.setItem('acord_admin','1');$('#gatePass').value='';$('#gateError').textContent='';closeModal('gateModal');openAdmin();}
  else $('#gateError').textContent='Parolă greșită.';
};
$('#tabs').onclick=e=>{
  const b=e.target.closest('[data-tab]');if(!b)return;
  $$('#tabs .tab').forEach(x=>x.classList.toggle('active',x===b));
  ['tracks','ad','settings'].forEach(id=>$('#tab-'+id).hidden=id!==b.dataset.tab);
};
$('#addUrl').onchange=async()=>{
  const id=parseYT($('#addUrl').value);if(!id)return;
  try{const r=await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent('https://www.youtube.com/watch?v='+id)}&format=json`);if(!r.ok)return;const j=await r.json();if(!$('#addTitle').value)$('#addTitle').value=j.title||'';if(!$('#addArtist').value)$('#addArtist').value=j.author_name||'';}catch{}
};
$('#addForm').onsubmit=e=>{
  e.preventDefault();const yt=parseYT($('#addUrl').value);if(!yt)return toast('Link YouTube invalid');
  state.tracks.push({id:uid(),yt,title:$('#addTitle').value.trim()||'Fără titlu',artist:$('#addArtist').value.trim()||'Necunoscut',views:$('#addViews').value.trim(),own:$('#addOwn').checked});
  save();e.currentTarget.reset();render();toast('Melodie adăugată ✓');
};
$('#adminRows').onclick=e=>{
  const b=e.target.closest('[data-act]');if(!b)return;
  const row=b.closest('.admin-item'),i=+row.dataset.index,t=state.tracks[i];
  if(b.dataset.act==='own') t.own=!t.own;
  if(b.dataset.act==='up'&&i>0) state.tracks.splice(i-1,0,state.tracks.splice(i,1)[0]);
  if(b.dataset.act==='down'&&i<state.tracks.length-1) state.tracks.splice(i+1,0,state.tracks.splice(i,1)[0]);
  if(b.dataset.act==='del'){if(!confirm(`Ștergi „${t.title}”?`))return;state.tracks.splice(i,1);if(state.current===i)state.current=-1;else if(state.current>i)state.current--;}
  save();render();
};
$('#saveAd').onclick=()=>{
  state.ad={active:$('#adActive').checked,title:$('#adTitle').value.trim(),desc:$('#adDesc').value.trim(),img:safeUrl($('#adImage').value.trim()),url:safeUrl($('#adUrl').value.trim())};
  save();renderAd();toast('Reclamă salvată ✓');
};
$('#passwordForm').onsubmit=e=>{
  e.preventDefault();
  if($('#pwdCurrent').value!==password()) return $('#pwdError').textContent='Parola curentă este greșită.';
  if($('#pwdNew').value.length<6) return $('#pwdError').textContent='Folosește minimum 6 caractere.';
  localStorage.setItem(KEYS.pwd,$('#pwdNew').value);$('#pwdCurrent').value='';$('#pwdNew').value='';$('#pwdError').textContent='';toast('Parolă schimbată ✓');
};
$('#copyPlaylist').onclick=()=>copyText(shareUrl());
$('#exportJson').onclick=()=>{
  const blob=new Blob([JSON.stringify({v:2,tracks:state.tracks,ad:state.ad},null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='acord-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
};
$('#importJson').onchange=e=>{
  const f=e.target.files?.[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{try{applyPayload(JSON.parse(r.result))?toast('Import reușit ✓'):toast('Fișier invalid')}catch{toast('JSON invalid')}};r.readAsText(f);e.target.value='';
};
$('#importYes').onclick=()=>{if(pendingPayload&&applyPayload(pendingPayload))toast('Playlist importat ✓');$('#importBar').hidden=true;history.replaceState(null,'',location.pathname+location.search)};
$('#importNo').onclick=()=>{$('#importBar').hidden=true};

if('mediaSession' in navigator){
  try{navigator.mediaSession.setActionHandler('play',()=>player?.playVideo());navigator.mediaSession.setActionHandler('pause',()=>player?.pauseVideo());navigator.mediaSession.setActionHandler('previoustrack',prev);navigator.mediaSession.setActionHandler('nexttrack',()=>next(false));}catch{}
}

try{
  const m=location.hash.match(/#p=([A-Za-z0-9_-]+)/);
  if(m){const p=JSON.parse(b64d(m[1]));const nt=normalizeTracks(p.tracks);if(nt.length){pendingPayload=p;$('#importInfo').textContent=`${nt.length} piese · conținutul primit nu execută cod.`;$('#importBar').hidden=false;}}
}catch{}

render(); injectYT();
})();
