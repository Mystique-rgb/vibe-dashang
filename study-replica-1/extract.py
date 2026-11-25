from PIL import Image
import numpy as np
from scipy import ndimage
import json, sys

im = Image.open('ref.png').convert('RGB')
a = np.array(im).astype(np.float32)
H, W, _ = a.shape
lum = 0.299*a[:,:,0] + 0.587*a[:,:,1] + 0.114*a[:,:,2]
R, B = a[:,:,0], a[:,:,2]
warm = (R - B) > 45

# 暗部掩码：亮度低且不是暖色（火焰是暖色）
dark = (lum < 55) & (~warm)
dark = ndimage.binary_closing(dark, np.ones((3,3)))
dark = ndimage.binary_opening(dark, np.ones((3,3)))

lab, n = ndimage.label(dark)
sizes = ndimage.sum(dark, lab, range(1, n+1))
order = np.argsort(sizes)[::-1]

print("=== 连通区 ===")
info = []
for i in order[:8]:
    ys, xs = np.nonzero(lab == i+1)
    info.append(dict(label=int(i+1), size=int(sizes[i]),
                     x0=float(xs.min()/W*100), x1=float(xs.max()/W*100),
                     y0=float(ys.min()/H*100), y1=float(ys.max()/H*100),
                     cx=float(xs.mean()/W*100), cy=float(ys.mean()/H*100)))
    print(f"  #{i+1} size={int(sizes[i])} x {xs.min()/W*100:.1f}-{xs.max()/W*100:.1f}% "
          f"y {ys.min()/H*100:.1f}-{ys.max()/H*100:.1f}%")

json.dump(info, open('regions.json','w'), indent=1)
np.save('dark.npy', dark)
np.save('lum.npy', lum)
print("saved")
