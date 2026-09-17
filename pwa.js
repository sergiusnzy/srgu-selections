(() => {
'use strict';
const $=s=>document.querySelector(s);
let deferredPrompt=null;

function standalone(){
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone===true;
}
function isiOS(){return /iphone|ipad|ipod/i.test(navigator.userAgent)}
function toast(msg){const e=document.createElement('div');e.className='toast';e.textContent=msg;$('#toasts')?.append(e);setTimeout(()=>e.remove(),2400)}
function close(id){const m=$('#'+id);if(m){m.classList.remove('open');m.setAttribute('aria-hidden','true')}}
function open(id){const m=$('#'+id);if(m){m.classList.add('open');m.setAttribute('aria-hidden','false')}}

function addMeta(selector,attrs){
  let el=document.head.querySelector(selector);
  if(!el){el=document.createElement('meta');document.head.append(el)}
  Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));
}
function ensureSeo(){
  document.title='SRGU Selections — muzică aleasă după ureche';
  addMeta('meta[name="description"]',{name:'description',content:'Descoperă SRGU Selections: muzică selectată manual, playlisturi personale, genuri, mood-uri și recomandări din comunitate.'});
  addMeta('meta[name="robots"]',{name:'robots',content:'index,follow,max-image-preview:large'});

  let canonical=document.head.querySelector('link[rel="canonical"]');
  if(!canonical){canonical=document.createElement('link');canonical.rel='canonical';document.head.append(canonical)}
  canonical.href='https://srgu.vercel.app/';

  const og={
    'og:type':'website','og:locale':'ro_RO','og:site_name':'SRGU Selections',
    'og:title':'SRGU Selections — muzică aleasă după ureche',
    'og:description':'Mai puțin algoritm. Mai multă muzică pe care chiar ai vrea s-o mai asculți o dată.',
    'og:url':'https://srgu.vercel.app/','og:image':'https://srgu.vercel.app/og-card.svg'
  };
  Object.entries(og).forEach(([property,content])=>addMeta(`meta[property="${property}"]`,{property,content}));
  addMeta('meta[name="twitter:card"]',{name:'twitter:card',content:'summary_large_image'});
  addMeta('meta[name="twitter:title"]',{name:'twitter:title',content:'SRGU Selections — muzică aleasă după ureche'});
  addMeta('meta[name="twitter:description"]',{name:'twitter:description',content:'Selecții muzicale curate, playlisturi personale și discovery fără zgomot.'});
  addMeta('meta[name="twitter:image"]',{name:'twitter:image',content:'https://srgu.vercel.app/og-card.svg'});

  if(!document.querySelector('link[href="/seo.css"]')){const l=document.createElement('link');l.rel='stylesheet';l.href='/seo.css';document.head.append(l)}
  if(!document.head.querySelector('script[data-srgu-schema]')){
    const s=document.createElement('script');s.type='application/ld+json';s.dataset.srguSchema='1';
    s.textContent=JSON.stringify({'@context':'https://schema.org','@type':'WebSite',name:'SRGU Selections',url:'https://srgu.vercel.app/',description:'Colecție muzicală curatoriată manual, cu playlisturi personale, genuri, mood-uri și recomandări.',inLanguage:'ro'});
    document.head.append(s);
  }
}
function ensureFooter(){
  if($('.site-footer'))return;
  const main=$('main.main');if(!main)return;
  main.insertAdjacentHTML('beforeend',`<footer class="site-footer"><div class="site-footer-in"><div class="site-footer-brand">SRGU SELECTIONS · CURATED BY EAR</div><nav class="site-footer-links" aria-label="Informații"><a href="/about.html">Despre</a><a href="/contact.html">Contact</a><a href="/privacy.html">Confidențialitate</a><a href="/terms.html">Termeni</a></nav></div></footer>`);
}
function loadModule(src){
  if(document.querySelector(`script[src="${src}"]`))return;
  const s=document.createElement('script');s.src=src;s.defer=true;document.body.append(s);
}
function loadEnhancements(){loadModule('/stage9.js');loadModule('/stage10.js');loadModule('/stage11.js');loadModule('/stage12.js');loadModule('/stage13.js')}

function ensureUi(){
  ensureSeo();ensureFooter();loadEnhancements();
  if(standalone()) return;
  if(!$('#installAppBtn')){
    const b=document.createElement('button');
    b.id='installAppBtn';b.className='icon-btn';b.type='button';b.title='Instalează aplicația';b.setAttribute('aria-label','Instalează aplicația');b.textContent='↓';b.hidden=!isiOS();
    $('.top-actions')?.prepend(b);
  }
  if(!$('#installHelpModal')){
    document.body.insertAdjacentHTML('beforeend',`<div class="modal" id="installHelpModal" aria-hidden="true"><button class="backdrop" data-pwa-close="installHelpModal" aria-label="Închide"></button><section class="dialog small"><div class="modal-head"><div><span class="eyebrow">SRGU pe telefon</span><h3>Adaugă pe ecranul principal</h3></div><button class="round" data-pwa-close="installHelpModal">×</button></div><div class="admin-scroll pwa-help"><p>Pe iPhone / iPad:</p><ol><li>Apasă <b>Share</b> în Safari.</li><li>Alege <b>Add to Home Screen</b>.</li><li>Confirmă cu <b>Add</b>.</li></ol><p class="hint">SRGU Selections se va deschide apoi aproape ca o aplicație, fără bara normală a browserului.</p></div></section></div>`);
  }
}

async function install(){
  if(deferredPrompt){
    deferredPrompt.prompt();
    const choice=await deferredPrompt.userChoice.catch(()=>null);
    deferredPrompt=null;
    $('#installAppBtn').hidden=true;
    if(choice?.outcome==='accepted') toast('SRGU Selections instalat ✓');
    return;
  }
  if(isiOS()) open('installHelpModal');
}

window.addEventListener('beforeinstallprompt',e=>{
  e.preventDefault();deferredPrompt=e;
  const b=$('#installAppBtn');if(b)b.hidden=false;
});
window.addEventListener('appinstalled',()=>{const b=$('#installAppBtn');if(b)b.hidden=true;toast('SRGU Selections instalat ✓')});

document.addEventListener('click',e=>{
  if(e.target.closest('#installAppBtn')){install();return}
  const c=e.target.closest('[data-pwa-close]');if(c)close(c.dataset.pwaClose);
},true);

if('serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(()=>{}));
}

function init(){ensureUi()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
