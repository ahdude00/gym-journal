# -*- coding: utf-8 -*-
"""Dataset'te kendi kaydi olmayan iki hareket icin (duz on kol plank ve pike
sinav) GIF ve kucuk resim uretir.

Cizim uretmiyoruz: dataset'te bu pozlari ICINDE barindiran hareketler var,
onlarin dogru karelerini aliyoruz. Boylece gorseller diger 1324 hareketle
birebir ayni uslupta kaliyor.

  c001  duz on kol plank
        kaynak: 0464 "front plank with twist" - kare 0
        (bu hareketin baslangic pozu tam bir on kol plank'i; burulma yok,
         sirtta plaka yok. 2135 "weighted front plank" plakali oldugu icin
         kullanilmadi.)

  c002  pike sinav
        kaynak: 3662 "pike-to-cobra push-up" - kare 0 ve 6
        (hareketin ilk yarisi tam bir pike sinav: kare 0 kollar acik,
         kare 6 bas ellerin arasina inmis. Aradaki kareler bu seride
         hareket izi/hayalet tasidigi icin alinmadi - dataset'in geri
         kalaninda o iz yok, tutarsiz dururdu.)

Medya (c) Gym visual - https://gymvisual.com/ ; bkz. NOTICE.md
Bu dosyalar dataset medyasindan turetilmistir, atif aynen gecerlidir.
"""
import os
from PIL import Image

KOK = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
KAYNAK = os.path.join(KOK, 'videos')

URETIM = {
    "c001": {
        "ad": "front plank",
        "kaynak": "0464",
        "kareler": [0],          # izometrik duruş: tek kare
        "sure": 1000,
        "kapak": 0,
    },
    "c002": {
        "ad": "pike push-up",
        "kaynak": "3662",
        "kareler": [0, 6],       # kollar acik -> bas asagida
        "sure": [850, 650],
        "kapak": 0,
    },
}


def kaynak_yolu(onek):
    for ad in sorted(os.listdir(KAYNAK)):
        if ad.startswith(onek + "-") and ad.endswith(".gif"):
            return os.path.join(KAYNAK, ad)
    raise SystemExit("kaynak GIF bulunamadi: " + onek)


def kare_al(yol, idx):
    im = Image.open(yol)
    im.seek(idx)
    k = im.convert("RGB")
    if k.size != (180, 180):
        k = k.resize((180, 180), Image.LANCZOS)
    return k


def uret(eid, t):
    yol = kaynak_yolu(t["kaynak"])
    kareler = [kare_al(yol, i) for i in t["kareler"]]
    pal = [k.convert("P", palette=Image.ADAPTIVE, colors=128) for k in kareler]

    gif = os.path.join(KOK, "videos", "%s-custom.gif" % eid)
    pal[0].save(gif, save_all=True, append_images=pal[1:],
                duration=t["sure"], loop=0, optimize=True, disposal=2)

    jpg = os.path.join(KOK, "images", "%s-custom.jpg" % eid)
    kare_al(yol, t["kapak"]).save(jpg, "JPEG", quality=92)

    print("  %-14s %s  kaynak %s kare %s" %
          (eid, t["ad"], os.path.basename(yol), t["kareler"]))
    print("     %s  %d bayt" % (os.path.basename(gif), os.path.getsize(gif)))
    print("     %s  %d bayt" % (os.path.basename(jpg), os.path.getsize(jpg)))


print("ozel hareket gorselleri uretiliyor:")
for eid, t in URETIM.items():
    uret(eid, t)
