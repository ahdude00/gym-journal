# -*- coding: utf-8 -*-
"""Dataset'te HIC karsiligi olmayan uc durus hareketi icin figur cizer.

tools/ozel-gif-uret.py kare cikariyor: c001/c002'nin pozlari dataset'teki
baska hareketlerin GIF'lerinin ICINDE vardi. Bu ucunde oyle bir kaynak yok
- dataset 1324 hareket hem isim hem Turkce adim metniyle tarandi: kedi-deve,
duvarda kol kaydirma ve cene iceri cekme gecmiyor, boyun bolgesinde yalnizca
iki yana esnetme var. Benzemeyen bir hareketin karesini koymak yaniltici
olurdu, bu yuzden figurler burada sifirdan ciziliyor.

DIKKAT: c003/c004/c005 dataset medyasindan turetilmemistir; Gym visual
atifi bu uc dosya icin GECERLI DEGILDIR (bkz. NOTICE.md).

Cizim yontemi: dolgu silueti (uctan uca incelen kapsul uzuvlar), 4x
super-ornekleme ile kenarlar yumusatilir, cikti dataset ile ayni
180x180 beyaz zemin.
"""
import os, math
from PIL import Image, ImageDraw

KOK = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
BOY, SS = 180, 4                      # cizim BOY*SS'te yapilir, sonra kuculur
Z = BOY * SS

ZEMIN = (255, 255, 255)
TEN   = (108, 122, 138)               # govde
KOYU  = (58,  70,  84)                # sac ve sort
VURGU = (224, 163, 46)                # hareket yonu oku
YER   = (206, 214, 222)
GOLGE = (235, 239, 242)


def yeni():
    im = Image.new("RGB", (Z, Z), ZEMIN)
    return im, ImageDraw.Draw(im)


def s(v):
    """180'lik koordinati cizim olcegine tasir."""
    return v * SS


def ara(a, b, t):
    return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)


def uzuv(d, p1, p2, r1, r2, renk=TEN):
    """Uctan uca incelen yuvarlak uzuv: ust kol, uyluk, govde dilimi..."""
    dx, dy = p2[0] - p1[0], p2[1] - p1[1]
    uzunluk = math.hypot(dx, dy) or 1e-6
    nx, ny = -dy / uzunluk, dx / uzunluk
    d.polygon([(p1[0] + nx * r1, p1[1] + ny * r1),
               (p2[0] + nx * r2, p2[1] + ny * r2),
               (p2[0] - nx * r2, p2[1] - ny * r2),
               (p1[0] - nx * r1, p1[1] - ny * r1)], fill=renk)
    for p, r in ((p1, r1), (p2, r2)):
        d.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=renk)


def zincir(d, noktalar, yaricaplar, renk=TEN):
    for i in range(len(noktalar) - 1):
        uzuv(d, noktalar[i], noktalar[i + 1], yaricaplar[i], yaricaplar[i + 1], renk)


