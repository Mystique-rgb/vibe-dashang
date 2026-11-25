export const W = 1920, H = 1080, TAU = Math.PI * 2;
export const GOLD = '#edbe73', CREAM = '#fbf0db', RED = '#ff684e', BLUE = '#8ee9d8';
export const SERIF = '"Noto Serif SC", "Songti SC", SimSun, serif';
export const SANS = '"Noto Sans SC", "Microsoft YaHei", sans-serif';
export const MONO = '"Bahnschrift", "Cascadia Mono", monospace';
export const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const mix = (a, b, p) => a + (b - a) * p;
export const out = p => 1 - (1 - clamp(p)) ** 3;
export const smooth = p => { p = clamp(p); return p*p*(3-2*p); };
export const hash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

export function line(c, x1, y1, x2, y2, color, width = 2) {
  c.beginPath(); c.moveTo(x1,y1); c.lineTo(x2,y2); c.lineWidth = width; c.strokeStyle = color; c.stroke();
}
export function oval(c, x, y, rx, ry, color, width = 2, fill = false) {
  c.beginPath(); c.ellipse(x, y, Math.max(0.01,rx), Math.max(0.01,ry), 0, 0, TAU);
  if (fill) { c.fillStyle = color; c.fill(); } else { c.strokeStyle = color; c.lineWidth = width; c.stroke(); }
}
export function polygon(c, points, fill, stroke, width = 2) {
  c.beginPath(); c.moveTo(...points[0]);
  for (const p of points.slice(1)) c.lineTo(...p);
  c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
}
export function text(c, str, x, y, size, { color = CREAM, align = 'center', family = SANS, weight = 800, max = W, stroke = 0 } = {}) {
  if (!str) return;
  c.font = `${weight} ${size}px ${family}`; c.textBaseline = 'middle'; c.textAlign = align;
  if (stroke) { c.lineJoin = 'round'; c.strokeStyle = '#080e11'; c.lineWidth = stroke; c.strokeText(str,x,y,max); }
  c.fillStyle = color; c.fillText(str,x,y,max);
}
export function glow(c, x, y, radius, color) {
  const g = c.createRadialGradient(x,y,0,x,y,radius);
  g.addColorStop(0,color); g.addColorStop(1,'transparent');
  c.fillStyle = g; c.fillRect(x-radius,y-radius,radius*2,radius*2);
}
export function card(c, x, y, w, h, { rot = 0, face = '', red = false, pale = false, back = true, alpha = 1, scaleX = 1 } = {}) {
  c.save(); c.translate(x,y); c.rotate(rot); c.scale(scaleX,1); c.globalAlpha *= alpha;
  const edge = red ? '#fc7657' : '#e4b571';
  const gradient = c.createLinearGradient(-w/2,-h/2,w/2,h/2);
  gradient.addColorStop(0, pale ? '#f4dba6' : red ? '#4a181a' : '#293b39');
  gradient.addColorStop(1, pale ? '#bb8952' : red ? '#160b10' : '#11191b');
  c.shadowColor = '#030506b5'; c.shadowBlur = 26; c.shadowOffsetY = 14;
  c.beginPath(); c.roundRect(-w/2,-h/2,w,h,Math.max(5,w*.045)); c.fillStyle = gradient; c.fill();
  c.shadowBlur = 0; c.shadowOffsetY = 0; c.lineWidth = Math.max(1.4,w*.014); c.strokeStyle = edge; c.stroke();
  c.beginPath(); c.roundRect(-w*.443,-h*.456,w*.886,h*.912,Math.max(3,w*.022));
  c.strokeStyle = pale ? '#734122a0' : '#e3c6875c'; c.lineWidth = 1.2; c.stroke();
  if (back && !face) {
    oval(c,0,0,w*.25,w*.25,edge,w*.012);
    polygon(c,[[0,-w*.28],[w*.19,0],[0,w*.28],[-w*.19,0]],null,edge,w*.012);
    oval(c,0,0,w*.044,w*.044,edge,1,true);
    for (const d of [-1,1]) line(c,-w*.29,d*h*.27,w*.29,d*h*.27,'#e3c6875c',1);
  }
  if (face) {
    const size = Math.min(w*.30, h*.20);
    text(c,face,0,0,size,{family:SERIF, color:pale?'#421e16':CREAM, max:w*.83, weight:900});
  }
  c.restore();
}

export function backdrop(c, f, intro = false) {
  const hot = ['title','threat','flip','verdict'].includes(f.kind);
  c.fillStyle = '#070d12'; c.fillRect(0,0,W,H);
  glow(c, intro?1160:995, intro?410:570, 1020, hot?'#772b25a0':'#183c419e');
  glow(c, intro?1780:260, intro?500:800, 850, intro?'#63442661':'#54422836');
  const vanX = 970+Math.sin(f.time*.51)*160;
  const vanY = intro ? 490 : 510;
  for(let j=-10;j<=10;j++) {
    const a = j*214+Math.sin(f.time*.8)*60;
    line(c,vanX,vanY,vanX+a,1120,hot?'#f3705340':'#9caea72c',1.25);
  }
  for(let j=1;j<=10;j++) {
    const p = ((j-1)/10+f.time*.17)%1;
    const y = vanY+p*p*650;
    line(c,0,y,W,y,hot?'#b451323f':'#89b1a72c',1.1);
  }
  for(let j=0;j<110;j++) {
    const z=hash(j+900)**2, x=(hash(j+31)*W+f.time*(11+z*42))%W;
    const y=(hash(j+81)*H-f.time*(20+z*68)%H+H)%H;
    const alpha=(.10+z*.54)*(.52+.48*Math.sin(f.time*3.9+j));
    c.globalAlpha=alpha; c.fillStyle=j%9===0?RED:j%3===0?BLUE:GOLD;
    c.fillRect(x,y,1+z*4,1+z*3);
  }
  c.globalAlpha=1;
  const v=c.createRadialGradient(W*.52,H*.48,310,W*.52,H*.48,1140);
  v.addColorStop(0,'transparent'); v.addColorStop(1,'#06090de0');
  c.fillStyle=v; c.fillRect(0,0,W,H);
}
