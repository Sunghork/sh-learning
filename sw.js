/* Offline support for the French reader. Book PDFs are cached by the page itself. */
const SHELL='fr-shell-v1';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(SHELL).then(c=>Promise.all(ASSETS.map(a=>c.add(a).catch(()=>{})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('fr-shell-')&&k!==SHELL).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET')return;
  if(u.origin===location.origin&&/\.pdf$/i.test(u.pathname))return;            // books: handled by the page
  if(u.hostname==='cdnjs.cloudflare.com'){                                     // libraries: cache first
    e.respondWith(caches.match(r).then(h=>h||fetch(r).then(n=>{const c=n.clone();caches.open(SHELL).then(x=>x.put(r,c));return n})));
    return;
  }
  if(u.origin===location.origin){                                             // app files: fresh when online, cached when offline
    e.respondWith(fetch(r).then(n=>{if(n.ok){const c=n.clone();caches.open(SHELL).then(x=>x.put(r,c))}return n})
      .catch(()=>caches.match(r,{ignoreSearch:true}).then(h=>h||caches.match('./index.html'))));
  }
});
