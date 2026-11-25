const TAU = Math.PI*2;
const clip=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const frac=x=>x-Math.floor(x);
const rnd=i=>frac(Math.sin(i*125.723+15.21)*45948.2341);
const tint=(s,a)=>s+Math.round(255*clip(a)).toString(16).padStart(2,'0');
const configs={
  19:{cold:'#06372f',mid:'#31e1b1',hot:'#e4fff1',dust:'#fd9b51'},
  15:{cold:'#10215c',mid:'#2674ff',hot:'#c5eeff',dust:'#78b8ff'},
  14:{cold:'#4b2618',mid:'#e7ac72',hot:'#ffffe2',dust:'#f2d78f'},
  11:{cold:'#152e4d',mid:'#a5d7ff',hot:'#f6fcff',dust:'#7ac7ef'},
  9:{cold:'#2d125c',mid:'#8a58ff',hot:'#ecafff',dust:'#48bdff'},
  3:{cold:'#59263c',mid:'#ff84b9',hot:'#fff1e8',dust:'#ffbdca'},
  2:{cold:'#24114b',mid:'#7842ff',hot:'#dab4ff',dust:'#846eff'},
};

function glow(c,x,y,r,color,power){
  const g=c.createRadialGradient(x,y,0,x,y,r);
  g.addColorStop(0,tint(color,power));g.addColorStop(.34,tint(color,power*.41));g.addColorStop(1,tint(color,0));
  c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);
}
function stroke(c,points,color,width){
  c.beginPath();c.moveTo(points[0][0],points[0][1]);
  for(let i=1;i<points.length;i++)c.lineTo(points[i][0],points[i][1]);
  c.lineCap='round';c.lineJoin='round';c.lineWidth=width;c.strokeStyle=color;c.stroke();
}
function ellipse(c,x,y,w,h,a,b,col,width,tilt=0){
  c.beginPath();c.ellipse(x,y,w,h,tilt,a,b);c.strokeStyle=col;c.lineWidth=width;c.stroke();
}
function specks(c,rank,t,col,hit,reveal,swallow=false){
  const count=rank===9?112:84;
  for(let i=0;i<count;i++){
    const p=frac(rnd(i+100)-t*(.12+.26*rnd(i+178))),a0=TAU*rnd(i*3+5),spin=swallow?2.8:1.2;
    const a=a0+t*(.16+.20*rnd(i+31))-p*spin;
    const r=(swallow?.145:.09)+p*(.18+.31*rnd(i+28));
    let x=Math.cos(a)*r,y=Math.sin(a)*r*(swallow?.78:1.19);
    if(!swallow){x*=.85;y-=.05+(1-p)*.18;}
    const light=Math.sin(p*Math.PI)**2*(.24+.76*rnd(i+61))*reveal;
    const s=.001+rnd(i+44)**2*.004;
    c.fillStyle=tint(i%5?col.dust:col.hot,light*(.78+.22*hit));c.fillRect(x,y,s,s*(1+rnd(i+66)*2));
    if(i%11===0){
      const v=swallow?.022:.014;
      stroke(c,[[x,y],[x+v*Math.cos(a-.73),y+v*Math.sin(a-.73)]],tint(col.mid,light*.63),s*.6);
    }
  }
}
function plume(c,t,col,spec){
  const {x=0,y=.23,h=.64,w=.22,count=17,lean=.04,twist=1,opacity=1}=spec;
  for(let i=0;i<count;i++){
    const f=rnd(i+900),f2=rnd(i*21+52), f3=rnd(i+51), orient=i%2?-1:1;
    const tall=h*(.48+.52*f2), wide=w*(.28+.72*f), mv=.013*Math.sin(t*3.7+i);
    const track=p=>{
      const neck=Math.sin(Math.PI*p)**.95, curl=Math.sin(p*(4.7+f*3.8)*twist-t*(1.5+f3)+i*.86);
      const drift=Math.sin(p*9-t*3.4+i*.27)*.028*neck;
      return [x+orient*wide*(.17+neck*.76)*(1-p*.43)+lean*p*p+curl*wide*.72*p+drift+mv,
        y-p*tall+p*.018*Math.sin(t*3+i*.53)];
    };
    const points=Array.from({length:30},(_,k)=>track(k/29));
    const g=c.createLinearGradient(x,y,x+lean,y-tall);
    g.addColorStop(0,tint(col.mid,0));g.addColorStop(.16,tint(col.mid,.62*opacity));
    g.addColorStop(.44,tint(i%4===0?col.hot:col.mid,(.26+.43*f)*opacity));
    g.addColorStop(.75,tint(col.hot,(.41+.28*f3)*opacity));g.addColorStop(1,tint(col.mid,0));
    if(i%3===0){
      const edge=points.map(([px,py],k)=>[px+orient*(.008+.019*f)*Math.sin(k*Math.PI/29),py]);
      c.fillStyle=g;c.beginPath();c.moveTo(...points[0]);
      for(const point of points)c.lineTo(...point);
      for(const point of edge.reverse())c.lineTo(...point);
      c.closePath();c.globalAlpha=.35;c.fill();c.globalAlpha=1;
      stroke(c,points,tint(col.mid,.14*opacity),.014+.013*f);
    }
    stroke(c,points,g,.0017+.0038*f);
  }
}
function lotus(c,t,col,pink){
  const rockY=pink?.24:.25;
  if(!pink)for(let k=0;k<15;k++){
    const a=(k-7)/7,move=.026*Math.sin(t*2+k);
    const points=Array.from({length:11},(_,j)=>{
      const z=j/10;return [a*(.07+z*.43)+.019*Math.sin(j*1.75+k),rockY+z*(.028+k%4*.034)+move];
    });
    stroke(c,points,tint('#fe662e',.4+.24*Math.sin(t*2.4+k)),.0035);
    stroke(c,points,tint('#ffb85f',.25),.0015);
  }
  glow(c,0,.035,.35,col.mid,pink?.37:.27);
  for(let i=0;i<3;i++){
    const a=t*.46+i*1.9;
    ellipse(c,0,.248,.39+i*.026,.078+i*.008,a,a+3.8,tint(pink?col.mid:'#b87a43',.33),.0024);
  }
  for(let row=0;row<2;row++)for(let i=0;i<7;i++){
    const q=(i-3)/3,phase=t*2.7+i*.7;
    const px=q*(.43-row*.084),py=.13-Math.cos(q*1.8)*(.21+row*.016)+.013*Math.sin(phase),base=.22-row*.037;
    const bulge=(.052+Math.abs(q)*.036)*(row?1.06:1);
    const g=c.createLinearGradient(0,base,0,py);
    g.addColorStop(0,tint(col.cold,.90));g.addColorStop(.40,tint(col.mid,.45));g.addColorStop(1,tint(col.hot,.105));
    c.beginPath();c.moveTo(q*.055,base);
    c.bezierCurveTo(px*.73-bulge,.205,px-bulge,py+.073,px,py);
    c.bezierCurveTo(px+bulge,py+.10,px*.6+bulge,base+.027,q*.055,base);
    c.fillStyle=g;c.fill();c.strokeStyle=tint(col.mid,.53);c.lineWidth=.0045;c.stroke();
    c.strokeStyle=tint(col.hot,.60);c.lineWidth=.0017;c.stroke();
    for(let vein=0;vein<3;vein++){
      const side=(vein-1)*bulge*.51;
      c.beginPath();c.moveTo(q*.065,base-.005);
      c.bezierCurveTo(px*.36+side,base-.050,px*.91+side,py+.083,px,py+.010);
      c.strokeStyle=tint(col.hot,vein===1?.48:.22);c.lineWidth=.0017;c.stroke();
    }
  }
  if(pink)for(const side of [-1,1]){
    ellipse(c,side*.21,-.08,.216,.096,t*.8,t*.8+4.9,tint(col.hot,.45),.0028,side*-.42);
    plume(c,t+side*.08,col,{x:side*.15,y:.117,h:.46,w:.10,lean:side*.12,count:7,opacity:.57});
  }
  plume(c,t,col,{y:.14,h:pink?.68:.59,w:pink?.16:.11,count:18,lean:.052,twist:1.24});
  glow(c,0,.075,.13,col.hot,.75);
}
function vortex(c,t,col){
  glow(c,0,.096,.34,col.mid,.36);
  for(let i=0;i<25;i++){
    const f=rnd(i+41),phi=i*.268+t*(.75+.23*f), radius=.11+f*.24;
    const pts=Array.from({length:43},(_,k)=>{
      const p=k/42,a=phi+p*(5.2+1.8*f),r=.012+radius*p;
      return [Math.cos(a)*r+.020*Math.sin(p*10+phi)*p,.103+Math.sin(a)*r*.68-(p**2)*.055];
    });
    stroke(c,pts,tint(col.mid,.21+f*.21),.005+f*.010);
    stroke(c,pts,tint(i%4===0?col.hot:col.mid,.34+f*.45),.0015+f*.0022);
  }
  plume(c,t,col,{y:.15,h:.64,w:.26,lean:.055,twist:1.49,count:27});
  glow(c,0,.094,.105,col.hot,.85);
  ellipse(c,0,.255,.41,.093,t*.9,t*.9+4.7,tint('#e5bb61',.52),.0022);
}
function serpent(c,t,col,dragon){
  const drift=.048*Math.sin(t*1.72), ripple=.030*Math.sin(t*2.84);
  const track=p=>{
    const a=p*(dragon?5.72:7.1)-.78;
    return [Math.sin(a)*(.29-.13*p)+drift*p,.36-.65*p-.039*Math.sin(a*2)+ripple*p];
  };
  const head=track(1),x=head[0],y=head[1];
  if(dragon){
    for(let i=0;i<41;i++){
      const f=rnd(i+21),px=(f-.5)*.98,py=(rnd(i*7)-.5)*1.05, s=.004+rnd(i+71)*.009;
      if(i%5===0){
        const color=tint(col.dust,.42+.33*Math.sin(t*2.9+i)**2);
        stroke(c,[[px-s,py],[px+s,py]],color,.001);
        stroke(c,[[px,py-s],[px,py+s]],color,.001);
      } else {c.fillStyle=tint(col.hot,f*.52);c.fillRect(px,py,.0025,.0025);}
    }
  }
  glow(c,x,y,.29,col.mid,dragon?.62:.29);
  for(let i=0;i<25;i++){
    const q=(i-12)/12,o=rnd(i+18), pts=Array.from({length:52},(_,k)=>{
      const p=k/51*.98, z=track(p),w=(.028+.03*p)*Math.sin(Math.PI*p)**.5;
      return [z[0]+q*w+.012*Math.sin(p*28-t*5+i*.47)*Math.sin(p*Math.PI),z[1]+.023*p*Math.sin(i*.81+p*24-t*3)];
    });
    stroke(c,pts,tint(col.mid,dragon?.13:.087),.009+o*.009);
    stroke(c,pts,tint(i%6?col.mid:col.hot,(dragon?.28:.12)+o*.31),.0013+o*.0029);
  }
  for(const d of [-1,1]){
    const h=.11;
    const outline=[[x,y+h*.81],[x+d*.065,y+h*.36],[x+d*.109,y-h*.17],[x+d*(dragon?.145:.084),y-h*.69],[x+d*.045,y-h*.40],[x,y-h*.75]];
    stroke(c,outline,tint(col.mid,.66),.008);
    stroke(c,outline,tint(col.hot,.57),.0025);
    stroke(c,[[x+d*.012,y+.019],[x+d*.059,y-.017],[x+d*.075,y-.013]],tint(col.hot,dragon?.95:.7),.0065);
    if(dragon){
      for(let i=0;i<12;i++){
        const v=i/12,xx=d*(.11+v*.41), yy=.11+.056*Math.sin(v*4.8+t*.46+d)+.017*d;
        ellipse(c,xx,yy,.027,.009,0,TAU,tint(i%2?col.hot:col.mid,.49),.0021,d*(.29+.3*Math.sin(v*6)));
      }
      plume(c,t+d*.09,col,{x:x+d*.068,y:y+.062,h:.30,w:.066,lean:d*.16,count:8,opacity:.83});
    }
  }
  if(!dragon){
    const p=.5+.5*Math.cos(t*TAU*1.38);
    glow(c,0,.092,.17,col.hot,.34+.26*p);
    for(let j=0;j<3;j++){
      const m=frac(t*.99+j/3);ellipse(c,0,.092,.030+m*.29,.021+m*.12,0,TAU,tint(col.hot,.51*(1-m)),.0022);
    }
    stroke(c,[[-.14,.104],[-.073,.104],[-.039,.088],[-.017,.137],[.012,.048],[.049,.112],[.14,.104]],tint(col.hot,.78),.0026);
  }
}
function frost(c,t,col){
  glow(c,0,.11,.37,col.mid,.32);
  for(let k=0;k<16;k++){
    const a=k*TAU/16+t*.24,rz=.18+rnd(k+60)*.24;
    const x=Math.cos(a)*rz,y=.25+Math.sin(a)*rz*.24;
    const tall=.037+.105*rnd(k+39);
    const pts=[[x-.017,y],[x+.011,y-tall],[x+.029,y+.013],[x-.017,y]];
    c.beginPath();c.moveTo(...pts[0]);for(const z of pts)c.lineTo(...z);c.closePath();
    c.fillStyle=tint(col.mid,.12);c.fill();c.strokeStyle=tint(col.hot,.34);c.lineWidth=.002;c.stroke();
  }
  for(let i=0;i<7;i++)for(const d of [-1,1]){
    const phase=t*2.53+i*.49, xx=.087+i*.029, yy=.12-i*.027;
    const pts=[[0,.23-i*.031],[d*xx*.74,yy+.108],[d*xx,yy],[d*(xx+.043),yy-.077-.019*Math.sin(phase)]];
    stroke(c,pts,tint(col.mid,.27),.013);
    stroke(c,pts,tint(col.hot,.64),.0026);
  }
  plume(c,t,col,{y:.239,h:.73,w:.178,lean:.083,twist:1.55,count:29});
  glow(c,0,.116,.14,col.hot,.73);
}
function blackFlame(c,t,col,hit){
  glow(c,0,-.005,.54,col.mid,.41);
  for(let k=0;k<10;k++){
    const a=t*(k%2?.9:-.69)+k*.75;
    ellipse(c,0,.02,.25+k*.015,.116+k*.018,a,a+4.12,tint(k%3?col.mid:col.hot,.40),.003+k*.00021,-.43);
  }
  plume(c,t,col,{x:-.04,y:.229,h:.77,w:.261,lean:.112,twist:1.62,count:31});
  for(const d of [-1,1])plume(c,t+.17*d,col,{x:d*.206,y:.075,h:.49,w:.065,lean:.15*d,twist:1.42,count:12,opacity:.81});
  const points=Array.from({length:65},(_,k)=>{
    const a=k*TAU/64,r=.18+.016*Math.sin(a*5-t*3.2)+.014*Math.cos(a*8+t*4.2);
    return [r*Math.cos(a),.028+r*1.18*Math.sin(a)];
  });
  c.save();c.globalCompositeOperation='source-over';c.beginPath();c.moveTo(...points[0]);
  for(const p of points)c.lineTo(...p);
  c.closePath();
  const g=c.createRadialGradient(-.039,.049,.028,0,.036,.215);
  g.addColorStop(0,'#000003');g.addColorStop(.75,'#010107');g.addColorStop(1,'#180e37');
  c.fillStyle=g;c.fill();c.restore();
  stroke(c,points,tint(col.mid,.82),.006+.005*hit);
  stroke(c,points,tint(col.hot,.74),.0022);
  for(let i=0;i<44;i++){
    const q=frac(rnd(i+35)-t*(.29+.29*rnd(i+81))),a=rnd(i+62)*TAU+(1-q)*2.77+t*.44,r=.185+q*.33;
    const x=Math.cos(a)*r,y=.03+Math.sin(a)*r*.98;
    stroke(c,[[x,y],[Math.cos(a-.16)*(r+.027),.03+Math.sin(a-.16)*(r+.027)*.98]],tint(i%3?col.hot:'#647eff',.78*Math.sin(Math.PI*q)**.55),.0014+rnd(i+8)*.0026);
  }
}

export function drawFlame(c,item,{x,y,size,time,reveal,hit,mode}){
  const rank=item.rank,col=configs[rank], r=clip(reveal);
  if(r<=0)return;
  const s=size*(.78+.22*r)*(1+.012*Math.sin(time*3.4));
  c.save();c.translate(x,y);c.scale(s,s);c.rotate(.009*Math.sin(time*1.61));
  if(r<.99){c.beginPath();c.rect(-.75,.54-r*1.25,1.5,1.5);c.clip();}
  c.globalCompositeOperation='lighter';
  if(rank===19||rank===3)lotus(c,time,col,rank===3);
  else if(rank===15)vortex(c,time,col);
  else if(rank===14||rank===9)serpent(c,time,col,rank===9);
  else if(rank===11)frost(c,time,col);
  else blackFlame(c,time,col,hit);
  specks(c,rank,time,col,hit,r,rank===2);
  if(mode==='close')ellipse(c,0,.27,.41,.11,time*.59,time*.59+3.8,tint(col.hot,.26),.0019);
  c.restore();
}
