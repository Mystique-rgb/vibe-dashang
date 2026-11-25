export const W=1920, H=1080;
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const mix=(a,b,p)=>a+(b-a)*p;
export const smooth=x=>{const v=clamp(x);return v*v*(3-2*v);};
export const random=(n)=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
export function poly(c,color,pts){c.fillStyle=color;c.beginPath();c.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)c.lineTo(...pts[i]);c.closePath();c.fill();}
export function box(c,color,x,y,w,h){c.fillStyle=color;c.fillRect(x,y,w,h);}
export function line(c,color,w,pts){c.strokeStyle=color;c.lineWidth=w;c.beginPath();c.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)c.lineTo(...pts[i]);c.stroke();}
export function oval(c,color,x,y,rx,ry){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
export function glow(c,rgb,x,y,r,opacity=1){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${rgb},${opacity})`);g.addColorStop(.24,`rgba(${rgb},${opacity*.47})`);g.addColorStop(1,`rgba(${rgb},0)`);box(c,g,x-r,y-r,r*2,r*2);}
export function grad(c,x,y,ex,ey,...colors){const g=c.createLinearGradient(x,y,ex,ey);colors.forEach((color,i)=>g.addColorStop(i/(colors.length-1),color));return g;}
export function label(c,text,x,y,size=30,color='#f4e6d6',align='center',serif=false){c.font=`${serif?'700':'500'} ${size}px ${serif?'"SimSun", "Songti SC", FangSong, serif':'"Microsoft YaHei", "Noto Sans CJK SC", sans-serif'}`;c.textAlign=align;c.textBaseline='middle';c.fillStyle=color;c.fillText(text,x,y);}
