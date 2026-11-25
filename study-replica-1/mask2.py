from PIL import Image
import numpy as np
from scipy import ndimage

im = Image.open('ref.png').convert('RGB')
a = np.array(im).astype(np.float32)
H, W, _ = a.shape
R,G,B = a[:,:,0],a[:,:,1],a[:,:,2]
lum = 0.299*R + 0.587*G + 0.114*B
mx = a.max(axis=2); mn = a.min(axis=2)
sat = np.where(mx>0, (mx-mn)/np.maximum(mx,1), 0)

# 人物 = 暗 + 低饱和（火是高饱和暖色）
darkness = np.clip(1 - lum/95.0, 0, 1)
notfire = np.clip(1 - sat/0.55, 0, 1)
score = darkness * (0.35 + 0.65*notfire)

# 只看中上部（人物所在）
m = score > 0.45
m[int(H*0.80):,:] = False
m = ndimage.binary_closing(m, np.ones((5,5)))
m = ndimage.binary_opening(m, np.ones((3,3)))
lab,n = ndimage.label(m)
sizes = ndimage.sum(m, lab, range(1,n+1))
big = (lab == (np.argmax(sizes)+1))
big = ndimage.binary_fill_holes(big)
big = ndimage.binary_closing(big, np.ones((7,7)))
print('person area %.1f%%'%(big.mean()*100))
ys,xs = np.nonzero(big)
print('bbox x %.1f-%.1f%%  y %.1f-%.1f%%'%(xs.min()/W*100,xs.max()/W*100,ys.min()/H*100,ys.max()/H*100))
np.save('person2.npy', big)
Image.fromarray((big*255).astype(np.uint8)).save('mask-person2.png')
