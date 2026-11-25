from PIL import Image
import numpy as np
from scipy import ndimage
import json

a = np.array(Image.open('hi/t0.6.png').convert('RGB')).astype(np.float32)
H,W,_ = a.shape
R,G,B = a[:,:,0],a[:,:,1],a[:,:,2]
lum = 0.299*R+0.587*G+0.114*B
mx=a.max(axis=2); mn=a.min(axis=2); sat=(mx-mn)/np.maximum(mx,1)

# 紫色发光（光环/文字/装饰）
purple = (B>R+25)&(lum>60)
# 金色
gold = (R>120)&(G>90)&(B<R-40)

# ---- 拟合光环圆：取紫色掩码里"环"的部分（排除左侧文字块）
ring = purple.copy()
ring[:, :int(W*0.30)] = False        # 去掉文字
ring[int(H*0.60):, :] = False
# 只保留细边（骨架）：环是细线，文字是粗块
from scipy.ndimage import binary_erosion
thin = ring & ~binary_erosion(ring, np.ones((9,9)))
ys,xs = np.nonzero(thin)
print('thin ring px', len(ys))
# 用最小二乘拟合（只用上半弧，避开人物遮挡）
up = ys < H*0.55
if up.sum()>50:
    px,py = xs[up], ys[up]
    A=np.c_[2*px,2*py,np.ones(len(px))]
    b=px**2+py**2
    sol,*_=np.linalg.lstsq(A,b,rcond=None)
    cx,cy=sol[0],sol[1]; rad=np.sqrt(sol[2]+cx*cx+cy*cy)
    res=np.abs(np.hypot(px-cx,py-cy)-rad)
    print('ring fit: cx=%.3f cy=%.3f r=%.3f  resid mean %.1f px'%(cx/W,cy/H,rad/W,res.mean()))
    ringinfo=dict(cx=cx/W,cy=cy/H,r=rad/W)
else:
    ringinfo=None

# ---- 人物剪影：暗且低饱和，在右半区
body = (lum<32)&(sat<0.45)
body[:, :int(W*0.28)] = False
body = ndimage.binary_closing(body, np.ones((5,5)))
body = ndimage.binary_opening(body, np.ones((3,3)))
lab,n = ndimage.label(body)
if n:
    sizes = ndimage.sum(body,lab,range(1,n+1))
    body = ndimage.binary_fill_holes(lab==(np.argmax(sizes)+1))
    ys,xs=np.nonzero(body)
    print('body area %.1f%%  bbox x %.1f-%.1f%% y %.1f-%.1f%%'%(body.mean()*100,
        xs.min()/W*100,xs.max()/W*100,ys.min()/H*100,ys.max()/H*100))
    Image.fromarray((body*255).astype(np.uint8)).save('body.png')

# ---- 文字块：左侧紫色连通区
txt = purple.copy(); txt[:, int(W*0.42):]=False
lab,n=ndimage.label(txt)
sizes=ndimage.sum(txt,lab,range(1,n+1))
print('--- 左侧紫色文字块 ---')
for i in np.argsort(sizes)[::-1][:8]:
    ys,xs=np.nonzero(lab==i+1)
    print('  size %6d  x %.1f-%.1f%%  y %.1f-%.1f%%'%(sizes[i],xs.min()/W*100,xs.max()/W*100,ys.min()/H*100,ys.max()/H*100))

json.dump(dict(size=[W,H],ring=ringinfo), open('an.json','w'), indent=1)
np.save('purple.npy',purple); np.save('gold.npy',gold); np.save('lum.npy',lum)
