const CACHE='srgu-shell-v13';
const SHELL=[
  '/',
  '/index.html',
  '/styles.css',
  '/stage2.css',
  '/stage3.css',
  '/stage4.css',
  '/stage5.css',
  '/stage7.css',
  '/stage8.css',
  '/stage9.css',
  '/stage10.css',
  '/stage11.css',
  '/stage12.css',
  '/stage13.css',
  '/stage15.css',
  '/track.css',
  '/seo.css',
  '/legal.css',
  '/about.html',
  '/contact.html',
  '/privacy.html',
  '/terms.html',
  '/app.js',
  '/ux-2026.js',
  '/supabase-fetch-fix.js',
  '/server-read-shim.js',
  '/stage2.js',
  '/stage2-guard.js',
  '/stage3.js',
  '/stage4.js',
  '/stage5.js',
  '/enhancements.js',
  '/pwa.js',
  '/adsense-config.js',
  '/stage7.js',
  '/manifest.webmanifest',
  '/srgu-icon.svg',
  '/og-card.svg'
];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await Promise.allSettled(SHELL.map(asset=>cache.add(asset)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;

  if(req.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        const res=await fetch(req);
        if(!url.pathname.startsWith('/t/')&&res.ok){
          const cache=await caches.open(CACHE);
          cache.put(url.pathname==='/'?'/':url.pathname,res.clone());
        }
        return res;
      }catch{
        return (await caches.match(url.pathname))||(await caches.match('/'));
      }
    })());
    return;
  }

  if(/\.(?:css|js|svg|webmanifest)$/.test(url.pathname)){
    event.respondWith((async()=>{
      const cached=await caches.match(req);
      const fresh=fetch(req).then(async res=>{
        if(res.ok){const cache=await caches.open(CACHE);cache.put(req,res.clone())}
        return res;
      }).catch(()=>null);
      return cached||(await fresh)||new Response('',{status:504,statusText:'Offline'});
    })());
  }
});
