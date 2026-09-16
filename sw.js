const CACHE='srgu-shell-v4';
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
  '/seo.css',
  '/legal.css',
  '/about.html',
  '/contact.html',
  '/privacy.html',
  '/terms.html',
  '/app.js',
  '/ux-2026.js',
  '/stage2.js',
  '/stage2-guard.js',
  '/stage3.js',
  '/stage4.js',
  '/stage5.js',
  '/pwa.js',
  '/adsense-config.js',
  '/stage7.js',
  '/manifest.webmanifest',
  '/srgu-icon.svg',
  '/og-card.svg'
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
        caches.open(CACHE).then(cache=>cache.put(url.pathname==='/'?'/':url.pathname,copy));
        return res;
      }).catch(()=>caches.match(url.pathname).then(r=>r||caches.match('/')))
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
