(() => {
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const BASE='https://srgu.vercel.app';
const RECENT_KEY='srgu_recent_v1', RESUME_KEY='srgu_continue_listening_v1', TASTE_KEY='srgu_taste_v1';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const parseYT=s=>{const v=String(s||'');const m=v.match(/(?:youtu\.be\/|v=|shorts\/|embed\/|live\/|\/vi\/)([A-Za-z0-9_-]{11})/);return m?.[1]||(/^[A-Za-z0-9_-]{11}$/.test(v)?v:'')};
const thumb=(yt,q='mqdefault')=>`https://i.ytimg.com/vi/${encodeURIComponent(yt)}/${q}.jpg`;
const fmt=s=>{s=Math.max(0,Math.floor(Number(s)||0));return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`};
const fmtMin=s=>Math.max(0,Math.round((Number(s)||0)/60));

let tracks=[], trackMap=new Map(), player=null, lastYt='', playerVisible=true, resumeArmed=true, deepLinked=false;
let progress=read(RESUME_KEY,{});
let taste=read(TASTE_KEY,{seconds:0,plays:0,tracks:{}});

function ensureCss(){
  ['/stage9.css','/stage10.css','/stage11.css','/stage12.css','/stage13.css','/stage15.css'].forEach(h=>{
    if(document.querySelector(`link[href="${h}"]`))return;
    const l=document.createElement('link');l.rel='stylesheet';l.href=h;document.head.append(l);
  });
}
function currentYt(){return parseYT($('#youtubeBtn')?.href||'')}
function currentTrack(){
  const yt=currentYt(); if(!yt)return null;
  const meta=trackMap.get(yt)||{};
  const title=$('#title')?.textContent?.trim()||meta.title||'Fără titlu';
  const artist=(($('#meta')?.textContent||'').split(' · ')[0]||meta.artist||'Necunoscut').trim();
  return {yt,title,artist,genre:meta.genre||'',mood:meta.mood||'',energy:meta.energy||'',origin:meta.origin||'',tags:meta.tags||[],own:!!meta.own,curator_note:meta.curator_note||''};
}
function toast(msg){const e=document.createElement('div');e.className='toast';e.textContent=msg;$('#toasts')?.append(e);setTimeout(()=>e.remove(),2200)}

// Discovery
function isNight(t){const hay=norm([t.mood,t.genre,t.energy,t.origin,...(Array.isArray(t.tags)?t.tags:[])].join(' '));return /night ?drive|late ?night/.test(hay)}
function isHigh(t){const e=norm(t.energy);return e==='high'||e==='peak'||(t.tags||[]).map(norm).some(x=>['energy','highenergy','peak'].includes(x))}
function isPick(t){return !!t.own||!!String(t.curator_note||'').trim()||(t.tags||[]).map(norm).some(x=>['srgu','srgupick','srgupicks','pick'].includes(x))}
function discoveryCard(t){const meta=[t.artist,t.genre||t.mood].filter(Boolean).join(' · ');return `<button class="discovery-card" type="button" data-discovery-yt="${esc(t.yt)}"><span class="discovery-thumb"><img loading="lazy" src="${thumb(t.yt)}" alt=""><span class="discovery-play">▶</span></span><span class="discovery-card-title">${esc(t.title||'Fără titlu')}</span><span class="discovery-card-meta">${esc(meta||'SRGU Selections')}</span></button>`}
function rail(title,subtitle,items,key){if(items.length<2)return'';return `<section class="discovery-rail" data-rail="${key}"><div class="discovery-rail-head"><div><span class="eyebrow">${esc(subtitle)}</span><h2>${esc(title)}</h2></div><button class="rail-see-all" type="button" data-rail-filter="${key}">Vezi toate →</button></div><div class="discovery-track">${items.slice(0,10).map(discoveryCard).join('')}</div></section>`}
function ensureDiscovery(){if($('#discoveryCollections'))return;const s=document.createElement('section');s.id='discoveryCollections';s.className='discovery-collections';s.setAttribute('aria-label','Colecții recomandate');$('.discovery')?.insertAdjacentElement('afterend',s)}
function renderDiscovery(){const root=$('#discoveryCollections');if(!root)return;const newest=[...tracks].sort((a,b)=>(Date.parse(b.created_at||'')||0)-(Date.parse(a.created_at||'')||0));root.innerHTML=[rail('Nou adăugate','Fresh in',newest,'newest'),rail('SRGU Picks','Curated',tracks.filter(isPick),'picks'),rail('Night Drive','Mood',tracks.filter(isNight),'night'),rail('High Energy','Energy',tracks.filter(isHigh),'high')].join('');root.hidden=!root.innerHTML.trim()}
function findFeedCard(yt){return $$('#feed .card').find(c=>parseYT(c.querySelector('.thumb img')?.src||'')===yt)||null}
function playYt(yt){const c=findFeedCard(yt);if(c){c.click();$('.player-sticky')?.scrollIntoView({behavior:'smooth',block:'start'})}else location.href='/?track='+encodeURIComponent(yt)}
function filterRail(key){if(key==='newest'){const s=$('#sortSelect');if(s){s.value='newest';s.dispatchEvent(new Event('change',{bubbles:true}))}}else if(key==='picks'){$('[data-filter="mine"]')?.click()}else if(key==='high'){const i=$('#searchInput');if(i){i.value='High';i.dispatchEvent(new Event('input',{bubbles:true}))}}else if(key==='night'){const mood=tracks.find(isNight)?.mood||'';const b=$$('[data-smart-kind="mood"]').find(x=>norm(x.dataset.smartValue)===norm(mood));b?.click()}$('.feed-section')?.scrollIntoView({behavior:'smooth',block:'start'})}

// Track pages + share
function ensureInfoButton(){if($('#trackInfoBtn'))return;const a=document.createElement('a');a.id='trackInfoBtn';a.className='round track-info-btn';a.href='#';a.title='Pagina piesei';a.setAttribute('aria-label','Pagina piesei');a.textContent='i';$('#shareTrackBtn')?.insertAdjacentElement('afterend',a)}
function decorateFeed(){
  $$('#feed .card').forEach(card=>{const id=parseYT(card.querySelector('.thumb img')?.src||''),th=card.querySelector('.thumb');if(!id||!th)return;let a=th.querySelector('.track-detail-link');if(!a){a=document.createElement('a');a.className='track-detail-link';a.textContent='i';a.title='Pagina piesei';a.setAttribute('aria-label','Pagina piesei');th.append(a)}a.href=`/t/${id}`});
  openDeepLink();
}
function openDeepLink(){if(deepLinked)return;const id=parseYT(new URLSearchParams(location.search).get('track')||'');if(!id)return;const c=findFeedCard(id);if(c){deepLinked=true;c.click();setTimeout(()=>scrollTo({top:0,behavior:'smooth'}),120)}}
async function shareCurrent(){const t=currentTrack();if(!t)return;const url=`${BASE}/t/${t.yt}`;try{if(navigator.share)await navigator.share({title:t.title,text:`${t.artist} · SRGU Selections`,url});else{await navigator.clipboard.writeText(url);toast('Link SRGU copiat ✓')}}catch{}}

// Recent
function recentRead(){return read(RECENT_KEY,[])}
function ensureRecent(){if($('#recentSection'))return;const anchor=$('.discovery')||$('.feed-section');if(!anchor)return;const sec=document.createElement('section');sec.id='recentSection';sec.className='recent-section';sec.hidden=true;sec.innerHTML=`<div class="recent-head"><div><span class="eyebrow">Pe dispozitivul tău</span><h2>Ascultate recent</h2><div class="recent-privacy">Istoricul rămâne doar în acest browser.</div></div><span class="spacer"></span><button class="recent-clear" id="recentClear" type="button">Șterge istoricul</button></div><div class="recent-rail" id="recentRail"></div>`;anchor.insertAdjacentElement('afterend',sec)}
function renderRecent(){const sec=$('#recentSection'),rail=$('#recentRail');if(!sec||!rail)return;const items=recentRead().slice(0,8);sec.hidden=!items.length;rail.innerHTML=items.map(t=>`<button class="recent-card" type="button" data-recent-yt="${esc(t.yt)}"><div class="recent-cover"><img src="${thumb(t.yt)}" alt="" loading="lazy"><span class="recent-play">▶</span></div><h3>${esc(t.title||'Fără titlu')}</h3><p>${esc(t.artist||'Necunoscut')}</p></button>`).join('')}
function saveRecent(t){if(!t?.yt)return;const items=recentRead().filter(x=>x.yt!==t.yt);items.unshift({yt:t.yt,title:t.title,artist:t.artist,playedAt:Date.now()});write(RECENT_KEY,items.slice(0,30));renderRecent()}

// Continue listening
function ensureResume(){if($('#resumeCard'))return;$('.now')?.insertAdjacentHTML('beforeend',`<div class="resume-card" id="resumeCard"><img class="resume-cover" id="resumeCover" alt=""><div class="resume-copy"><span>Continue listening</span><b id="resumeTitle">—</b><small id="resumeMeta">—</small></div><button class="resume-go" id="resumeGo" type="button">Continuă</button><button class="resume-dismiss" id="resumeDismiss" type="button" aria-label="Ascunde">×</button></div>`)}
function renderResume(){const t=currentTrack(),card=$('#resumeCard');if(!t||!card||!resumeArmed){card?.classList.remove('show');return}const r=progress[t.yt];if(!r||r.position<15||!r.duration||r.position/r.duration>0.92){card.classList.remove('show');return}$('#resumeCover').src=thumb(t.yt);$('#resumeTitle').textContent=t.title;$('#resumeMeta').textContent=`Ai rămas la ${fmt(r.position)} din ${fmt(r.duration)}`;$('#resumeGo').textContent=`Continuă de la ${fmt(r.position)}`;card.classList.add('show')}
function saveProgress(){if(!player?.getCurrentTime||!player?.getDuration)return;const t=currentTrack();if(!t)return;const position=Number(player.getCurrentTime()||0),duration=Number(player.getDuration()||0);if(!duration)return;if(position<15||position/duration>0.92){if(progress[t.yt]){delete progress[t.yt];write(RESUME_KEY,progress)}return}progress[t.yt]={position,duration,updatedAt:Date.now()};write(RESUME_KEY,progress)}

// Mini player
function ensureMini(){if($('#miniPlayer'))return;document.body.insertAdjacentHTML('beforeend',`<aside class="mini-player" id="miniPlayer" aria-label="Mini player"><div class="mini-cover"><img id="miniCover" alt=""></div><button class="mini-copy" id="miniOpen" type="button"><b id="miniTitle">—</b><span id="miniArtist">—</span></button><div class="mini-controls"><button class="mini-btn primary" id="miniPlay" type="button">▶</button><button class="mini-btn" id="miniNext" type="button">▶|</button></div></aside>`)}
function syncMini(){const w=$('#miniPlayer'),t=currentTrack();if(!w)return;const show=matchMedia('(max-width:820px)').matches&&!!t&&!playerVisible;w.classList.toggle('show',show);document.body.classList.toggle('mini-player-visible',show);if(!t)return;$('#miniCover').src=thumb(t.yt);$('#miniTitle').textContent=t.title;$('#miniArtist').textContent=t.artist;$('#miniPlay').textContent=(($('#playBtn')?.textContent||'').includes('❚'))?'❚❚':'▶'}
function observePlayer(){const target=$('.player-sticky');if(!target)return;if('IntersectionObserver'in window)new IntersectionObserver(e=>{playerVisible=!!e[0]?.isIntersecting;syncMini()},{threshold:.2}).observe(target)}

// Media Session
function syncMedia(){if(!('mediaSession'in navigator)||typeof MediaMetadata==='undefined')return;const t=currentTrack();if(!t)return;try{navigator.mediaSession.metadata=new MediaMetadata({title:t.title,artist:t.artist,album:'SRGU Selections',artwork:[{src:thumb(t.yt,'hqdefault'),sizes:'480x360',type:'image/jpeg'}]});navigator.mediaSession.playbackState=(($('#playBtn')?.textContent||'').includes('❚'))?'playing':'paused'}catch{}}
function bindMedia(){if(!('mediaSession'in navigator))return;const bind=(n,fn)=>{try{navigator.mediaSession.setActionHandler(n,fn)}catch{}};bind('play',()=>$('#playBtn')?.click());bind('pause',()=>$('#playBtn')?.click());bind('nexttrack',()=>$('#nextBtn')?.click());bind('previoustrack',()=>$('#prevBtn')?.click());bind('stop',()=>{if(($('#playBtn')?.textContent||'').includes('❚'))$('#playBtn')?.click()})}

// Taste
function ensureTaste(){if($('#tasteSection'))return;const anchor=$('#recentSection')||$('.discovery')||$('.feed-section');if(!anchor)return;const sec=document.createElement('section');sec.id='tasteSection';sec.className='taste-section';sec.innerHTML=`<div class="taste-head"><div><span class="eyebrow">Doar pe dispozitivul tău</span><h2>Your SRGU Taste</h2><div class="taste-sub">Se construiește din ce asculți, fără cont.</div></div><button class="taste-reset" id="tasteReset" type="button">Resetează</button></div><div class="taste-grid"><div class="taste-stat"><b id="tasteMinutes">0</b><span>minute ascultate</span></div><div class="taste-stat"><b id="tastePlays">0</b><span>redări</span></div><div class="taste-stat"><b id="tasteTracks">0</b><span>piese diferite</span></div><div class="taste-stat"><b id="tasteGenres">0</b><span>genuri</span></div></div><div class="taste-summary" id="tasteSummary"></div><div class="taste-columns"><div class="taste-box"><h3>Genurile tale</h3><div class="taste-bars" id="tasteGenreBars"></div></div><div class="taste-box"><h3>Cele mai ascultate</h3><div class="taste-top" id="tasteTopTracks"></div></div></div>`;anchor.insertAdjacentElement('afterend',sec)}
function tasteTrack(t){if(!t?.yt)return null;if(!taste.tracks[t.yt])taste.tracks[t.yt]={plays:0,seconds:0,title:t.title,artist:t.artist,genre:t.genre,mood:t.mood};const s=taste.tracks[t.yt];Object.assign(s,{title:t.title||s.title,artist:t.artist||s.artist,genre:t.genre||s.genre,mood:t.mood||s.mood});return s}
function aggregate(field){const out={};Object.values(taste.tracks||{}).forEach(t=>{const n=String(t[field]||'').trim();if(n)out[n]=(out[n]||0)+(t.seconds||0)+(t.plays||0)*20});return Object.entries(out).sort((a,b)=>b[1]-a[1])}
function renderTaste(){if(!$('#tasteSection'))return;const genres=aggregate('genre'),moods=aggregate('mood'),mins=fmtMin(taste.seconds),plays=taste.plays||0;$('#tasteMinutes').textContent=mins;$('#tastePlays').textContent=plays;$('#tasteTracks').textContent=Object.keys(taste.tracks||{}).length;$('#tasteGenres').textContent=genres.length;const g=genres[0]?.[0],m=moods[0]?.[0];$('#tasteSummary').textContent=plays<3&&mins<3?'Ascultă câteva piese și profilul tău muzical începe să prindă contur.':g&&m?`În perioada asta gravitezi spre ${g}, cu un vibe mai ales ${m}. Ai ${plays} redări și aproximativ ${mins} minute ascultate.`:g?`${g} este momentan genul tău dominant. Ai ${plays} redări și aproximativ ${mins} minute ascultate.`:`Ai ${plays} redări și aproximativ ${mins} minute ascultate.`;const gb=$('#tasteGenreBars');if(gb)gb.innerHTML=genres.length?genres.slice(0,5).map(([n,v])=>`<div class="taste-bar"><span class="taste-bar-name">${esc(n)}</span><span class="taste-bar-track"><span class="taste-bar-fill" style="width:${Math.max(8,Math.round(v/(genres[0][1]||1)*100))}%"></span></span><span class="taste-bar-val">${Math.round(v/(genres[0][1]||1)*100)}%</span></div>`).join(''):'<div class="taste-empty">Încă nu sunt suficiente date.</div>';const top=$('#tasteTopTracks');if(top){const arr=Object.entries(taste.tracks||{}).sort((a,b)=>((b[1].seconds||0)+(b[1].plays||0)*20)-((a[1].seconds||0)+(a[1].plays||0)*20)).slice(0,5);top.innerHTML=arr.length?arr.map(([yt,t])=>`<div class="taste-track"><img src="${thumb(yt)}" alt=""><div><b>${esc(t.title||'Fără titlu')}</b><span>${esc(t.artist||'Necunoscut')}</span></div><strong>${t.plays||0}×</strong></div>`).join(''):'<div class="taste-empty">Încă nu ai suficiente ascultări.</div>'}}
function markPlay(t){if(!t||t.yt===lastYt)return;lastYt=t.yt;saveRecent(t);resumeArmed=true;renderResume();const s=tasteTrack(t);if(s){s.plays=(s.plays||0)+1;taste.plays=(taste.plays||0)+1;write(TASTE_KEY,taste);renderTaste()}syncMedia();syncMini();refreshInfo()}
function seedTaste(){if((taste.plays||0)>0)return;for(const r of recentRead().slice(0,10)){taste.tracks[r.yt]={plays:1,seconds:0,title:r.title,artist:r.artist,genre:'',mood:''};taste.plays++}write(TASTE_KEY,taste)}

function refreshInfo(){const t=currentTrack(),a=$('#trackInfoBtn');if(a){a.href=t?`/t/${t.yt}`:'#';a.hidden=!t}}
function onTrackChanged(){const t=currentTrack();if(t)markPlay(t);renderResume();syncMini();syncMedia();refreshInfo()}
function onTick(){saveProgress();const t=currentTrack();if(player&&t){let playing=false;try{playing=player.getPlayerState?.()===window.YT?.PlayerState?.PLAYING}catch{}if(playing){const s=tasteTrack(t);if(s){s.seconds=(s.seconds||0)+5;taste.seconds=(taste.seconds||0)+5;write(TASTE_KEY,taste)}}}syncMini();syncMedia();renderTaste()}

function wrapPlayer(){if(window.__srguEnhWrapped||!window.YT?.Player)return false;const Real=window.YT.Player;window.YT.Player=function(target,opts={}){const events={...(opts.events||{})},oldReady=events.onReady,oldState=events.onStateChange;events.onReady=e=>{player=e.target;window.__srguPlayer=player;oldReady?.(e);setTimeout(onTrackChanged,100)};events.onStateChange=e=>{player=e.target;if(e.data===window.YT.PlayerState.ENDED){const yt=currentYt();if(yt&&progress[yt]){delete progress[yt];write(RESUME_KEY,progress)}}oldState?.(e);setTimeout(()=>{syncMini();syncMedia();renderResume()},50)};return new Real(target,{...opts,events})};Object.assign(window.YT.Player,Real);window.__srguEnhWrapped=true;return true}

async function loadTracks(){try{const r=await fetch('/api/public?resource=tracks',{cache:'no-store'});tracks=r.ok?await r.json():[];trackMap=new Map(tracks.map(t=>[t.yt,t]));renderDiscovery();renderTaste();setTimeout(onTrackChanged,50)}catch{tracks=[];trackMap=new Map()}}

function ensureUi(){ensureCss();ensureDiscovery();ensureInfoButton();ensureRecent();ensureResume();ensureMini();ensureTaste();renderRecent();renderTaste();observePlayer();bindMedia()}
function bind(){
  document.addEventListener('click',e=>{
    const d=e.target.closest('[data-discovery-yt]');if(d){playYt(d.dataset.discoveryYt);return}
    const rf=e.target.closest('[data-rail-filter]');if(rf){filterRail(rf.dataset.railFilter);return}
    const recent=e.target.closest('[data-recent-yt]');if(recent){playYt(recent.dataset.recentYt);return}
    if(e.target.closest('#recentClear')){write(RECENT_KEY,[]);renderRecent();return}
    if(e.target.closest('#resumeDismiss')){resumeArmed=false;$('#resumeCard')?.classList.remove('show');return}
    if(e.target.closest('#resumeGo')){const t=currentTrack(),r=t&&progress[t.yt];if(player&&r?.position){player.seekTo(r.position,true);player.playVideo?.();resumeArmed=false;$('#resumeCard')?.classList.remove('show')}return}
    if(e.target.closest('#miniPlay')){$('#playBtn')?.click();return}
    if(e.target.closest('#miniNext')){$('#nextBtn')?.click();return}
    if(e.target.closest('#miniOpen')){$('.player-sticky')?.scrollIntoView({behavior:'smooth',block:'start'});return}
    if(e.target.closest('#shareTrackBtn')){e.preventDefault();e.stopImmediatePropagation();shareCurrent();return}
    if(e.target.closest('#tasteReset')){taste={seconds:0,plays:0,tracks:{}};lastYt='';write(TASTE_KEY,taste);renderTaste();return}
    if(e.target.closest('.track-detail-link'))e.stopPropagation();
  },true);
  const currentObs=new MutationObserver(()=>requestAnimationFrame(onTrackChanged));
  ['#title','#meta','#playBtn','#youtubeBtn'].forEach(sel=>{const el=$(sel);if(el)currentObs.observe(el,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['href']})});
  const feed=$('#feed');if(feed)new MutationObserver(()=>requestAnimationFrame(decorateFeed)).observe(feed,{childList:true});
  addEventListener('resize',syncMini,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)saveProgress();else{syncMini();syncMedia()}});
  addEventListener('pagehide',saveProgress);
}
function init(){ensureUi();seedTaste();bind();decorateFeed();loadTracks();const t=setInterval(()=>{if(wrapPlayer())clearInterval(t)},20);setInterval(onTick,5000);setTimeout(onTrackChanged,1200)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
