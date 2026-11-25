from PIL import Image
import numpy as np
from scipy import ndimage
import json

a = np.array(Image.open('hi/t0.6.png').convert('RGB')).astype(np.float32)
H,W,_ = a.shape
R,G,B = a[:,:,0],a[:,:,1],a[:,:,2]
lum = 0.299*R+0.587*G+0.114*B
d = B - R

# ---------- 光环圆环：紫色，右半区 ----------
purple = (d > 14) & (lum > 45)
purple[:, :int(W*0.50)] = False

# 环是细线：骨架化后拟合
from scipy.ndimage import binary_erosion
thin = purple & ~binary_erosion(purple, np.ones((11,11)))
ys, xs = np.nonzero(thin)
# RANSAC 圆拟合
rng = np.random.default_rng(7)
best = None
pts = np.c_[xs, ys].astype(float)
for _ in range(4000):
    idx = rng.choice(len(pts), 3, replace=False)
    p1,p2,p3 = pts[idx]
    A = np.c_[2*(p2[0]-p1[0]), 2*(p2[1]-p1[1])]
    bb = np.array([p2@0 if False else (p2[0]**2+p2[1]**2-p1[0]**2-p1[1]**2),
                   (p3[0]**2+p3[1]**2-p1[0]**2-p1[1]**2)])
    try: sol = np.linalg.solve(A, bb)
    except np.linalg.LinAlgError: continue
    cx,cy = sol
    r = np.hypot(p1[0]-cx, p1[1]-cy)
    if not (W*0.12 < r < W*0.42): continue
    dd = np.abs(np.hypot(pts[:,0]-cx, pts[:,1]-cy) - r)
    inl = (dd < 6).sum()
    if best is None or inl > best[0]:
        best = (inl, cx, cy, r)
inl, cx, cy, rad = best
print('RANSAC ring: cx=%.3f cy=%.3f r=%.3f  inliers=%d/%d (%.1f%%)'%(
    cx/W, cy/H, rad/W, inl, len(pts), inl/len(pts)*100))

# ---------- 人物剪影 ----------
person = (d < 10) & (lum < 42)
person[:, :int(W*0.33)] = False
person[int(H*0.75):, :] = False
person = ndimage.binary_closing(person, np.ones((7,7)))
person = ndimage.binary_opening(person, np.ones((4,4)))
lab,n = ndimage.label(person)
if n:
    sizes = ndimage.sum(person, lab, range(1,n+1))
    person = ndimage.binary_fill_holes(lab == (np.argmax(sizes)+1))
    ys,xs = np.nonzero(person)
    print('person: area %.1f%%  bbox x %.1f-%.1f%%  y %.1f-%.1f%%'%(
        person.mean()*100, xs.min()/W*100, xs.max()/W*100, ys.min()/H*100, ys.max()/H*100))
    Image.fromarray((person*255).astype(np.uint8)).save('body2.png')

json.dump(dict(size=[W,H], ring=dict(cx=cx/W, cy=cy/H, r=rad/W)), open('an2.json','w'), indent=1)
