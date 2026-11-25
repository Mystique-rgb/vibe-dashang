from PIL import Image
import numpy as np
from scipy import ndimage
import json

a = np.array(Image.open('hi/t0.6.png').convert('RGB')).astype(np.float32)
H,W,_ = a.shape
R,G,B = a[:,:,0],a[:,:,1],a[:,:,2]
lum = 0.299*R+0.587*G+0.114*B
d = B-R

# 亮紫色 = 环/文字/装饰
bright = (lum > 60) & (d > 18)
bright[:, :int(W*0.44)] = False     # 排除左侧标题
bright[int(H*0.78):, :] = False

# 用距离变换找环：环是一个环形区域，其外边界近似圆
# 直接对"亮紫"掩码做外轮廓，取离质心最远的点集拟合
ys,xs = np.nonzero(bright)
print('bright purple px:', len(ys))

# 尝试：对每个角度扇区，取最远的亮紫点 → 得到外轮廓，再拟合圆
cx0, cy0 = xs.mean(), ys.mean()
ang = np.arctan2(ys-cy0, xs-cx0)
rad = np.hypot(xs-cx0, ys-cy0)
bins = ((ang+np.pi)/(2*np.pi)*180).astype(int)
outer = []
for b in range(180):
    sel = bins==b
    if sel.sum()>3:
        i = np.argmax(rad[sel])
        outer.append((xs[sel][i], ys[sel][i]))
outer = np.array(outer, float)
print('outer points:', len(outer))

A = np.c_[2*outer[:,0], 2*outer[:,1], np.ones(len(outer))]
bb = outer[:,0]**2 + outer[:,1]**2
sol,*_ = np.linalg.lstsq(A, bb, rcond=None)
cx,cy = sol[0],sol[1]; rr = np.sqrt(sol[2]+cx*cx+cy*cy)
res = np.abs(np.hypot(outer[:,0]-cx, outer[:,1]-cy)-rr)
keep = res < np.percentile(res, 75)
A = np.c_[2*outer[keep,0], 2*outer[keep,1], np.ones(keep.sum())]
bb = outer[keep,0]**2+outer[keep,1]**2
sol,*_ = np.linalg.lstsq(A,bb,rcond=None)
cx,cy = sol[0],sol[1]; rr = np.sqrt(sol[2]+cx*cx+cy*cy)
res = np.abs(np.hypot(outer[keep,0]-cx, outer[keep,1]-cy)-rr)
print('RING: cx=%.4f cy=%.4f r=%.4f   resid mean %.1f max %.1f px'%(cx/W,cy/H,rr/W,res.mean(),res.max()))

# 人物：环内部/附近的暗区
person = (lum < 40) & (d < 14)
person[:, :int(W*0.44)] = False
person = ndimage.binary_closing(person, np.ones((9,9)))
person = ndimage.binary_fill_holes(person)
lab,n = ndimage.label(person)
sizes = ndimage.sum(person,lab,range(1,n+1))
order = np.argsort(sizes)[::-1]
print('--- 暗区连通块 ---')
for i in order[:5]:
    ys2,xs2 = np.nonzero(lab==i+1)
    print('  size %7d  x %.1f-%.1f%%  y %.1f-%.1f%%'%(sizes[i],xs2.min()/W*100,xs2.max()/W*100,ys2.min()/H*100,ys2.max()/H*100))

json.dump(dict(size=[W,H], ring=dict(cx=float(cx/W),cy=float(cy/H),r=float(rr/W))), open('an3.json','w'), indent=1)
