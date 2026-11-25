from PIL import Image
import numpy as np
import json
from skimage import measure

m = np.array(Image.open('mask-person.png').convert('L'))>128
h = np.array(Image.open('mask-hole.png').convert('L'))>128
H,W = m.shape

cnts = measure.find_contours(m.astype(float), 0.5)
cnts = sorted(cnts, key=lambda c: -len(c))
main = cnts[0]   # (row, col) = (y, x)
print('raw points:', len(main))

def rdp(p, tol):
    p = np.asarray(p, dtype=float)
    if len(p) < 3: return p
    d = p[-1] - p[0]
    n = np.hypot(d[0], d[1])
    if n == 0:
        dist = np.hypot(p[:,0]-p[0,0], p[:,1]-p[0,1])
    else:
        # 2D cross product magnitude
        dist = np.abs(d[0]*(p[:,1]-p[0,1]) - d[1]*(p[:,0]-p[0,0])) / n
    i = int(np.argmax(dist))
    if dist[i] > tol:
        a = rdp(p[:i+1], tol)
        b = rdp(p[i:], tol)
        return np.vstack([a[:-1], b])
    return np.array([p[0], p[-1]])

simp = rdp(main, 1.8)
print('simplified:', len(simp))
norm = np.stack([simp[:,1]/W, simp[:,0]/H], axis=1)
json.dump(norm.tolist(), open('person-outline.json','w'))
print('bbox x %.3f-%.3f y %.3f-%.3f'%(norm[:,0].min(),norm[:,0].max(),norm[:,1].min(),norm[:,1].max()))

ys,xs = np.nonzero(h)
cx,cy = xs.mean(), ys.mean()
rad = np.sqrt(h.sum()/np.pi)
print('hole center %.4f,%.4f r %.4f'%(cx/W,cy/H, rad/W))
json.dump(dict(cx=cx/W, cy=cy/H, r=rad/W), open('hole.json','w'), indent=1)
