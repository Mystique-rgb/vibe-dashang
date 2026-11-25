from PIL import Image
import numpy as np
from scipy import ndimage
from skimage import measure
import json

a = np.array(Image.open('hi/t0.6.png').convert('RGB')).astype(np.float32)
H,W,_ = a.shape
R,G,B = a[:,:,0],a[:,:,1],a[:,:,2]
lum = 0.299*R+0.587*G+0.114*B

# 验证环：沿圆周采样亮度
cx,cy,r = 0.715, 0.350, 0.148
th = np.linspace(0,2*np.pi,720,endpoint=False)
px = (cx + r*np.cos(th))*W
py = (cy + r*(H/W)*np.sin(th))*H
ok = (px>=0)&(px<W)&(py>=0)&(py<H)
vals = np.zeros(len(th)); vals[ok] = lum[py[ok].astype(int), px[ok].astype(int)]
print('沿环采样: mean %.0f  median %.0f  p75 %.0f  max %.0f'%(vals.mean(), np.median(vals), np.percentile(vals,75), vals.max()))
print('  亮段比例(>60): %.1f%%'%((vals>60).mean()*100))
# 对比：随机半径处
for rr in (r*0.6, r*0.8, r*1.2):
    px2=(cx+rr*np.cos(th))*W; py2=(cy+rr*(H/W)*np.sin(th))*H
    ok2=(px2>=0)&(px2<W)&(py2>=0)&(py2<H)
    v2=np.zeros(len(th)); v2[ok2]=lum[py2[ok2].astype(int),px2[ok2].astype(int)]
    print('  r*%.1f: mean %.0f  (亮段 %.1f%%)'%(rr/r, v2.mean(), (v2>60).mean()*100))
