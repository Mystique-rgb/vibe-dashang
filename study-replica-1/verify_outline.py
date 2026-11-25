"""把简化后的多边形画回去，算 IoU 验证轮廓还原度。"""
from PIL import Image, ImageDraw
import numpy as np, json

d = json.load(open('ref-data.json'))
W,H = d['size']
m = np.array(Image.open('mask-person.png').convert('L'))>128

img = Image.new('L',(W,H),0)
dr = ImageDraw.Draw(img)
poly = [(p[0]*W, p[1]*H) for p in d['outline']]
dr.polygon(poly, fill=255)
poly_m = np.array(img)>128

inter = (poly_m & m).sum(); union = (poly_m | m).sum()
print('IoU = %.4f'%(inter/union))
print('poly area %.1f%%  mask area %.1f%%'%(poly_m.mean()*100, m.mean()*100))

# 叠加图：红=多边形，绿=原掩码，黄=重合
ov = np.zeros((H,W,3), np.uint8)
ov[m] = [0,140,0]
ov[poly_m] = [200,0,0]
ov[m & poly_m] = [220,200,0]
Image.fromarray(ov).save('outline-check.png')
print('saved outline-check.png')
