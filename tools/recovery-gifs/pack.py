"""Pack renderer frames into the project's 180×180 GIF/JPEG format."""
import sys
from pathlib import Path
from PIL import Image
folder,gif,thumb=map(Path,sys.argv[1:])
frames=[Image.open(f).convert('RGB').resize((180,180),Image.Resampling.LANCZOS) for f in sorted(folder.glob('*.png'))]
palette=Image.new('RGB',(180*4,180),'white')
for j,i in enumerate((0,12,24,36)):palette.paste(frames[i],(j*180,0))
palette=palette.quantize(colors=128)
indexed=[f.quantize(palette=palette,dither=Image.Dither.NONE) for f in frames]
indexed[0].save(gif,save_all=True,append_images=indexed[1:],duration=80,loop=0,disposal=2,optimize=False)
frames[0].save(thumb,'JPEG',quality=95)
sheet=Image.new('RGB',(180*4,180),'white')
for j,i in enumerate((0,12,24,36)):sheet.paste(frames[i],(j*180,0))
sheet.save(folder/'contact.jpg',quality=95)
