"""参照图分析：分离人物 / 黑洞 / 火焰，输出可复用的几何与色值。"""
from PIL import Image
import numpy as np
from scipy import ndimage
from skimage import measure
import json

a = np.array(Image.open('ref.png').convert('RGB')).astype(np.float32)
H, W, _ = a.shape
R, G, B = a[:,:,0], a[:,:,1], a[:,:,2]
lum = 0.299*R + 0.587*G + 0.114*B
mx = a.max(axis=2); mn = a.min(axis=2)
sat = np.where(mx > 0, (mx-mn)/np.maximum(mx, 1), 0)

# --- 暗部（人物 + 黑洞），排除高饱和火焰 ---
warm = (R - B) > 45
dark = (lum < 55) & (~warm)
dark = ndimage.binary_closing(dark, np.ones((3,3)))
dark = ndimage.binary_opening(dark, np.ones((3,3)))
lab, n = ndimage.label(dark)
sizes = ndimage.sum(dark, lab, range(1, n+1))
order = np.argsort(sizes)[::-1]

person = ndimage.binary_fill_holes(lab == order[0]+1)
hole   = ndimage.binary_fill_holes(lab == order[1]+1)
Image.fromarray((person*255).astype(np.uint8)).save('mask-person.png')
Image.fromarray((hole*255).astype(np.uint8)).save('mask-hole.png')

# --- 黑洞圆拟合（只用左侧外弧，避开人物遮挡）---
pts = []
for y in range(H):
    row = np.nonzero(hole[y])[0]
    if len(row) > 3:
        pts.append((row.min(), y))
pts = np.array(pts, float)
A = np.c_[2*pts[:,0], 2*pts[:,1], np.ones(len(pts))]
b = pts[:,0]**2 + pts[:,1]**2
sol, *_ = np.linalg.lstsq(A, b, rcond=None)
cx, cy = sol[0], sol[1]
rad = float(np.sqrt(sol[2] + cx*cx + cy*cy))
res = np.abs(np.hypot(pts[:,0]-cx, pts[:,1]-cy) - rad)

# --- 人物轮廓 ---
cnts = sorted(measure.find_contours(person.astype(float), 0.5), key=lambda c: -len(c))
main = cnts[0]

def rdp(p, tol):
    p = np.asarray(p, float)
    if len(p) < 3: return p
    d = p[-1] - p[0]
    nn = np.hypot(d[0], d[1])
    if nn == 0:
        dist = np.hypot(p[:,0]-p[0,0], p[:,1]-p[0,1])
    else:
        dist = np.abs(d[0]*(p[:,1]-p[0,1]) - d[1]*(p[:,0]-p[0,0])) / nn
    i = int(np.argmax(dist))
    if dist[i] > tol:
        return np.vstack([rdp(p[:i+1], tol)[:-1], rdp(p[i:], tol)])
    return np.array([p[0], p[-1]])

simp = rdp(main, 1.8)
outline = [[round(float(x)/W, 5), round(float(y)/H, 5)] for y, x in simp]
print('outline points:', len(outline))

# --- 眼睛光条：脸区最亮水平带 ---
fy0, fy1 = int(H*.22), int(H*.48); fx0, fx1 = int(W*.30), int(W*.58)
band = []
for y in range(fy0, fy1):
    row = lum[y, fx0:fx1]
    idx = np.nonzero(row > 190)[0]
    if len(idx) > 3:
        band.append((y, fx0+idx.min(), fx0+idx.max()))
if band:
    ey = np.mean([b[0] for b in band])
    ex0 = min(b[1] for b in band); ex1 = max(b[2] for b in band)
else:
    ey, ex0, ex1 = H*.335, W*.348, W*.55
print('eye band: y %.3f  x %.3f-%.3f'%(ey/H, ex0/W, ex1/W))

# --- 色值采样 ---
def sample(x0, x1, y0, y1, p=90):
    s = a[int(H*y0):int(H*y1), int(W*x0):int(W*x1)].reshape(-1,3)
    return dict(mean=[round(float(v)) for v in s.mean(axis=0)],
                hi=[round(float(v)) for v in np.percentile(s, p, axis=0)])

colors = {
    'hole':     sample(.20,.32,.25,.38),
    'body':     sample(.55,.70,.45,.60),
    'fireHi':   sample(.02,.10,.10,.30),
    'fireMid':  sample(.85,.98,.05,.20),
    'fireLow':  sample(.30,.45,.88,.98),
    'crownTop': sample(.50,.62,.02,.10),
    'eyeBar':   sample(.36,.44,.325,.345),
    'rim':      sample(.34,.36,.44,.52),
}

data = dict(
    size=[W, H],
    circle=dict(cx=round(cx/W,5), cy=round(cy/H,5), r=round(rad/W,5),
                fitResidualMeanPx=round(float(res.mean()),2),
                fitResidualMaxPx=round(float(res.max()),2)),
    outline=outline,
    eye=dict(y=round(ey/H,5), x0=round(ex0/W,5), x1=round(ex1/W,5)),
    colors=colors,
    stats=dict(personAreaPct=round(float(person.mean()*100),2),
               firePct=round(float(((sat>0.6)&(R>120)&(R-B>60)&(lum>70)).mean()*100),2),
               darkPct=round(float((lum<35).mean()*100),2)),
)
json.dump(data, open('ref-data.json','w'), indent=1)
print(json.dumps({k:data[k] for k in ('size','circle','eye','stats')}, indent=1))
print('colors:', json.dumps(colors, indent=0)[:400])
