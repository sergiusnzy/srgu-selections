(() => {
  'use strict';
  function boot(){
    const feed=document.getElementById('feed');
    const select=document.getElementById('sortSelect');
    if(!feed||!select)return;

    const nativeAppend=feed.append.bind(feed);
    feed.append=(...nodes)=>{
      const fresh=nodes.filter(n=>!(n&&n.parentNode===feed));
      if(fresh.length) nativeAppend(...fresh);
    };

    function applyCssOrder(){
      const mode=select.value;
      [...feed.querySelectorAll('.card')].forEach((card,index)=>{
        if(!card.dataset.stableOrder) card.dataset.stableOrder=card.dataset.curatedOrder||String(index);
        if(mode==='curated') card.style.order=Number(card.dataset.stableOrder)||0;
        else {
          const ts=Date.parse(card.dataset.created||'')||0;
          card.style.order=mode==='newest'?-ts:ts;
        }
      });
    }
    select.addEventListener('change',applyCssOrder);
    new MutationObserver(()=>requestAnimationFrame(applyCssOrder)).observe(feed,{childList:true});
    applyCssOrder();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
