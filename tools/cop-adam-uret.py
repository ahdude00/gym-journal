# -*- coding: utf-8 -*-
"""Dataset'te HIC karsiligi olmayan uc durus hareketi icin cizim uretir.

tools/ozel-gif-uret.py kare cikariyor: c001/c002'nin pozlari dataset'teki
baska hareketlerin GIF'lerinin ICINDE vardi, oradan alindi. Bu ucunde ise
oyle bir kaynak yok - dataset 1324 hareket tarandi (isim + Turkce adim
metni): kedi-deve, duvarda kol kaydirma ve cene iceri cekme gecmiyor,
boyun bolgesinde yalnizca iki yana esnetme var.

Benzemeyen bir hareketin karesini koymak yaniltici olurdu. Bunun yerine
hareketi dogru anlatan sade cop adam animasyonlari ciziliyor. Cizimler
tamamen burada uretiliyor; dataset medyasindan turetilmemistir, bu yuzden
Gym visual atifi bu uc dosya icin GECERLI DEGILDIR.

  c003  kedi-deve          omurga yuvarlanma <-> cukurlasma
  c004  duvarda kol kaydirma   kollar W -> Y
  c005  cene iceri cekme   cene geri kayar, sonra bas 2 cm kalkar

Cikti: videos/{id}-custom.gif ve images/{id}-custom.jpg (180x180, beyaz zemin)
"""
import os, math
from PIL import Image, ImageDraw

KOK = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
BOY = 180
ZEMIN = (255, 255, 255)
GOVDE = (58, 69, 80)       # koyu arduvaz - govde
VURGU = (224, 163, 46)     # pirinc - hareketin asil parcasi
SILIK = (203, 211, 218)    # yer/duvar cizgisi
KALIN, INCE = 5, 3


def yeni():
    im = Image.new('RGB', (BOY, BOY), ZEMIN)
    return im, ImageDraw.Draw(im)


def ç(d, p1, p2, renk=GOVDE, kalin=KALIN):
    d.line([p1, p2], fill=renk, width=kalin)
    for p in (p1, p2):                      # eklem yuvarlansin
        r = kalin / 2
        d.ellipse([p[0]-r, p[1]-r, p[0]+r, p[1]+r], fill=renk)


def egri(d, p0, pc, p1, renk=GOVDE, kalin=KALIN, n=22):
    """Kuadratik Bezier - omurga icin."""
    pts = []
    for i in range(n + 1):
        t = i / n
        x = (1-t)**2*p0[0] + 2*(1-t)*t*pc[0] + t**2*p1[0]
        y = (1-t)**2*p0[1] + 2*(1-t)*t*pc[1] + t**2*p1[1]
        pts.append((x, y))
    d.line(pts, fill=renk, width=kalin, joint='curve')


def bas(d, merkez, r=13, renk=GOVDE, yon=None):
    x, y = merkez
    d.ellipse([x-r, y-r, x+r, y+r], outline=renk, width=INCE)
    if yon is not None:                     # yuz yonu (burun)
        d.line([(x, y), (x + r*1.25*math.cos(yon), y + r*1.25*math.sin(yon))],
               fill=renk, width=INCE)


def ara(a, b, t):
    return (a[0] + (b[0]-a[0])*t, a[1] + (b[1]-a[1])*t)


# ---------------------------------------------------------------- c003
def kedi_deve(t):
    """t=+1 kedi (sirt yukari, cene gogse), t=-1 deve (sirt cukur, bas yukari)."""
    im, d = yeni()
    d.line([(18, 158), (162, 158)], fill=SILIK, width=INCE)      # yer

    el, diz = (62, 158), (126, 158)
    omuz, kalca = (62, 100), (126, 100)
    ç(d, el, omuz)                                                # kol
    ç(d, diz, kalca)                                              # uyluk
    ç(d, diz, (154, 158))                                         # baldir

    egri(d, omuz, (94, 100 - 30*t), kalca, VURGU, KALIN)          # omurga

    u = (1 - t) / 2                        # t=+1 -> 0 (bas asagi), t=-1 -> 1 (bas yukari)
    bm = ara((36, 122), (32, 84), u)
    ç(d, omuz, bm, GOVDE, INCE)                                   # boyun
    bas(d, bm, 13, GOVDE, math.radians(100 + 95*u))               # cene gogse -> ileri bak
    return im


