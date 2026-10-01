const CACHE_NAME = "jc-imports-3.4.0-pedidos-vendas-pessoais";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/style.css?v=3.2.2",
  "./css/dashboard.css?v=3.2.2",
  "./css/responsive.css?v=3.2.2",
  "./JS/app.js?v=3.4.0",
  "./JS/storage.js",
  "./JS/financeiro.js",
  "./JS/vendas.js",
  "./JS/produtos.js",
  "./JS/compras.js",
  "./JS/clientes.js",
  "./JS/vendas-pessoais.js?v=1.0.2",
  "./JS/receber.js?v=3.2.2",
  "./JS/despesas.js",
  "./JS/relatorios.js",
  "./JS/backup.js",
  "./JS/recibo.js",
  "./JS/nuvem.js?v=3.4.0",
  "./images/icon.png",
  "./images/logo-completa.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if(request.method !== "GET") return;

  const url = new URL(request.url);
  if(url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request).then(response => {
        if(response && response.ok){
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      }).catch(() => cached || caches.match("./index.html"));

      return cached || network;
    })
  );
});
