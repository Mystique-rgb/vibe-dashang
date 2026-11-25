from PIL import Image
import numpy as np
from scipy import ndimage
import json

a = np.array(Image.open('ref.png').convert('RGB')).astype(np.float32)
H,W,_ = a.shape
R,G,B = a[:,:,0],a[:,:,1],a[:,:,2]
lum = 0.299*R+0.587*G+0.114*B
m = np.array(Image.open('mask-person.png').convert('L'))>128
m = ndimage.binary_dilation(m, np.ones((9,9)))

# 人物内部/边缘的高亮发光（裂纹、边缘光）
inner = (lum > 130) & (R-B > 30)
inner = inner & m
print('glow pixels %.2f%% of image'%(inner.mean()*100))
Image.fromarray((inner*255).astype(np.uint8)).save('mask-glow.png')

# 边缘光：人物轮廓外侧的暖色亮线
edge = m & (~ndimage.binary_erosion(m, np.ones((11,11))))
edgeglow = edge & (lum>150) & (R-B>50)
print('edge glow %.2f%%'%(edgeglow.mean()*100))

# 眼睛光条：最亮的水平带
ys,xs = np.nonzero(lum>230)
if len(ys):
    print('brightest px count %d, y range %.1f-%.1f%%, x range %.1f-%.1f%%'%(
        len(ys), ys.min()/H*100, ys.max()/H*100, xs.min()/W*100, xs.max()/W*100))
    # 直方图找集中带
    hist,_ = np.histogram(ys, bins=20, range=(0,H))
    print('bright y hist:', hist)

# 火焰区域（高饱和暖色）
mx = a.max(axis=2); mn = a.min(axis=2)
sat = (mx-mn)/np.maximum(mx,1)
fire = (sat>0.6)&(R>120)&(R-B>60)&(lum>70)
print('fire %.1f%%'%(fire.mean()*100))
Image.fromarray((fire*255).astype(np.uint8)).save('mask-fire.png')

# 火焰亮度分布：分 4 圈（离黑洞中心距离）
cx,cy = 0.2622*W, 0.3085*H
Y,X = np.mgrid[0:H,0:W]
dist = np.hypot(X-cx, Y-cy)/(W*0.5)
for lo,hi in [(0,0.3),(0.3,0.5),(0.5,0.8),(0.8,1.5)]:
    sel = fire & (dist>=lo)&(dist<hi)
    if sel.sum(): print('  ring %.1f-%.1f: fire %.1f%% meanLum %.0f'%(lo,hi,sel.mean()*100, lum[sel].mean()))
