from PIL import Image
import numpy as np
h = np.array(Image.open('mask-hole.png').convert('L'))>128
H,W = h.shape
ys,xs = np.nonzero(h)
# 只取左侧弧（不受人物遮挡的部分）：x < 该行最左+20%
keep=[]
for y in range(H):
    row=np.nonzero(h[y])[0]
    if len(row)>3:
        keep.append((row.min(), y))   # 每行最左点 = 圆的外弧
keep=np.array(keep)
# 最小二乘拟合圆
A=np.c_[2*keep[:,0], 2*keep[:,1], np.ones(len(keep))]
b=keep[:,0]**2 + keep[:,1]**2
sol,*_=np.linalg.lstsq(A,b,rcond=None)
cx,cy=sol[0],sol[1]; r=np.sqrt(sol[2]+cx*cx+cy*cy)
print('fit: cx=%.4f cy=%.4f r=%.4f  (W units)'%(cx/W,cy/H,r/W))
print('   px: cx=%.0f cy=%.0f r=%.0f'%(cx,cy,r))
# 残差
d=np.hypot(keep[:,0]-cx, keep[:,1]-cy)
print('   residual mean %.1f max %.1f px'%(np.abs(d-r).mean(), np.abs(d-r).max()))
# 检查右边界是否被人挡住
rowmax=[np.nonzero(h[y])[0].max() for y in range(H) if len(np.nonzero(h[y])[0])>3]
print('visible right edge max x = %.1f%% (circle would reach %.1f%%)'%(max(rowmax)/W*100,(cx+r)/W*100))
