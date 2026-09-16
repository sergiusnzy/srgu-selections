(() => {
'use strict';
function init(){
  if(document.querySelector('.site-footer')) return;
  const main=document.querySelector('main');
  if(!main) return;
  const footer=document.createElement('footer');
  footer.className='site-footer';
  footer.innerHTML=`<div class="shell site-footer-inner"><div class="site-footer-brand"><strong>SRGU SELECTIONS</strong><span>curated by ear · independent music discovery</span></div><nav class="site-footer-links" aria-label="Informații"><a href="/about.html">Despre</a><a href="/contact.html">Contact</a><a href="/privacy.html">Confidențialitate</a><a href="/terms.html">Termeni</a></nav><div class="site-footer-copy">© 2026 SRGU Selections · Conținutul YouTube aparține creatorilor și titularilor săi de drepturi.</div></div>`;
  main.insertAdjacentElement('afterend',footer);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
