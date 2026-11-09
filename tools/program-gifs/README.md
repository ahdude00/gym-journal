# Program hareketleri için animasyon üreticisi

Antrenman programında olup dataset'te karşılığı bulunmayan hareketlerin
GIF/JPEG medyasını üretir. Görünüm, dataset illüstrasyonlarına yakın tutuldu:
beyaz zemin, açık gri anatomik figür, siyah şort, kırmızı hedef kaslar,
180×180 boyut ve 12 karelik ritim (iki uç pozda 1 sn bekleme). Üretim tamamen
yereldir; görsel üreten bir servise istek gönderilmez ve dataset medyası
kullanılmaz.

| id | hareket | vurgulanan kaslar |
|------|---------|-------------------|
| c003 | kedi-deve | karın, bel kasları |
| c004 | duvarda kol kaydırma | omuz, trapez |
| c005 | sırtüstü çene içeri çekme | boyun önü |
| c006 | evde hafif ısınma (yerinde yürüyüş) | — |
| c008 | yan yatışta open book | sağ göğüs ve ön omuz |
| c009 | kapı eşiğinde göğüs esnetme | sağ göğüs ve ön omuz |
| c010 | rahat yürüyüş | — |
| c013 | yüzüstü Y-T-W kaldırış | üst sırt, trapez, arka omuz |
| c014 | duvara izometrik yan kaldırış | sol omuz |
| c015 | kapı kasası biceps curl | sol biceps |
| c017 | tek bacak Romen deadlift | sağ arka bacak, bel kasları |
| c019 | havluyla izometrik çekiç curl | biceps |

## Nasıl çalışır

- `body.js`: Figür, kas gruplarını temsil eden elipsoitlerden kurulur. Hepsi
  yumuşak birleşimle (smooth-min) tek bir mesafe alanında toplanır ve Surface
  Nets ile tek parça, pürüzsüz bir yüzeye çevrilir. Kas araları oyuk kalır;
  köşe başına hesaplanan ortam gölgesi bunları koyulaştırır. Dış hatta ters
  yüzlü bir kabukla ince kontur çizilir.
- `poses.js`: Her hareket 0–1 arası bir fazdan eklem noktalarını hesaplar.
- `scene.html`: Işık, kamera, sahne nesneleri (duvar, kapı kasası, yastık, havlu) ve
  hangi kasların kırmızı olacağı. Kamera, hareketin bütün karelerini kapsar.
- `render.cjs`: Kareleri yerel tarayıcıda 540×540 çizer; `pack.py` onları
  180×180'e küçültür, ortak paletle GIF'e çevirir ve ilk kareyi JPEG yapar.

## Yeniden üretme

Node.js, Playwright + Microsoft Edge, Python, Pillow ve NumPy gerekir.
Three.js `vendor/` altında MIT lisansıyla gelir.

```powershell
npm install --prefix "$env:TEMP/gym-journal-qa" playwright
$env:NODE_PATH="$env:TEMP/gym-journal-qa/node_modules"
python -m pip install Pillow numpy
node tools/program-gifs/render.cjs            # hepsi
node tools/program-gifs/render.cjs c003 c009  # yalnızca seçilenler
```

Çıktılar `videos/{id}-anim-v2.gif` ve `images/{id}-anim-v2.jpg`. İnceleme için
540 px kareler ve bir kontak sayfası, komutun yazdırdığı geçici klasörde kalır.
Bir görseli değiştirirsen dosya adındaki sürümü (`anim-v2`) artır: medya
önbelleği "önce cache" çalıştığı için aynı adla eski görsel telefonda kalır.

Kırmızı vurgu şematiktir; kas aktivitesinin ölçümü değildir.
