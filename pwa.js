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

function ensureUi(){
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
