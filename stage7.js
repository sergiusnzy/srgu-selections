(() => {
'use strict';
const cfg=window.SRGU_ADSENSE||{};
const validClient=v=>/^ca-pub-\d+$/.test(String(v||'').trim());
const validSlot=v=>/^\d+$/.test(String(v||'').trim());
let scriptLoaded=false;

function ensureFooter(){
  if(!document.querySelector('link[href="/stage8.css"]')){
    const l=document.createElement('link');l.rel='stylesheet';l.href='/stage8.css';document.head.append(l);
  }
  if(document.querySelector('.site-footer'))return;
  const main=document.querySelector('main');if(!main)return;
  const footer=document.createElement('footer');footer.className='site-footer';
  footer.innerHTML=`<div class="shell site-footer-inner"><div class="site-footer-brand"><strong>SRGU SELECTIONS</strong><span>curated by ear · independent music discovery</span></div><nav class="site-footer-links" aria-label="Informații"><a href="/about.html">Despre</a><a href="/contact.html">Contact</a><a href="/privacy.html">Confidențialitate</a><a href="/terms.html">Termeni</a></nav><div class="site-footer-copy">© 2026 SRGU Selections · Conținutul YouTube aparține creatorilor și titularilor săi de drepturi.</div></div>`;
  main.insertAdjacentElement('afterend',footer);
}

function loadAdsense(){
  if(scriptLoaded||!validClient(cfg.client))return;
  scriptLoaded=true;
  const s=document.createElement('script');
  s.async=true;
  s.crossOrigin='anonymous';
  s.src=`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(cfg.client)}`;
  document.head.append(s);
}
function adMarkup(slot){
  return `<span class="adsense-label">Publicitate</span><div class="adsense-shell"><ins class="adsbygoogle" style="display:block" data-ad-client="${cfg.client}" data-ad-slot="${slot}" data-ad-format="auto" data-full-width-responsive="true"></ins></div>`;
}
function requestAd(node){
  if(!node||node.dataset.loaded==='1')return;
  node.dataset.loaded='1';
  try{(window.adsbygoogle=window.adsbygoogle||[]).push({})}catch{}
}
function mountDiscovery(){
  if(!validSlot(cfg.slots?.discovery))return;
  let zone=document.getElementById('adsenseDiscovery');
  if(!zone){zone=document.createElement('section');zone.id='adsenseDiscovery';zone.className='adsense-zone';zone.setAttribute('aria-label','Publicitate');document.querySelector('.discovery')?.insertAdjacentElement('afterend',zone)}
  zone.innerHTML=adMarkup(cfg.slots.discovery);zone.classList.add('is-active');requestAd(zone.querySelector('ins'));
}
function mountFeed(){
  if(!validSlot(cfg.slots?.feed))return;
  const feed=document.getElementById('feed');if(!feed)return;
  const old=feed.querySelector('.adsense-feed');if(old)old.remove();
  const cards=[...feed.querySelectorAll('.card')];
  if(cards.length<4)return;
  const wrap=document.createElement('div');wrap.className='adsense-zone adsense-feed is-active';wrap.setAttribute('aria-label','Publicitate');wrap.innerHTML=adMarkup(cfg.slots.feed);
  const anchor=cards[Math.min(5,cards.length-1)];anchor.insertAdjacentElement('afterend',wrap);requestAd(wrap.querySelector('ins'));
}
function init(){
  ensureFooter();
  if(!cfg.enabled||!validClient(cfg.client))return;
  if(!validSlot(cfg.slots?.discovery)&&!validSlot(cfg.slots?.feed))return;
  loadAdsense();mountDiscovery();mountFeed();
  const feed=document.getElementById('feed');if(feed)new MutationObserver(()=>requestAnimationFrame(mountFeed)).observe(feed,{childList:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
