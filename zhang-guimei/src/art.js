export const W = 960;
export const H = 540;
export const clamp = n => Math.max(0, Math.min(1, n));
export const ease = n => 1 - (1 - clamp(n)) ** 3;
export const mix = (a,b,k) => a + (b-a)*k;
export const tau = Math.PI * 2;
export const ink = '#272627';
export const cream = '#f1e1c5';
export const red = '#a84439';
export const gold = '#ffd77f';
export const sans = '"Microsoft YaHei", "Noto Sans CJK SC", sans-serif';
export const serif = '"SimSun", "Noto Serif CJK SC", serif';

export function rect(c,x,y,w,h,color) {
  c.fillStyle=color;
  c.fillRect(x,y,w,h);
}
export function poly(c,points,color) {
  c.beginPath();
  points.forEach(([x,y],i)=>i ? c.lineTo(x,y) : c.moveTo(x,y));
  c.closePath();
  c.fillStyle=color;
  c.fill();
}
export function line(c,points,color,width=2) {
  c.beginPath();
  points.forEach(([x,y],i)=>i ? c.lineTo(x,y) : c.moveTo(x,y));
  c.strokeStyle=color;
  c.lineWidth=width;
  c.lineCap='round';
  c.lineJoin='round';
  c.stroke();
}
export function ellipse(c,x,y,a,b,color,angle=0) {
  c.beginPath();
  c.ellipse(x,y,a,b,angle,0,tau);
  c.fillStyle=color;
  c.fill();
}
export function round(c,x,y,w,h,r,color) {
  c.beginPath();
  c.roundRect(x,y,w,h,r);
  c.fillStyle=color;
  c.fill();
}
export function text(c,value,x,y,sz,{color=cream,align='left',font=sans,weight=600,outline=0}={}) {
  c.textAlign=align;
  c.textBaseline='alphabetic';
  c.font=`${weight} ${sz}px ${font}`;
  if(outline){
    c.strokeStyle='rgba(18,20,23,.92)';
    c.lineWidth=outline;
    c.lineJoin='round';
    c.strokeText(value,x,y);
  }
  c.fillStyle=color;
  c.fillText(value,x,y);
}
export function vertical(c,x,y,w,h,a,b) {
  const g=c.createLinearGradient(0,y,0,y+h);
  g.addColorStop(0,a);
  g.addColorStop(1,b);
  rect(c,x,y,w,h,g);
}
export function glow(c,x,y,r,color,amount=1) {
  const g=c.createRadialGradient(x,y,0,x,y,r);
  g.addColorStop(0,color);
  g.addColorStop(1,'transparent');
  c.save();
  c.globalAlpha*=amount;
  rect(c,x-r,y-r,2*r,2*r,g);
  c.restore();
}
export function vignette(c,amount=.38) {
  const g=c.createRadialGradient(480,262,200,480,273,560);
  g.addColorStop(0,'rgba(13,17,22,0)');
  g.addColorStop(1,`rgba(13,17,22,${amount})`);
  rect(c,0,0,W,H,g);
}
export function windowLight(c,x,y,w,h,on) {
  rect(c,x-4,y-4,w+8,h+8,'#33373b');
  vertical(c,x,y,w,h,on?'#eee0aa':'#374d5d',on?'#d89d64':'#212e3d');
  rect(c,x+w*.48,y,3,h,'#49473f');
  rect(c,x,y+h*.48,w,3,'#49473f');
}
export function mountains(c,t,{night=false,road=false}={}) {
  vertical(c,0,0,W,H,night?'#233149':'#7f9da0',night?'#61707a':'#d5cbb0');
  if(night) {
    ellipse(c,748,88,22,22,'#c4c1a7');
    ellipse(c,756,81,20,20,'#303d53');
  } else glow(c,748,130,230,'#f2d2a0',.42);
  const colors=night?['#425467','#334457','#27374b','#212e3b']:['#899e97','#718b82','#5c7968','#496450'];
  colors.forEach((color,i)=>{
    const points=[[-40,H]];
    for(let x=-48;x<=1020;x+=18){
      const phase=(x+t*(4+i*3))/180;
      const y=236+i*38+Math.sin(phase+i*.86)*(34+6*i)+Math.sin(phase*2.1+i)*17;
      points.push([x,y]);
    }
    points.push([1020,H]);
    poly(c,points,color);
  });
  if(road) {
    c.beginPath();
    c.moveTo(645,320); c.bezierCurveTo(544,344,788,439,129,552);
    c.lineTo(462,552); c.bezierCurveTo(830,437,613,349,658,321);
    c.closePath(); c.fillStyle=night?'#59646b':'#a79575'; c.fill();
    for(let i=0;i<5;i++){
      const x=28+i*94,y=394+Math.sin(i*1.24)*24;
      line(c,[[x,y],[x,y-58]],night?'#202b34':'#4e5650',4);
      line(c,[[x-11,y-46],[x+11,y-46]],night?'#202b34':'#4e5650',3);
    }
  }
}
export function corridor(c,t,level=1) {
  const shift=Math.sin(t*.8)*9;
  const v=565+shift;
  vertical(c,0,0,W,H,'#414a51','#756c5c');
  poly(c,[[0,0],[v-45,186],[v-45,349],[0,449]],'#61635d');
  poly(c,[[W,0],[v+80,186],[v+80,349],[W,455]],'#777168');
  poly(c,[[0,448],[v-45,349],[v+80,349],[W,455],[W,H],[0,H]],'#52534c');
  rect(c,v-45,185,125,164,'#414c50');
  [0,1,2,3].forEach(i=>{
    const k=1-i*.24;
    const x=mix(v+89,855,k), y=mix(201,112,k);
    windowLight(c,x,y,53*k,157*k,level>i*.13+.23);
    const lampX=mix(v+10,428,k), lampY=mix(206,56,k);
    round(c,lampX,lampY,101*k,8*k,2,level>i*.12+.22?'#fff0b0':'#677476');
    if(level>i*.12+.22){
      glow(c,lampX+50*k,lampY+20,168*k,'#ffc17b',.36);
      poly(c,[[lampX+9,lampY],[lampX+94*k,lampY],[lampX+173*k,404],[lampX-82*k,404]],'#eac38413');
    }
    line(c,[[v-38+i*18,352],[82+i*211,H]],'#303d4428',2);
  });
  rect(c,0,0,W,H,`rgba(15,26,44,${.5*(1-level)})`);
}
export function school(c,t,{night=false,gate=false}={}) {
  mountains(c,t,{night});
  const wall=night?'#535258':'#d3c7a5';
  rect(c,225,248,550,191,'#373b3b34');
  rect(c,212,235,550,196,wall);
  poly(c,[[186,240],[244,193],[712,193],[791,240]],night?'#384350':'#746852');
  rect(c,448,340,78,91,'#414948');
  for(let i=0;i<7;i++)windowLight(c,241+i*73,263,44,59,night&&i%3!==1);
  rect(c,0,430,W,H-430,night?'#343f43':'#9b9876');
  if(gate){
    rect(c,173,237,54,199,'#7d7a65'); rect(c,734,237,54,199,'#7d7a65');
    round(c,153,225,655,63,3,'#b5a379');
    text(c,'华坪女子高级中学',481,268,32,{color:'#3a3832',align:'center',font:serif,weight:700});
  }
}
export function room(c,t,kind='class') {
  const dark=kind==='office';
  vertical(c,0,0,W,H,dark?'#4b4238':'#ad9874',dark?'#785e49':'#c3ad82');
  rect(c,0,377,W,163,dark?'#524539':'#847b60');
  line(c,[[0,380],[960,380]],'#65573e',5);
  if(kind==='class'){
    round(c,264,91,459,207,4,'#725843');
    round(c,274,101,439,187,2,'#495e53');
    rect(c,285,281,418,7,'#342d27');
    windowLight(c,785,116,113,155,true);
    poly(c,[[802,248],[893,239],[796,540],[616,540]],'#f8d59634');
  } else {
    windowLight(c,655,84,169,157,!dark);
    rect(c,106,106,176,235,dark?'#493929':'#796048');
    for(let i=0;i<3;i++)rect(c,121,142+i*53,145,8,'#423628');
    glow(c,590,238,390,'#ffd094',dark?.32:.25);
  }
}