def bezier(p0, pc, p1, n=16):
    return [((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * pc[0] + t * t * p1[0],
             (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * pc[1] + t * t * p1[1])
            for t in (i / n for i in range(n + 1))]


def profil_bas(d, m, r, aci):
    """Yandan bas: kafatasi + burun + cene + sac. aci = yuzun baktigi yon."""
    cx, cy = m
    ix, iy = math.cos(aci), math.sin(aci)          # ileri (yuz yonu)
    ax, ay = -iy, ix                               # cene yonu (ileriden 90 saga)
    d.ellipse([cx - r, cy - r * 1.03, cx + r, cy + r * 1.03], fill=TEN)
    cene = (cx + ix * r * 0.50 + ax * r * 0.74, cy + iy * r * 0.50 + ay * r * 0.74)
    uzuv(d, (cx + ax * r * 0.28, cy + ay * r * 0.28), cene, r * 0.76, r * 0.34)
    burun = (cx + ix * r * 1.02 + ax * r * 0.12, cy + iy * r * 1.02 + ay * r * 0.12)
    uzuv(d, (cx + ix * r * 0.60, cy + iy * r * 0.60), burun, r * 0.44, r * 0.17)
    # sac: kafanin arka yarisini ortuyor
    geri = (cx - ix * r * 0.26, cy - iy * r * 0.26)
    d.ellipse([geri[0] - r * 0.98, geri[1] - r * 0.98,
               geri[0] + r * 0.98, geri[1] + r * 0.98], fill=KOYU)
    yuz = (cx + ix * r * 0.16 + ax * r * 0.20, cy + iy * r * 0.16 + ay * r * 0.20)
    d.ellipse([yuz[0] - r * 0.82, yuz[1] - r * 0.82,
               yuz[0] + r * 0.82, yuz[1] + r * 0.82], fill=TEN)


def on_bas(d, m, r):
    """Onden bas: yuz ovali + sac."""
    cx, cy = m
    d.ellipse([cx - r * 0.96, cy - r * 1.12, cx + r * 0.96, cy + r * 1.02], fill=KOYU)
    d.ellipse([cx - r * 0.80, cy - r * 0.70, cx + r * 0.80, cy + r * 1.04], fill=TEN)


def ok_yayi(d, merkez, yaricap, bas_aci, son_aci, kalin, renk=VURGU):
    """Hareketin yonunu gosteren ince yay, ucunda ok."""
    n = 26
    pts = [(merkez[0] + yaricap * math.cos(bas_aci + (son_aci - bas_aci) * i / n),
            merkez[1] + yaricap * math.sin(bas_aci + (son_aci - bas_aci) * i / n))
           for i in range(n + 1)]
    d.line(pts, fill=renk, width=int(kalin), joint="curve")
    uc, onceki = pts[-1], pts[-3]
    a = math.atan2(uc[1] - onceki[1], uc[0] - onceki[0])
    b = kalin * 2.4
    d.polygon([uc,
               (uc[0] - b * math.cos(a - 0.45), uc[1] - b * math.sin(a - 0.45)),
               (uc[0] - b * math.cos(a + 0.45), uc[1] - b * math.sin(a + 0.45))], fill=renk)


def ok_duz(d, p1, p2, kalin, renk=VURGU):
    """Duz hareket oku: elin/basin gittigi yon."""
    d.line([p1, p2], fill=renk, width=int(kalin))
    a = math.atan2(p2[1] - p1[1], p2[0] - p1[0])
    b = kalin * 2.6
    d.polygon([p2,
               (p2[0] - b * math.cos(a - 0.44), p2[1] - b * math.sin(a - 0.44)),
               (p2[0] - b * math.cos(a + 0.44), p2[1] - b * math.sin(a + 0.44))], fill=renk)


def bitir(im):
    return im.resize((BOY, BOY), Image.LANCZOS)


# ---------------------------------------------------------------- c003
def kedi_deve(t):
    """t=+1 kedi (sirt yukari, cene gogse), t=-1 deve (sirt cukur, bas yukari)."""
    im, d = yeni()
    d.ellipse([s(50), s(148), s(146), s(159)], fill=GOLGE)           # yer golgesi
    d.rectangle([s(12), s(155), s(168), s(158)], fill=YER)           # yer

    omuz, kalca = (s(68), s(92)), (s(124), s(96))
    uzuv(d, (s(124), s(152)), (s(152), s(152)), s(7), s(5.5))        # ayak/baldir
    uzuv(d, kalca, (s(124), s(150)), s(13), s(7.5))                  # uyluk
    govde = bezier(omuz, (s(96), s(94) - s(31) * t), kalca)
    zincir(d, govde, [s(16), s(16.5), s(16.5), s(16), s(15.5), s(15), s(14.5),
                      s(14), s(13.5), s(13.5), s(14), s(14.5), s(15), s(15.5),
                      s(16), s(16.5), s(17)], TEN)
    uzuv(d, kalca, (s(128), s(104)), s(14), s(12), KOYU)             # sort
    uzuv(d, (s(128), s(104)), (s(126), s(122)), s(12), s(9.5), KOYU)
    uzuv(d, omuz, (s(66), s(150)), s(12), s(6.5))                    # kol

    u = (1 - t) / 2                                                  # t=+1 -> 0 (bas asagi)
    bm = ara((s(48), s(116)), (s(42), s(80)), u)
    uzuv(d, omuz, bm, s(11.5), s(9))                                 # boyun
    profil_bas(d, bm, s(15.5), math.radians(120 - 96 * u))

    ok_yayi(d, (s(96), s(98)), s(44), math.radians(-120), math.radians(-60), s(2.4))
    return bitir(im)


# ---------------------------------------------------------------- c004
def duvar_kaydirma(t):
    """t=0 'W' kol, t=1 'Y' kol. Onden gorunus, sirt duvarda."""
    im, d = yeni()
    d.rectangle([s(9), s(7), s(171), s(171)], fill=(247, 249, 251))  # duvar
    for x in range(21, 172, 19):                                     # duvar derzleri
        d.rectangle([s(x), s(7), s(x) + SS, s(171)], fill=(232, 237, 241))
    d.rectangle([s(9), s(162), s(171), s(166)], fill=YER)            # sup

    # Oranlar yaklasik 7 bas boyu: bas 20 px, toplam boy 140 px (y=22..162).
    d.ellipse([s(72), s(157), s(108), s(164)], fill=GOLGE)
    so, sa = (s(79), s(52)), (s(101), s(52))
    for hx, dx_, ax in ((s(84), s(81), s(80)), (s(96), s(99), s(100))):
        uzuv(d, (hx, s(92)), (dx_, s(124)), s(8), s(6))              # uyluk
        uzuv(d, (dx_, s(124)), (ax, s(154)), s(6), s(4.5))           # baldir
        uzuv(d, (ax, s(154)), (ax + s(3.5), s(159)), s(4.5), s(3.8))  # ayak
    uzuv(d, (s(84), s(88)), (s(83), s(104)), s(9), s(7.5), KOYU)     # sort - sol paca
    uzuv(d, (s(96), s(88)), (s(97), s(104)), s(9), s(7.5), KOYU)     # sort - sag paca
    uzuv(d, (s(84), s(87)), (s(96), s(87)), s(10), s(10), KOYU)      # sort - bel
    uzuv(d, (s(90), s(54)), (s(90), s(74)), s(13), s(9))             # gogus -> bel
    uzuv(d, (s(90), s(74)), (s(90), s(89)), s(9), s(10.5))           # bel -> kalca
    uzuv(d, so, sa, s(8.5), s(8.5))                                  # omuz hatti
    uzuv(d, (s(90), s(43)), (s(90), s(51)), s(4.5), s(6))            # boyun
    on_bas(d, (s(90), s(32)), s(10))

    dl = ara((s(59), s(62)), (s(54), s(40)), t)                      # dirsek W -> Y
    el = ara((s(65), s(38)), (s(41), s(14)), t)                      # el    W -> Y
    for o, ayna in ((so, False), (sa, True)):
        dd = (s(180) - dl[0], dl[1]) if ayna else dl
        ee = (s(180) - el[0], el[1]) if ayna else el
        uzuv(d, o, dd, s(7), s(5.2))                                 # ust kol
        uzuv(d, dd, ee, s(5.2), s(3.6))                              # on kol
    # Sag elin W'den Y'ye izledigi yol, koldan biraz disarida
    ok_duz(d, (s(126), s(40)), (s(150), s(16)), s(2.4))
    return bitir(im)


# ---------------------------------------------------------------- c005
def cene_cekme(t):
    """Yandan, sirtustu, dizler bukulu.
    t: 0 notr -> 0.6 cene iceri -> 1 bas yerden 2 cm kalkik.
    Kesikli dikey cizgi baslangictaki bas hizasi: cene ne kadar geri gitti gorunur."""
    im, d = yeni()
    d.rectangle([s(8), s(144), s(172), s(147)], fill=YER)
    d.ellipse([s(40), s(138), s(150), s(147)], fill=GOLGE)

    omuz, kalca = (s(92), s(130)), (s(126), s(133))
    uzuv(d, kalca, (s(146), s(102)), s(13), s(9.5))                  # uyluk
    uzuv(d, (s(146), s(102)), (s(158), s(142)), s(9.5), s(6.5))      # baldir
    uzuv(d, omuz, kalca, s(15.5), s(13))                             # govde
    uzuv(d, kalca, (s(136), s(128)), s(13), s(10.5), KOYU)           # sort
    uzuv(d, omuz, (s(116), s(140)), s(9), s(5.5))                    # kol

    cek = min(t / 0.6, 1.0)
    kalk = max((t - 0.6) / 0.4, 0.0)
    # bas govde cizgisinden biraz yukarida: boyun ince kalinca ikisi ayrilir
    bm = (s(54) + s(11) * cek, s(122) - s(14) * kalk)

    bx0 = s(54) - s(16)                                              # baslangic bas hizasi
    for y in range(52, 140, 9):
        d.rectangle([bx0, s(y), bx0 + s(1.6), s(y + 4.5)], fill=YER)

    uzuv(d, omuz, (bm[0] + s(10), bm[1] + s(4)), s(10), s(7.5))      # boyun (ince)
    profil_bas(d, bm, s(15), math.radians(-104 + 36 * cek))
    ok_yayi(d, (bm[0] - s(2), bm[1] - s(4)), s(30),
            math.radians(-152), math.radians(-96), s(2.6))
    return bitir(im)


def gidip_gel(fn, degerler, bekleme_ms, uc_bekleme_ms):
    kareler = [fn(v) for v in degerler]
    sureler = [bekleme_ms] * len(kareler)
    sureler[0] = sureler[-1] = uc_bekleme_ms
    geri = kareler[-2:0:-1]
    return kareler + geri, sureler + [bekleme_ms] * len(geri)


URETIM = {
    "c003": ("kedi-deve",
             lambda: gidip_gel(kedi_deve, [1 - 2 * i / 9 for i in range(10)], 110, 560)),
    "c004": ("duvarda kol kaydirma",
             lambda: gidip_gel(duvar_kaydirma, [i / 9 for i in range(10)], 110, 560)),
    "c005": ("cene iceri cekme",
             lambda: gidip_gel(cene_cekme, [i / 9 for i in range(10)], 120, 640)),
}

if __name__ == "__main__":
    print("figur gorselleri uretiliyor:")
    for eid, (ad, uret) in URETIM.items():
        kareler, sureler = uret()
        pal = [k.convert("P", palette=Image.ADAPTIVE, colors=96) for k in kareler]
        gif = os.path.join(KOK, "videos", "%s-custom.gif" % eid)
        pal[0].save(gif, save_all=True, append_images=pal[1:],
                    duration=sureler, loop=0, optimize=True, disposal=2)
        jpg = os.path.join(KOK, "images", "%s-custom.jpg" % eid)
        kareler[len(kareler) // 4].save(jpg, "JPEG", quality=93)
        print("  %-22s %2d kare  %s (%.1f KB)  %s (%.1f KB)"
              % (ad, len(kareler), os.path.basename(gif), os.path.getsize(gif) / 1024,
                 os.path.basename(jpg), os.path.getsize(jpg) / 1024))
