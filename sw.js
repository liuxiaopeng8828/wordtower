// sw.js —— 离线缓存（HTML network-first 保更新，带 hash 的静态资源 cache-first）
// 部署新版本时把 CACHE 版本号 +1（如 v2 → v3），activate 会自动清理旧缓存
const CACHE = 'wordtower-v2'

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
  const isHTML = e.request.destination === 'document' || e.request.url.endsWith('/')
  e.respondWith(
    // HTML：网络优先（保证拿到新版本），断网回退缓存
    isHTML
      ? fetch(e.request).then((resp) => {
          const copy = resp.clone()
          caches.open(CACHE).then(c => c.put(e.request, copy))
          return resp
        }).catch(() => caches.match(e.request))
      // 静态资源（文件名带 hash，内容变名字变）：缓存优先
      : caches.match(e.request).then((hit) => {
          const fetched = fetch(e.request).then((resp) => {
            if (resp.ok) caches.open(CACHE).then(c => c.put(e.request, resp.clone()))
            return resp
          }).catch(() => hit)
          return hit || fetched
        }),
  )
})
