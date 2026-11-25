from PIL import Image
import numpy as np
from scipy import ndimage
from skimage import filters, morphology

im = Image.open('ref.png').convert('RGB')
a = np.array(im).astype(np.float32)
H,W,_ = a.shape
R,G,B = a[:,:,0],a[:,:,1],a[:,:,2]
lum = 0.299*R+0.587*G+0.114*B

# Otsu on luminance within the character region
sub = lum[int(H*0.08):int(H*0.82), int(W*0.28):int(W*0.90)]
t = filters.threshold_otsu(sub)
print('otsu thr =', t)

m = lum < t
m[:int(H*0.06),:] = False
m[int(H*0.84):,:] = False
# remove fire: fire is bright orange, so already excluded by lum
m = morphology.remove_small_objects(m, min_size=int(H*W*0.004))
m = morphology.binary_closing(m, morphology.disk(6))
m = ndimage.binary_fill_holes(m)
lab,n = ndimage.label(m)
sizes = ndimage.sum(m,lab,range(1,n+1))
print('regions', n, 'top sizes', sorted(sizes)[-5:])
big = lab==(np.argmax(sizes)+1)
print('area %.1f%%'%(big.mean()*100))
ys,xs=np.nonzero(big)
print('bbox x %.1f-%.1f%%  y %.1f-%.1f%%'%(xs.min()/W*100,xs.max()/W*100,ys.min()/H*100,ys.max()/H*100))
np.save('person3.npy', big)
Image.fromarray((big*255).astype(np.uint8)).save('mask-person3.png')
