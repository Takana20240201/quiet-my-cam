// 静音カメラ Service Worker
// 方式: キャッシュ優先 + 裏で更新版を取得(次回起動で反映)
const CACHE = "quiet-cam-v1";
const ASSETS = ["./", "./index.html", "./manifest.json", "./icon.png"];

// インストール時に全ファイルをキャッシュ
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

// 古いバージョンのキャッシュを掃除
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// キャッシュがあれば即返し、裏でネットから最新を取ってキャッシュを更新
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const update = fetch(e.request)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => cached); // 圏外ならキャッシュのみ
      return cached || update;
    })
  );
});
