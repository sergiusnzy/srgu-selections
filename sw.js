const CACHE='srgu-shell-v1';
const SHELL=[
  '/',
  '/index.html',
  '/styles.css',
  '/stage2.css',
  '/stage3.css',
  '/stage4.css',
  '/stage5.css',
  '/app.js',
  '/ux-2026.js',
  '/stage2.js',
  '/stage2-guard.js',
  '/stage3.js',
  '/stage4.js',
  '/stage5.js',
  '/pwa.js',
  '/manifest.webmanifest',
  '/srgu-icon.svg'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);

  if(url.origin!==self.location.origin) return;
  if(url.pathname.startsWith('/api/')) return;

  if(req.mode==='navigate'){
    event.respondWith(
      fetch(req).then(res=>{
        const copy=res.clone();
        caches.open(CACHE).then(cache=>cache.put('/',copy));
        return res;
      }).catch(()=>caches.match('/'))
    );
    return;
  }

  if(/\.(?:css|js|svg|webmanifest)$/.test(url.pathname)){
    event.respondWith(
      caches.match(req).then(cached=>{
        const fresh=fetch(req).then(res=>{
          const copy=res.clone();
          caches.open(CACHE).then(cache=>cache.put(req,copy));
          return res;
        }).catch(()=>cached);
        return cached||fresh;
      })
    );
  }
});
