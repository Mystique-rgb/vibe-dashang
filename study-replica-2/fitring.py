from PIL import Image
import numpy as np
import json

a = np.array(Image.open('hi/t0.6.png').convert('RGB')).astype(np.float32)
H,W,_ = a.shape
R,G,B = a[:,:,0],a[:,:,1],a[:,:,2]
lum = 0.299*R+0.587*G+0.114*B

# 环线像素：亮 + 偏紫，排除左侧文字
bp = (lum>85)&((B-R)>18)
bp[:, :int(W*0.46)] = False
ys,xs = np.nonzero(bp)
print('candidate px:', len(ys))

# 网格搜索 (cx, cy, r)
best=None
for cx in np.arange(0.60,0.82,0.005):
    for cy in np.arange(0.35,0.55,0.005):
        dx = xs/W - cx; dy = (ys/H - cy)*(H/W)
        rr = np.hypot(dx,dy)
        for r in np.arange(0.12,0.26,0.004):
            inl = (np.abs(rr-r)<0.006).sum()
            if best is None or inl>best[0]:
                best=(inl,cx,cy,r)
inl,cx,cy,r = best
print('BEST ring: cx=%.3f cy=%.3f r=%.3f  inliers=%d (%.1f%% of candidates)'%(cx,cy,r,inl,inl/len(ys)*100))
json.dump(dict(cx=float(cx),cy=float(cy),r=float(r)), open('ring.json','w'), indent=1)
