/* NozzoLeague 2027: online-first. Non memorizza né modifica i risultati. */
const VERSION = '20261104-new-repository-2027-v1';
const CACHE = 'nozzoleague-static-' + VERSION;
const CORE = ['./', './index.html', './manifest.json'];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.allSettled(CORE.map(url => cache.add(new Request(url, {cache:'reload'}))));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('nozzoleague-static-') && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(url.origin !== self.location.origin) return;
  if(req.mode === 'navigate' || url.pathname.endsWith('/index.html')) {
    event.respondWith((async () => {
      try {
        const response = await fetch(new Request(req, {cache:'no-store'}));
        if(response.ok){const cache=await caches.open(CACHE);await cache.put('./index.html',response.clone());}
        return response;
      } catch(error){
        const cached = await caches.match('./index.html');
        if(cached) return cached;
        throw error;
      }
    })());
    return;
  }
  // Assets online-first: updated files are not pinned to old iPhone caches.
  event.respondWith((async () => {
    try {
      const response=await fetch(new Request(req,{cache:'no-store'}));
      if(response.ok && response.type === 'basic'){
        const cache=await caches.open(CACHE);
        await cache.put(req,response.clone());
      }
      return response;
    }catch(error){
      const cached=await caches.match(req);
      if(cached)return cached;
      throw error;
    }
  })());
});
