/* Uygulama kabugu (index.html, veri dosyasi, ikonlar): once agdan denenir,
   basarisiz olursa cache'ten. Boylece guncelleme yayinladiginda kullanici
   eski surumde takili kalmaz, internet yokken de acilir.

   Hareket medyasi (images/, videos/ - toplam ~139 MB): once cache'ten.
   Onden yuklenmez, sadece acilan hareketin gorseli cache'e dusser. */
/* Kabuk surumu her index.html/data degisiminde artirilmali: install yeni
   ASSETS'i bastan indirir, activate eski cache'i siler. Aksi halde sunucu
   kapaliyken (ya da internet yokken) onceAg cache'e duser ve kullanici
   eski surumu gorur — guncelleme yapilmamis gibi. */
const CORE  = 'salon-defteri-v5';   // v5: eliptik isinma, c003-c005 cizimleri
const MEDYA = 'salon-defteri-medya-v2';   // c001/c002 gorselleri degisti
const MEDYA_TAVAN = 600;   // bu sayiyi asinca en eski kayitlar atilir

const ASSETS = [
  './', './index.html', './manifest.json', './data/exercises.js', './data/custom.js',
  './icon-192.png', './icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CORE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CORE && k !== MEDYA).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function medyaMi(url){
  return /\/(images|videos)\/[^/]+\.(jpg|gif)$/i.test(url.pathname);
}

async function budaGerekirse(cache){
  const keys = await cache.keys();
  if (keys.length <= MEDYA_TAVAN) return;
  // en eski eklenenler listenin basinda
  await Promise.all(keys.slice(0, keys.length - MEDYA_TAVAN).map(k => cache.delete(k)));
}

/* medya: cache varsa onu ver, yoksa indir ve sakla */
async function onceCache(request){
  const cache = await caches.open(MEDYA);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res && res.ok) {
    await cache.put(request, res.clone());
    budaGerekirse(cache);
  }
  return res;
}

/* kabuk: once agdan al ve tazele, ag yoksa cache'e dus */
async function onceAg(request){
  const cache = await caches.open(CORE);
  try {
    const res = await fetch(request);
    if (res && res.ok) await cache.put(request, res.clone());
    return res;
  } catch (e) {
    const hit = await cache.match(request);
    if (hit) return hit;
    throw e;
  }
}

/* Bildirime dokununca uygulamayi one getir, acik degilse ac. */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) { if ('focus' in c) return c.focus(); }
      if (self.clients.openWindow) return self.clients.openWindow('./index.html');
    })
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    (medyaMi(url) ? onceCache(e.request) : onceAg(e.request))
      .catch(() => e.request.mode === 'navigate'
        ? caches.match('./index.html')
        : Response.error())
  );
});
