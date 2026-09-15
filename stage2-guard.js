(() => {
  'use strict';
  function boot(){
    const feed=document.getElementById('feed');
    const select=document.getElementById('sortSelect');
    if(feed&&select){
      const nativeAppend=feed.append.bind(feed);
      feed.append=(...nodes)=>{
        const fresh=nodes.filter(n=>!(n&&n.parentNode===feed));
        if(fresh.length) nativeAppend(...fresh);
      };

      function applyCssOrder(){
        const mode=select.value;
        const cards=[...feed.querySelectorAll('.card')];
        cards.forEach((card,index)=>{
          if(!card.dataset.stableOrder) card.dataset.stableOrder=card.dataset.curatedOrder||String(index);
        });
        const ranked=[...cards].sort((a,b)=>{
          if(mode==='curated') return Number(a.dataset.stableOrder)-Number(b.dataset.stableOrder);
          const at=Date.parse(a.dataset.created||'')||0;
          const bt=Date.parse(b.dataset.created||'')||0;
          return mode==='newest'?bt-at:at-bt;
        });
        ranked.forEach((card,index)=>{card.style.order=String(index)});
      }
      select.addEventListener('change',applyCssOrder);
      new MutationObserver(()=>requestAnimationFrame(applyCssOrder)).observe(feed,{childList:true});
      applyCssOrder();
    }

    if(!document.querySelector('script[src="/stage3.js"]')){
      const s=document.createElement('script');s.src='/stage3.js';s.defer=true;document.body.append(s);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
