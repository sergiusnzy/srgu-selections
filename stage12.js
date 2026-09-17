(() => {
'use strict';
const $=s=>document.querySelector(s);
const KEY='srgu_continue_listening_v1';
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}};
const write=v=>{try{localStorage.setItem(KEY,JSON.stringify(v))}catch{}};
const parseYT=s=>{const v=String(s||'');const m=v.match(/(?:youtu\.be\/|v=|shorts\/|embed\/|live\/)([A-Za-z0-9_-]{11})/);return m?.[1]||''};
const format=s=>{s=Math.max(0,Math.floor(Number(s)||0));return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`};
let player=null,lastYt='',progress=read(),tick=null,resumeArmed=true;

function ensureUi(){
  if(!document.querySelector('link[href="/stage12.css"]')){const l=document.createElement('link');l.rel='stylesheet';l.href='/stage12.css';document.head.append(l)}
  if(!$('#resumeCard')){
    const now=$('.now');if(!now)return;
    now.insertAdjacentHTML('beforeend',`<div class="resume-card" id="resumeCard"><img class="resume-cover" id="resumeCover" alt=""><div class="resume-copy"><span>Continue listening</span><b id="resumeTitle">—</b><small id="resumeMeta">—</small></div><button class="resume-go" id="resumeGo" type="button">Continuă</button><button class="resume-dismiss" id="resumeDismiss" type="button" aria-label="Ascunde">×</button></div>`);
  }
}
function currentYt(){return parseYT($('#youtubeBtn')?.href||'')}
function showResume(){
  const yt=currentYt(),card=$('#resumeCard');if(!card||!yt||!resumeArmed)return;
  const rec=progress[yt];
  if(!rec||rec.position<15||!rec.duration||rec.position/rec.duration>0.92){card.classList.remove('show');return}
  $('#resumeCover').src=`https://i.ytimg.com/vi/${yt}/mqdefault.jpg`;
  $('#resumeTitle').textContent=$('#title')?.textContent||'Piesă';
  $('#resumeMeta').textContent=`Ai rămas la ${format(rec.position)} din ${format(rec.duration)}`;
  $('#resumeGo').textContent=`Continuă de la ${format(rec.position)}`;
  card.classList.add('show');
}
function hideResume(){const c=$('#resumeCard');c?.classList.remove('show')}
function saveNow(){
  if(!player?.getCurrentTime||!player?.getDuration)return;
  const yt=currentYt();if(!yt)return;
  const position=Number(player.getCurrentTime()||0),duration=Number(player.getDuration()||0);
  if(!duration)return;
  if(position<15||position/duration>0.92){if(progress[yt]){delete progress[yt];write(progress)}return}
  progress[yt]={position,duration,updatedAt:Date.now()};write(progress);
}
function beginTick(){clearInterval(tick);tick=setInterval(saveNow,5000)}
function stopTick(){saveNow();clearInterval(tick);tick=null}
function wrapPlayer(){
  if(window.__srguResumeWrapped||!window.YT?.Player)return false;
  const RealPlayer=window.YT.Player;
  window.YT.Player=function(target,opts={}){
    const events={...(opts.events||{})};
    const oldReady=events.onReady,oldState=events.onStateChange;
    events.onReady=e=>{player=e.target;window.__srguPlayer=player;oldReady?.(e);setTimeout(showResume,100)};
    events.onStateChange=e=>{
      player=e.target;
      if(e.data===window.YT.PlayerState.PLAYING){beginTick();setTimeout(showResume,100)}
      if(e.data===window.YT.PlayerState.PAUSED||e.data===window.YT.PlayerState.ENDED){stopTick();if(e.data===window.YT.PlayerState.ENDED){const yt=currentYt();if(yt&&progress[yt]){delete progress[yt];write(progress)}hideResume()}}
      oldState?.(e);
    };
    return new RealPlayer(target,{...opts,events});
  };
  Object.assign(window.YT.Player,RealPlayer);
  window.__srguResumeWrapped=true;
  return true;
}
function monitorTrack(){
  const yt=currentYt();if(!yt||yt===lastYt)return;
  lastYt=yt;resumeArmed=true;setTimeout(showResume,120);
}
function bind(){
  document.addEventListener('click',e=>{
    if(e.target.closest('#resumeDismiss')){resumeArmed=false;hideResume();return}
    if(e.target.closest('#resumeGo')){
      const yt=currentYt(),rec=progress[yt];
      if(player&&rec?.position){player.seekTo(rec.position,true);player.playVideo?.();hideResume();resumeArmed=false}
    }
  },true);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)saveNow()});
  window.addEventListener('pagehide',saveNow);
  const title=$('#title');if(title)new MutationObserver(monitorTrack).observe(title,{childList:true,subtree:true,characterData:true});
}
function init(){ensureUi();bind();const t=setInterval(()=>{if(wrapPlayer()){clearInterval(t)}},20);setInterval(monitorTrack,800);setTimeout(showResume,1200)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