# ---------------------------------------------------------------- c004
def duvar_kaydirma(t):
    """t=0 'W' kol, t=1 'Y' kol. Onden gorunus, arkada duvar."""
    im, d = yeni()
    d.rectangle([14, 10, 166, 168], outline=SILIK, width=INCE)     # duvar duzlemi
    for x in range(28, 166, 20):
        d.line([(x, 14), (x, 166)], fill=(236, 240, 243), width=2)
    d.line([(14, 168), (166, 168)], fill=SILIK, width=INCE)        # yer

    bas(d, (90, 40), 13)
    ç(d, (90, 53), (90, 62), GOVDE, INCE)                          # boyun
    so, sa = (68, 68), (112, 68)
    ç(d, so, sa)                                                   # omuz hatti
    ç(d, (90, 68), (90, 116))                                      # govde
    ç(d, (90, 116), (76, 166)); ç(d, (90, 116), (104, 166))        # bacaklar

    dW, dY = (50, 78), (44, 54)                                    # dirsek W->Y
    eW, eY = (58, 50), (34, 20)                                    # el   W->Y
    dl, el_ = ara(dW, dY, t), ara(eW, eY, t)
    dr = (BOY - dl[0], dl[1]); er = (BOY - el_[0], el_[1])
    for o, dd, ee in ((so, dl, el_), (sa, dr, er)):
        ç(d, o, dd, VURGU); ç(d, dd, ee, VURGU)
    return im


# ---------------------------------------------------------------- c005
def cene_cekme(t):
    """Yandan, sirtustu, dizler bukulu. t: 0 notr -> 0.6 cene iceri -> 1 bas kalkik.
    Kesikli dikey cizgi baslangictaki bas hizasi: cene ne kadar geri gitti gorunur."""
    im, d = yeni()
    d.line([(8, 152), (172, 152)], fill=SILIK, width=INCE)         # yer

    omuz, kalca = (80, 130), (122, 136)
    ç(d, omuz, kalca, GOVDE, KALIN + 3)                            # govde
    ç(d, kalca, (144, 104)); ç(d, (144, 104), (158, 152))          # bukulu bacak
    ç(d, omuz, (114, 146), GOVDE, INCE)                            # kol

    cek = min(t / 0.6, 1.0)
    kalk = max((t - 0.6) / 0.4, 0.0)
    r = 18
    bm = (46 + 10*cek, 118 - 14*kalk)

    bx0 = 46 - r                                                   # baslangic bas hizasi
    for y in range(64, 148, 8):
        d.line([(bx0, y), (bx0, y + 4)], fill=SILIK, width=2)

    ç(d, omuz, (bm[0] + r*0.6, bm[1] + r*0.45), VURGU, KALIN)      # boyun
    d.ellipse([bm[0]-r, bm[1]-r, bm[0]+r, bm[1]+r], outline=VURGU, width=KALIN-1)

    burun = math.radians(-112 + 38*cek)      # geriye yatik -> cene iceri
    bx = bm[0] + r*1.2*math.cos(burun); by = bm[1] + r*1.2*math.sin(burun)
    d.line([(bm[0], bm[1]), (bx, by)], fill=VURGU, width=KALIN-1)  # burun
    d.ellipse([bx-3, by-3, bx+3, by+3], fill=VURGU)

    ca = burun + math.radians(58)                                  # cene: burnun altinda
    d.line([(bm[0] + r*0.5*math.cos(ca), bm[1] + r*0.5*math.sin(ca)),
            (bm[0] + r*1.05*math.cos(ca), bm[1] + r*1.05*math.sin(ca))],
           fill=GOVDE, width=KALIN)

    if kalk > 0.15:                                                # yerden kalkti
        d.line([(bm[0], bm[1] + r + 2), (bm[0], 150)], fill=SILIK, width=2)
    return im


def gidip_gel(fn, degerler, bekleme_ms, uc_bekleme_ms):
    kareler = [fn(v) for v in degerler]
    sureler = [bekleme_ms] * len(kareler)
    sureler[0] = sureler[-1] = uc_bekleme_ms
    geri = kareler[-2:0:-1]
    return kareler + geri, sureler + [bekleme_ms] * len(geri)


URETIM = {
    "c003": ("kedi-deve", lambda: gidip_gel(
        kedi_deve, [1 - 2*i/9 for i in range(10)], 110, 520)),
    "c004": ("duvarda kol kaydirma", lambda: gidip_gel(
        duvar_kaydirma, [i/9 for i in range(10)], 110, 520)),
    "c005": ("cene iceri cekme", lambda: gidip_gel(
        cene_cekme, [i/9 for i in range(10)], 120, 620)),
}

print("cop adam gorselleri uretiliyor:")
for eid, (ad, uret) in URETIM.items():
    kareler, sureler = uret()
    pal = [k.convert('P', palette=Image.ADAPTIVE, colors=64) for k in kareler]
    gif = os.path.join(KOK, 'videos', '%s-custom.gif' % eid)
    pal[0].save(gif, save_all=True, append_images=pal[1:],
                duration=sureler, loop=0, optimize=True, disposal=2)
    jpg = os.path.join(KOK, 'images', '%s-custom.jpg' % eid)
    kareler[len(kareler)//4].save(jpg, 'JPEG', quality=92)
    print("  %-22s %2d kare  %s (%d B)  %s (%d B)"
          % (ad, len(kareler), os.path.basename(gif), os.path.getsize(gif),
             os.path.basename(jpg), os.path.getsize(jpg)))
