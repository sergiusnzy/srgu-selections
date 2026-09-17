(() => {
'use strict';
if(!('mediaSession' in navigator) || typeof MediaMetadata==='undefined') return;

const $=s=>document.querySelector(s);
let lastKey='';

function getVideoId(){
  const href=$('#youtubeBtn')?.getAttribute('href')||'';
  const m=href.match(/youtu\.be\/([A-Za-z0-9_-]{11})|[?&]v=([A-Za-z0-9_-]{11})/);
  return m?.[1]||m?.[2]||'';
}
function getTrack(){
  const title=($('#title')?.textContent||'').trim();
  if(!title || title==='Alege o melodie') return null;
  const meta=($('#meta')?.textContent||'').trim();
  const artist=(meta.split(' · ')[0]||'SRGU Selections').trim()||'SRGU Selections';
  const yt=getVideoId();
  return {title,artist,yt};
}
function updateMetadata(){
  const t=getTrack();
  if(!t) return;
  const key=`${t.yt}|${t.title}|${t.artist}`;
  if(key===lastKey) return;
  lastKey=key;
  const artwork=t.yt?[
    {src:`https://i.ytimg.com/vi/${t.yt}/hqdefault.jpg`,sizes:'480x360',type:'image/jpeg'},
    {src:`https://i.ytimg.com/vi/${t.yt}/maxresdefault.jpg`,sizes:'1280x720',type:'image/jpeg'}
  ]:[];
  try{
    navigator.mediaSession.metadata=new MediaMetadata({
      title:t.title,
      artist:t.artist,
      album:'SRGU Selections',
      artwork
    });
  }catch{}
}
function syncPlaybackState(){
  const b=$('#playBtn');
  if(!b) return;
  const txt=(b.textContent||'').trim();
  try{navigator.mediaSession.playbackState=txt.includes('❚')?'playing':'paused'}catch{}
}
function click(id){document.getElementById(id)?.click()}
function bindAction(name,fn){try{navigator.mediaSession.setActionHandler(name,fn)}catch{}}

bindAction('play',()=>click('playBtn'));
bindAction('pause',()=>click('playBtn'));
bindAction('nexttrack',()=>click('nextBtn'));
bindAction('previoustrack',()=>click('prevBtn'));
bindAction('stop',()=>{const b=$('#playBtn');if((b?.textContent||'').includes('❚'))b.click()});

function init(){
  updateMetadata();syncPlaybackState();
  const title=$('#title'),meta=$('#meta'),play=$('#playBtn'),yt=$('#youtubeBtn');
  const mo=new MutationObserver(()=>{updateMetadata();syncPlaybackState()});
  [title,meta,play,yt].filter(Boolean).forEach(el=>mo.observe(el,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['href']}));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){updateMetadata();syncPlaybackState()}});
  window.addEventListener('focus',()=>{updateMetadata();syncPlaybackState()});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
