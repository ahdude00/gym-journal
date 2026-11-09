"""Kareleri projenin 180x180 GIF/JPEG biçimine paketler.
Kullanım: pack.py <kare klasörü> <gif> <jpg> <ms,ms,...>"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

folder, gif, thumb = map(Path, sys.argv[1:4])
durations = [int(x) for x in sys.argv[4].split(',')]
frames = [Image.open(f).convert('RGB').resize((180, 180), Image.Resampling.LANCZOS)
          .filter(ImageFilter.UnsharpMask(radius=1, percent=60, threshold=2))
          for f in sorted(folder.glob('*.png'))]
assert len(frames) == len(durations)
# Ortak palet: tüm kareler bir arada nicemlenir, kareler arasında renk kayması olmaz.
sheet = Image.new('RGB', (180 * len(frames), 180), 'white')
for i, f in enumerate(frames):
    sheet.paste(f, (i * 180, 0))
pal = np.array(sheet.quantize(colors=199, method=Image.Quantize.MEDIANCUT).getpalette()[:597]).reshape(-1, 3)
# Zemin dataset GIF'leri gibi saf beyaz kalsın; Pillow'un yaklaşık eşlemesi
# beyazı 252'ye kaydırdığı için en yakın renk burada tam hesaplanıyor.
pal = np.vstack([pal, [255, 255, 255]]).astype(np.int32)
flat = pal.reshape(-1).tolist() + [0] * (768 - pal.size)

def indexle(img):
    px = np.asarray(img, dtype=np.int32).reshape(-1, 1, 3)
    idx = ((px - pal[None]) ** 2).sum(-1).argmin(1).astype(np.uint8)
    out = Image.frombytes('P', img.size, idx.tobytes())
    out.putpalette(flat)
    return out

indexed = [indexle(f) for f in frames]
indexed[0].save(gif, save_all=True, append_images=indexed[1:], duration=durations, loop=0, disposal=2, optimize=False)
frames[0].save(thumb, 'JPEG', quality=95)
sheet.save(folder / 'contact.png')
