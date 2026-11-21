/* Bộ nhớ đệm cho bản điện thoại: giữ sẵn giao diện (1 trang + 2 ảnh, ma.json khi có) để lần sau mở là hiện ngay, kể cả khi mạng yếu.
 * KHÔNG giữ dữ liệu: mọi lượt gọi tới GitHub / nguồn giá luôn đi thẳng ra mạng. Đổi V khi sửa giao diện để điện thoại lấy bản mới. */
const V = 'qm-v24', SHELL = ['./', 'index.html', 'emilya.webp', 'app-192.png', 'manifest.webmanifest'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;          // dữ liệu: không đụng tới
  const page = e.request.mode === 'navigate' || /\/(index\.html)?$/.test(u.pathname) || u.pathname.endsWith('sw.js');
  if (page) {                                                                       // trang chính: luôn lấy bản mới trên mạng trước, mất mạng mới dùng bản lưu
    e.respondWith(caches.open(V).then(c => fetch(e.request, { cache: 'no-store' }).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; })
      .catch(() => c.match(e.request, { ignoreSearch: true }).then(h => h || c.match('index.html')))));
    return;
  }
  e.respondWith(caches.open(V).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net;                                                              // có sẵn thì trả ngay, đồng thời lấy bản mới cho lần sau
  }));
});
