(() => {
'use strict';
const KEY='srgu_taste_v1';
const RECENT='srgu_recent_v1';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const parseYT=s=>{const m=String(s||'').match(/(?:youtu\.be\/|v=|shorts\/|embed\/|live\/|\/vi\/)([A-Za-z0-9_-]{11})/);return m?.[1]||''};
const fmtMin=s=>Math.max(0,Math.round((Number(s)||0)/60));
let tracks=new Map(),lastYt='',lastPlaying=false,timer=null,stats=read(KEY,{seconds:0,plays:0,tracks:{}});

function ensureCss(){if(document.querySelector('link[href="/stage15.css"]'))return;const l=document.createElement('link');l.rel='stylesheet';l.href='/stage15.css';document.head.append(l)}
function ensureUi(){
  if($('#tasteSection'))return;
  const anchor=$('#recentSection')||$('.discovery')||$('.feed-section');if(!anchor)return;
  const sec=document.createElement('section');sec.id='tasteSection';sec.className='taste-section';
  sec.innerHTML=`<div class="taste-head"><div><span class="eyebrow">Doar pe dispozitivul tău</span><h2>Your SRGU Taste</h2><div class="taste-sub">Se construiește din ce asculți, fără cont.</div></div><button class="taste-reset" id="tasteReset" type="button">Resetează</button></div><div class="taste-grid"><div class="taste-stat"><b id="tasteMinutes">0</b><span>minute ascultate</span></div><div class="taste-stat"><b id="tastePlays">0</b><span>redări</span></div><div class="taste-stat"><b id="tasteTracks">0</b><span>piese diferite</span></div><div class="taste-stat"><b id="tasteGenres">0</b><span>genuri</span></div></div><div class="taste-summary" id="tasteSummary">Ascultă câteva piese și profilul tău muzical începe să prindă contur.</div><div class="taste-columns"><div class="taste-box"><h3>Genurile tale</h3><div class="taste-bars" id="tasteGenreBars"></div></div><div class="taste-box"><h3>Cele mai ascultate</h3><div class="taste-top" id="tasteTopTracks"></div></div></div>`;
  anchor.insertAdjacentElement('afterend',sec);
}
async function loadMeta(){
  try{const r=await fetch('/api/public?resource=tracks',{cache:'no-store'});if(!r.ok)return;const rows=await r.json();tracks=new Map((rows||[]).map(t=>[t.yt,t]));render()}catch{}
}
function current(){
  const yt=parseYT($('#youtubeBtn')?.href||'');
  if(!yt)return null;
  const meta=tracks.get(yt)||{};
  const title=$('#title')?.textContent?.trim()||meta.title||'Fără titlu';
  const artist=($('#meta')?.textContent||'').split(' · ')[0]||meta.artist||'Necunoscut';
  return {yt,title,artist,genre:meta.genre||'',mood:meta.mood||''};
}
function ensureTrack(t){
  if(!t?.yt)return null;
  if(!stats.tracks[t.yt])stats.tracks[t.yt]={plays:0,seconds:0,title:t.title,artist:t.artist,genre:t.genre,mood:t.mood};
  const s=stats.tracks[t.yt];s.title=t.title||s.title;s.artist=t.artist||s.artist;s.genre=t.genre||s.genre;s.mood=t.mood||s.mood;return s;
}
function markPlay(){
  const t=current();if(!t||t.yt===lastYt)return;
  lastYt=t.yt;const s=ensureTrack(t);if(!s)return;s.plays=(s.plays||0)+1;stats.plays=(stats.plays||0)+1;write(KEY,stats);render();
}
function tick(){
  const p=window.__srguPlayer;const t=current();if(!p||!t)return;
  let playing=false;try{playing=p.getPlayerState?.()===window.YT?.PlayerState?.PLAYING}catch{}
  if(playing){const s=ensureTrack(t);if(s){s.seconds=(s.seconds||0)+5;stats.seconds=(stats.seconds||0)+5;write(KEY,stats)}}
  if(playing!==lastPlaying){lastPlaying=playing;render()}
}
function aggregate(field){
  const out={};Object.values(stats.tracks||{}).forEach(t=>{const name=String(t[field]||'').trim();if(!name)return;out[name]=(out[name]||0)+(t.seconds||0)+((t.plays||0)*20)});return Object.entries(out).sort((a,b)=>b[1]-a[1]);
}
function summary(genres,moods){
  const mins=fmtMin(stats.seconds),plays=stats.plays||0;if(plays<3&&mins<3)return 'Ascultă câteva piese și profilul tău muzical începe să prindă contur.';
  const g=genres[0]?.[0],m=moods[0]?.[0];
  if(g&&m)return `În perioada asta gravitezi spre ${g}, cu un vibe mai ales ${m}. Ai ${plays} redări și aproximativ ${mins} minute ascultate.`;
  if(g)return `${g} este momentan genul tău dominant. Ai ${plays} redări și aproximativ ${mins} minute ascultate.`;
  return `Ai ${plays} redări și aproximativ ${mins} minute ascultate. Pe măsură ce completezi metadatele pieselor, profilul devine mai precis.`;
}
function renderBars(items){
  const box=$('#tasteGenreBars');if(!box)return;if(!items.length){box.innerHTML='<div class="taste-empty">Încă nu sunt suficiente date.</div>';return}
  const max=items[0][1]||1;box.innerHTML=items.slice(0,5).map(([n,v])=>`<div class="taste-bar"><span class="taste-bar-name">${esc(n)}</span><span class="taste-bar-track"><span class="taste-bar-fill" style="width:${Math.max(8,Math.round(v/max*100))}%"></span></span><span class="taste-bar-val">${Math.round(v/max*100)}%</span></div>`).join('');
}
function renderTop(){
  const box=$('#tasteTopTracks');if(!box)return;const arr=Object.entries(stats.tracks||{}).sort((a,b)=>((b[1].seconds||0)+(b[1].plays||0)*20)-((a[1].seconds||0)+(a[1].plays||0)*20)).slice(0,5);
  if(!arr.length){box.innerHTML='<div class="taste-empty">Încă nu ai suficiente ascultări.</div>';return}
  box.innerHTML=arr.map(([yt,t])=>`<div class="taste-track"><img src="https://i.ytimg.com/vi/${esc(yt)}/mqdefault.jpg" alt=""><div><b>${esc(t.title||'Fără titlu')}</b><span>${esc(t.artist||'Necunoscut')}</span></div><strong>${t.plays||0}×</strong></div>`).join('');
}
function seedRecent(){
  if((stats.plays||0)>0)return;const recent=read(RECENT,[]);if(!recent.length)return;for(const r of recent.slice(0,10)){if(!stats.tracks[r.yt])stats.tracks[r.yt]={plays:1,seconds:0,title:r.title,artist:r.artist,genre:'',mood:''};stats.plays++}write(KEY,stats)
}
function render(){
  if(!$('#tasteSection'))return;const genres=aggregate('genre'),moods=aggregate('mood');
  $('#tasteMinutes').textContent=String(fmtMin(stats.seconds));$('#tastePlays').textContent=String(stats.plays||0);$('#tasteTracks').textContent=String(Object.keys(stats.tracks||{}).length);$('#tasteGenres').textContent=String(genres.length);$('#tasteSummary').textContent=summary(genres,moods);renderBars(genres);renderTop();
}
function bind(){
  const title=$('#title');if(title)new MutationObserver(()=>setTimeout(markPlay,120)).observe(title,{childList:true,subtree:true,characterData:true});
  document.addEventListener('click',e=>{if(e.target.closest('#feed .card,.discovery-card,.recent-card,.queue-row'))setTimeout(markPlay,220);if(e.target.closest('#tasteReset')){stats={seconds:0,plays:0,tracks:{}};lastYt='';write(KEY,stats);render()}},true);
  window.addEventListener('srgu:track-play',()=>setTimeout(markPlay,50));
}
function init(){ensureCss();ensureUi();seedRecent();loadMeta();bind();setTimeout(markPlay,1400);timer=setInterval(tick,5000);render()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
