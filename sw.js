// sw.js —— 极简离线缓存（运行时缓存所有同源资源，零依赖）
const CACHE = 'wordtower-v1'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return
  e.respondWith(
    caches.match(e.request).then((hit) => {
      const fetched = fetch(e.request).then((resp) => {
        if (resp.ok) caches.open(CACHE).then(c => c.put(e.request, resp.clone()))
        return resp
      }).catch(() => hit)
      return hit || fetched
    }),
  )
})
