/* Only the public offline page is cached. Customer data stays network-only. */
'use strict';
const CACHE = 'marinequo-offline-v1';
const OFFLINE = '/marinequo-offline.html';
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.add(OFFLINE)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith('marinequo-offline-') && key !== CACHE)
      .map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || event.request.mode !== 'navigate' ||
      url.origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).catch(async () =>
    (await caches.match(OFFLINE)) || new Response('Please reconnect to use MARINE QUO.',
      {status: 503, headers: {'Content-Type': 'text/plain; charset=utf-8'}})
  ));
});
