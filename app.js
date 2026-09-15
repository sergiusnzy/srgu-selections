(() => {
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const SUPABASE_URL='https://rgfskjparcoowotqfvju.supabase.co';
const SUPABASE_KEY='sb_publishable_3fKJymIEGDduz06pyHGOKw_fsmbVmwU';
const KEYS={prefs:'srgu_prefs_v1',likes:'srgu_likes_v1',sub:'srgu_sub_v1',theme:'srgu_theme_v1'};
const read=(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch{return d}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ytThumb=(id,q='hqdefault')=>`https://i.ytimg.com/vi/${id}/${q}.jpg`;
const parseYT=s=>{if(!s)return null;s=String(s).trim();if(/^[A-Za-z0-9_-]{11}$/.test(s))return s;const m=s.match(/(?:youtu\.be\/|v=|shorts\/|embed\/|live\/)([A-Za-z0-9_-]{11})/);return m?.[1]||null};
const toast=msg=>{const e=document.createElement('div');e.className='toast';e.textContent=msg;$('#toasts').append(e);setTimeout(()=>e.remove(),2400)};
const copyText=async text=>{try{await navigator.clipboard.writeText(text);toast('Copiat ✓')}catch{}};
const safeUrl=s=>{try{const u=new URL(s,location.origin);return /^https?:$/.test(u.protocol)?u.href:''}catch{return''}};

const state={tracks:[],ad:{active:false,title:'',desc:'',img:'',url:''},prefs:read(KEYS.prefs,{shuffle:false,repeat:0,filter:'all',current:-1}),likes:read(KEYS.likes,[]),sub:read(KEYS.sub,false),current:-1,playing:false,loading:true};
let player=null,pending=null,adminPassword='';

function sbHeaders(){return {'apikey':SUPABASE_KEY,'Authorization':`Bearer ${SUPABASE_KEY}`}}
async function loadRemote(){
  state.loading=true; renderFeed();
  try{
    const [tr,cf]=await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/tracks?select=*&order=sort_order.asc,created_at.asc`,{headers:sbHeaders()}),
      fetch(`${SUPABASE_URL}/rest/v1/site_config?id=eq.main&select=*`,{headers:sbHeaders()})
    ]);
    if(!tr.ok) throw new Error('tracks');
    const tracks=await tr.json();
    const config=cf.ok?(await cf.json())[0]:null;
    state.tracks=tracks.map(t=>({id:t.id,yt:t.yt,title:t.title,artist:t.artist||'',views:t.views||'',own:!!t.own,sort_order:t.sort_order||0}));
    state.ad=config?{active:!!config.ad_active,title:config.ad_title||'',desc:config.ad_desc||'',img:config.ad_img||'',url:config.ad_url||''}:{active:false,title:'',desc:'',img:'',url:''};
    state.current=state.prefs.current>=0&&state.prefs.current<state.tracks.length?state.prefs.current:-1;
  }catch(e){state.tracks=[];toast('Supabase nu este configurat încă. Rulează setup.sql.');}
  finally{state.loading=false;render();}
}
function savePrefs(){state.prefs.current=state.current;write(KEYS.prefs,state.prefs);write(KEYS.likes,state.likes);write(KEYS.sub,state.sub)}
function queue(){return state.tracks.map((_,i)=>i).filter(i=>{const t=state.tracks[i];if(state.prefs.filter==='mine')return!!t.own;if(state.prefs.filter==='others')return!t.own;if(state.prefs.filter==='fav')return state.likes.includes(t.id);return true})}
function qPos(){return queue().indexOf(state.current)}
function currentTrack(){return state.current>=0?state.tracks[state.current]:null}
function applyTheme(theme){document.documentElement.dataset.theme=theme;write(KEYS.theme,theme);document.querySelector('meta[name=theme-color]').content=theme==='dark'?'#0b0b0b':'#fff';$('#themeBtn').textContent=theme==='dark'?'☀':'◐'}
applyTheme(read(KEYS.theme,matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'));

function render(){renderNow();renderFeed();renderAd();renderControls();renderUpnext();renderAdmin()}
function renderNow(){const t=currentTrack(),q=queue(),p=qPos();$('#title').textContent=t?.title||'Alege o melodie';$('#meta').textContent=t?`${t.artist||'Necunoscut'}${t.views?' · '+t.views+' vizionări':''}${p>=0?' · '+(p+1)+'/'+q.length:''}`:'Selectează o piesă din feed.';$('#youtubeBtn').href=t?`https://youtu.be/${t.yt}`:'#';$('#likeBtn').textContent=t&&state.likes.includes(t.id)?'♥':'♡';$('#subBtn').textContent=state.sub?'Abonat ✓':'Abonează-te';$('#subBtn').classList.toggle('on',state.sub);document.title=t?`${t.title} — SRGU Selections`:'SRGU Selections'}
function renderControls(){$('#playBtn').textContent=state.playing?'❚❚':'▶';$('#shuffleBtn').classList.toggle('on',state.prefs.shuffle);$('#repeatBtn').classList.toggle('on',state.prefs.repeat>0);$('#repeatOne').hidden=state.prefs.repeat!==2;$$('#chips .chip').forEach(b=>b.classList.toggle('active',b.dataset.filter===state.prefs.filter))}
function renderFeed(){const box=$('#feed');if(!box)return;if(state.loading){box.innerHTML='<div class="empty"><b>Se încarcă selecțiile…</b></div>';return}const list=queue();box.innerHTML='';$('#feedMeta').textContent=`Feed · ${list.length} piese`;$('#empty').hidden=state.tracks.length>0;if(state.tracks.length&&!list.length){box.innerHTML='<div class="empty"><b>Nimic în filtrul acesta.</b><span>Încearcă alt filtru.</span></div>';return}list.forEach(i=>{const t=state.tracks[i],active=i===state.current,el=document.createElement('article');el.className='card'+(active?' active':'');el.dataset.index=i;el.innerHTML=`<div class="thumb"><img src="${ytThumb(t.yt)}" alt="" loading="lazy"><span class="badge">${active?(state.playing?'REDĂ':'PAUZĂ'):(t.own?'A MEA':'▶')}</span></div><h3>${esc(t.title)}</h3><p>${esc(t.artist||'Necunoscut')}${t.views?' · '+esc(t.views):''}${t.own?'<span class="own">SRGU</span>':''}</p>`;box.append(el)})}
function renderAd(){const a=state.ad,box=$('#adSlot');box.innerHTML='';if(!a?.active)return;const url=safeUrl(a.url),img=safeUrl(a.img);box.innerHTML=`<article class="ad-card">${img?`<a class="ad-media" href="${esc(url||'#')}" target="_blank" rel="sponsored noopener"><img src="${esc(img)}" alt=""></a>`:''}<div class="ad-body"><div><span>Sponsorizat</span><b>${esc(a.title||'Reclamă')}</b><span>${esc(a.desc||'')}</span></div><span class="spacer"></span>${url?`<a class="ad-cta" href="${esc(url)}" target="_blank" rel="sponsored noopener">Vezi oferta ↗</a>`:''}</div></article>`}
function renderUpnext(){const q=queue(),p=qPos(),bar=$('#upnext');if(!q.length){bar.hidden=true;return}let next;if(p<0)next=q[0];else if(p<q.length-1)next=q[p+1];else if(state.prefs.repeat===1||state.prefs.shuffle)next=q[0];else{bar.hidden=true;return}bar.hidden=false;$('#upTitle').textContent=state.tracks[next]?.title||'—';$('#upMeta').textContent=`${Math.max(p+1,0)} / ${q.length} · deschide coada ↑`}
function renderQueue(){const q=queue(),box=$('#queue');box.innerHTML='';q.forEach((i,n)=>{const t=state.tracks[i],row=document.createElement('div');row.className='queue-row'+(i===state.current?' active':'');row.dataset.index=i;row.innerHTML=`<span>${String(n+1).padStart(2,'0')}</span><img src="${ytThumb(t.yt,'mqdefault')}" alt=""><div><b>${esc(t.title)}</b><small>${esc(t.artist||'Necunoscut')}</small></div>`;box.append(row)})}
function renderAdmin(){if(!$('#adminRows'))return;$('#adminCount').textContent=state.tracks.length;const box=$('#adminRows');box.innerHTML='';state.tracks.forEach((t,i)=>{const row=document.createElement('div');row.className='admin-item';row.dataset.index=i;row.innerHTML=`<img src="${ytThumb(t.yt,'mqdefault')}" alt=""><div><b>${esc(t.title)}</b><span>${esc(t.artist||'Necunoscut')}${t.own?' · A MEA':''}</span></div><div class="admin-actions"><button class="tiny" data-act="own" title="A mea / alta">●</button><button class="tiny" data-act="up" title="Sus">↑</button><button class="tiny" data-act="down" title="Jos">↓</button><button class="tiny" data-act="del" title="Șterge">×</button></div>`;box.append(row)});$('#adActive').checked=!!state.ad.active;$('#adTitle').value=state.ad.title||'';$('#adDesc').value=state.ad.desc||'';$('#adImage').value=state.ad.img||'';$('#adUrl').value=state.ad.url||''}

function playIndex(i,scroll=false){if(i<0||i>=state.tracks.length)return;state.current=i;state.playing=true;savePrefs();render();if(player?.loadVideoById)player.loadVideoById(state.tracks[i].yt);else pending=i;if(scroll)window.scrollTo({top:0,behavior:'smooth'})}
function togglePlay(){if(state.current<0){const q=queue();if(q.length)playIndex(q[0],true);return}if(!player)return;state.playing?player.pauseVideo():player.playVideo()}
function next(auto=false){const q=queue();if(!q.length)return;const p=qPos();if(state.prefs.shuffle&&q.length>1){let n=p;while(n===p)n=Math.floor(Math.random()*q.length);playIndex(q[n]);return}let np=p+1;if(np>=q.length){if(auto&&state.prefs.repeat!==1){state.playing=false;renderControls();return}np=0}playIndex(q[np])}
function prev(){const q=queue();if(!q.length)return;if(player?.getCurrentTime?.()>3){player.seekTo(0,true);return}let p=qPos()-1;if(p<0)p=q.length-1;playIndex(q[p])}
function injectYT(){window.onYouTubeIframeAPIReady=()=>{const first=currentTrack()?.yt||'M7lc1UVf-VE';player=new YT.Player('ytplayer',{videoId:first,playerVars:{controls:1,rel:0,playsinline:1},events:{onReady(){if(pending!=null){const i=pending;pending=null;playIndex(i)}},onStateChange(e){if(e.data===YT.PlayerState.PLAYING)state.playing=true;if(e.data===YT.PlayerState.PAUSED)state.playing=false;if(e.data===YT.PlayerState.ENDED){if(state.prefs.repeat===2){player.seekTo(0,true);player.playVideo()}else next(true)}renderControls();renderFeed()},onError(){state.playing=false;renderControls();toast('Videoul nu poate fi redat aici.')}}})};const s=document.createElement('script');s.src='https://www.youtube.com/iframe_api';document.head.append(s)}

async function adminCall(action,payload={}){const r=await fetch('/api/admin',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password:adminPassword,action,...payload})});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||'Eroare Admin');return data}
function openModal(id){const m=$('#'+id);m.classList.add('open');m.setAttribute('aria-hidden','false')}
function closeModal(id){const m=$('#'+id);m.classList.remove('open');m.setAttribute('aria-hidden','true')}
function gate(){if(adminPassword)openModal('adminModal');else{openModal('gateModal');setTimeout(()=>$('#gatePass').focus(),50)}}

$('#brandBtn').onclick=()=>scrollTo({top:0,behavior:'smooth'});$('#themeBtn').onclick=()=>applyTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');$('#playBtn').onclick=togglePlay;$('#nextBtn').onclick=()=>next(false);$('#prevBtn').onclick=prev;
$('#shuffleBtn').onclick=()=>{state.prefs.shuffle=!state.prefs.shuffle;savePrefs();renderControls();renderUpnext()};$('#repeatBtn').onclick=()=>{state.prefs.repeat=(state.prefs.repeat+1)%3;savePrefs();renderControls();renderUpnext()};$('#playAllBtn').onclick=()=>{const q=queue();if(q.length)playIndex(q[0],true)};
$('#subBtn').onclick=()=>{state.sub=!state.sub;savePrefs();renderNow()};$('#likeBtn').onclick=()=>{const t=currentTrack();if(!t)return;const i=state.likes.indexOf(t.id);i>=0?state.likes.splice(i,1):state.likes.push(t.id);savePrefs();render()};$('#shareTrackBtn').onclick=()=>{const t=currentTrack();if(t)copyText(`https://youtu.be/${t.yt}`)};$('#shareBtn').onclick=async()=>{const url=location.href.split('#')[0];if(navigator.share){try{await navigator.share({title:'SRGU Selections',text:'Ascultă selecțiile SRGU',url})}catch{}}else copyText(url)};
$('#adminBtn').onclick=gate;$('#emptyAdmin').onclick=gate;$('#feed').onclick=e=>{const c=e.target.closest('.card');if(!c)return;const i=+c.dataset.index;i===state.current?togglePlay():playIndex(i,true)};$('#chips').onclick=e=>{const b=e.target.closest('[data-filter]');if(!b)return;state.prefs.filter=b.dataset.filter;savePrefs();render()};$('#upnext').onclick=()=>{renderQueue();openModal('queueModal')};$('#queue').onclick=e=>{const r=e.target.closest('.queue-row');if(!r)return;closeModal('queueModal');playIndex(+r.dataset.index,true)};$$('[data-close]').forEach(b=>b.onclick=()=>closeModal(b.dataset.close));

$('#gateForm').onsubmit=async e=>{e.preventDefault();adminPassword=$('#gatePass').value;$('#gateError').textContent='';try{await adminCall('verify');$('#gatePass').value='';closeModal('gateModal');openModal('adminModal');toast('Admin conectat ✓')}catch(err){adminPassword='';$('#gateError').textContent=err.message}};
$('#tabs').onclick=e=>{const b=e.target.closest('[data-tab]');if(!b)return;$$('#tabs .tab').forEach(x=>x.classList.toggle('active',x===b));['tracks','ad','settings'].forEach(id=>$('#tab-'+id).hidden=id!==b.dataset.tab)};
$('#addUrl').onchange=async()=>{const id=parseYT($('#addUrl').value);if(!id)return;try{const r=await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent('https://www.youtube.com/watch?v='+id)}&format=json`);if(!r.ok)return;const j=await r.json();if(!$('#addTitle').value)$('#addTitle').value=j.title||'';if(!$('#addArtist').value)$('#addArtist').value=j.author_name||''}catch{}};
$('#addForm').onsubmit=async e=>{e.preventDefault();const yt=parseYT($('#addUrl').value);if(!yt)return toast('Link YouTube invalid');try{await adminCall('addTrack',{track:{yt,title:$('#addTitle').value.trim()||'Fără titlu',artist:$('#addArtist').value.trim()||'Necunoscut',views:$('#addViews').value.trim(),own:$('#addOwn').checked}});e.currentTarget.reset();await loadRemote();toast('Melodie salvată global ✓')}catch(err){toast(err.message)}};
$('#adminRows').onclick=async e=>{const b=e.target.closest('[data-act]');if(!b)return;const i=+b.closest('.admin-item').dataset.index,t=state.tracks[i];try{if(b.dataset.act==='del'){if(!confirm(`Ștergi „${t.title}”?`))return;await adminCall('deleteTrack',{id:t.id})}else if(b.dataset.act==='own'){await adminCall('updateTrack',{id:t.id,patch:{own:!t.own}})}else if(b.dataset.act==='up'&&i>0){await adminCall('reorder',{ids:[state.tracks[i].id,state.tracks[i-1].id],orders:[state.tracks[i-1].sort_order,state.tracks[i].sort_order]})}else if(b.dataset.act==='down'&&i<state.tracks.length-1){await adminCall('reorder',{ids:[state.tracks[i].id,state.tracks[i+1].id],orders:[state.tracks[i+1].sort_order,state.tracks[i].sort_order]})}await loadRemote()}catch(err){toast(err.message)}};
$('#saveAd').onclick=async()=>{try{await adminCall('saveAd',{ad:{active:$('#adActive').checked,title:$('#adTitle').value.trim(),desc:$('#adDesc').value.trim(),img:safeUrl($('#adImage').value.trim()),url:safeUrl($('#adUrl').value.trim())}});await loadRemote();toast('Reclamă salvată global ✓')}catch(err){toast(err.message)}};
$('#passwordForm').closest('section').hidden=true;
$('#copyPlaylist').onclick=()=>copyText(location.href.split('#')[0]);$('#exportJson').onclick=()=>{const blob=new Blob([JSON.stringify({tracks:state.tracks,ad:state.ad},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='srgu-selections-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};

render();injectYT();loadRemote();
})();