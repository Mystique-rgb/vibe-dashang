import { TAU,GOLD,RED,BLUE,clamp,out,mix,smooth,hash,line,oval,polygon,glow } from './fx.js';

function glowTexture(image, shades) {
  const w=620, h=Math.ceil(w*image.height/image.width), pad=62;
  const canvas=document.createElement('canvas');
  canvas.width=w+pad*2; canvas.height=h+pad*2;
  const c=canvas.getContext('2d');
  c.drawImage(image,pad,pad,w,h);
  c.globalCompositeOperation='source-in';
  const gradient=c.createLinearGradient(pad,pad,pad+w,pad+h*.25);
  for(const [stop,color] of shades) gradient.addColorStop(stop,color);
  c.fillStyle=gradient;
  c.fillRect(0,0,canvas.width,canvas.height);
  return {canvas,w,h,pad};
}

function blurTexture(source,radius) {
  const canvas=document.createElement('canvas');
  canvas.width=source.canvas.width; canvas.height=source.canvas.height;
  const c=canvas.getContext('2d');
  c.filter=`blur(${radius}px)`;
  c.drawImage(source.canvas,0,0);
  return {...source,canvas};
}

function faceLightTexture(image, source) {
  const {w,h,pad}=source;
  const canvas=document.createElement('canvas');
  canvas.width=source.canvas.width; canvas.height=source.canvas.height;
  const c=canvas.getContext('2d');
  c.drawImage(image,pad,pad,w,h);
  c.globalCompositeOperation='destination-in';
  const x=pad+w*.49, y=pad+h*.32;
  const light=c.createRadialGradient(x,y,6,x,y,w*.235);
  light.addColorStop(0,'#fff'); light.addColorStop(.34,'#ffffffd0'); light.addColorStop(1,'#ffffff00');
  c.fillStyle=light; c.fillRect(0,0,canvas.width,canvas.height);
  return {canvas,w,h,pad};
}

// The fixed character goes from a rim-lit silhouette to a lit face, then the whole portrait.
export function revealLighting(time) {
  return {
    eye:smooth((time-1.133333333)/.34),
    face:smooth((time-1.72)/.96),
    body:smooth((time-2.03)/1.24),
  };
}

export function createPortrait(image) {
  const gold=glowTexture(image,[[0,'#d68e3d'],[.44,'#ffc86a'],[.64,'#df8144'],[1,'#2ca89a']]);
  return {
    image,
    shadow:glowTexture(image,[[0,'#020407'],[1,'#060a10']]),
    face:faceLightTexture(image,gold),
    wide:blurTexture(gold,18),
    tight:blurTexture(gold,3),
    emitters:readEmitters(gold),
  };
}

function paintTexture(c,{canvas,w,pad},x,y,size,shiftX=0,shiftY=0) {
  const k=size/w;
  c.drawImage(canvas,x-pad*k+shiftX,y-pad*k+shiftY,canvas.width*k,canvas.height*k);
}

export function lightPortrait(c, portrait, x,y,w,f,lighting) {
  const h=w*portrait.image.height/portrait.image.width;
  const {eye,face,body}=lighting;
  c.save(); c.globalCompositeOperation='screen';
  c.globalAlpha=.19+body*.23+f.pulse*.06;
  paintTexture(c,portrait.wide,x,y,w);
  c.globalAlpha=.23+body*.52;
  paintTexture(c,portrait.tight,x,y,w);
  c.restore();
  paintTexture(c,portrait.shadow,x,y,w);
  c.save();
  if(face>0&&body<1) {
    c.globalAlpha=face*.86*(1-body);
    paintTexture(c,portrait.face,x,y,w);
  }
  if(body>0) {
    c.globalAlpha=body;
    c.drawImage(portrait.image,x,y,w,h);
  }
  if(eye>0) {
    const ex=x+w*.454,ey=y+h*.250;
    c.globalCompositeOperation='screen';
    c.globalAlpha=eye*(1-.51*body);
    glow(c,ex,ey,77,'#cc512382');
    glow(c,ex,ey,31,'#f38339ce');
    c.save(); c.translate(ex,ey); c.rotate(-.35);
    oval(c,0,0,8.2,2.65,'#fff0a9',1,true); c.restore();
    const spark=1-smooth((f.time-1.49)/.42);
    c.globalAlpha*=spark*.55;
    line(c,ex-33,ey+3,ex+59,ey-5,'#f7b87c9a',1.45);
  }
  c.restore();
}

export function portraitSpace(c,f,x,y,front) {
  const t=f.time;
  if(!front) {
    c.save();
    c.globalCompositeOperation='screen';
    glow(c,x+310+Math.sin(t*2.3)*185,y-180,580,'#153f54c2');
    glow(c,x-360+Math.sin(t*.9)*85,y-118,526,'#70301eac');
    for(let j=0;j<5;j++) {
      const a=Math.sin(t*.9+j*.82)*.44;
      const origin=1425+Math.sin(t+j)*144, end=origin-910+Math.cos(t*.75+j)*340;
      const fill=c.createLinearGradient(origin,-70,end,920);
      fill.addColorStop(0,j%2?'#49d2be1b':'#f2ac5e1e'); fill.addColorStop(1,'#00000000');
      polygon(c,[[origin-12,-60],[origin+14,-60],[end+280+a*250,940],[end-180-a*250,940]],fill);
    }
    c.restore();
  }
  for(let j=0;j<(front?52:69);j++) {
    const d=hash(j+(front?299:879));
    const a=hash(j+61)*TAU+t*(front?.91:.52)+d*.4;
    if((Math.sin(a)>0)!==front)continue;
    const rz=1/(1-Math.sin(a)*.32);
    const rx=430+d*445;
    const px=x+Math.cos(a)*rx*rz;
    const py=y+Math.sin(a)*(132+d*216)*rz+(hash(j+11)-.5)*265;
    const edge=(.23+.77*hash(j+71))*(.53+.47*Math.sin(t*4+j));
    const color=j%7===0?BLUE:j%4===0?RED:GOLD;
    const length=(front?10:4)+d*(front?41:22)*(1+f.pulse);
    c.save(); c.globalAlpha=edge*(front?.82:.44);
    line(c,px,py,px+Math.sin(a)*length,py-Math.cos(a)*length*.46,color,(1+d*2.4)*rz);
    if(front && j%6===0) glow(c,px,py,20+d*19,'#ff9a4977');
    c.restore();
  }
  if(!front) return;
  const finalSweep=f.end-.747;
  const firstSweep=Math.min(3.13,finalSweep-.96);
  const sweep=clamp((t-firstSweep)/.96);
  const lastly=clamp((t-finalSweep)/.66);
  const flare=Math.max(Math.sin(sweep*Math.PI)*.78,Math.sin(lastly*Math.PI)*.91);
  if(flare<=0) return;
  const progress = lastly>0?lastly:sweep;
  const px=mix(x-491,x+455,out(progress)), py=y-150+Math.cos(progress*TAU)*82;
  c.save(); c.globalAlpha=flare; c.globalCompositeOperation='screen';
  glow(c,px,py,176,'#e6753182'); glow(c,px,py,38,'#ffca79ba');
  const bar=c.createLinearGradient(px-420,py,px+460,py);
  bar.addColorStop(0,'transparent'); bar.addColorStop(.5,'#ffd691a0'); bar.addColorStop(1,'transparent');
  c.fillStyle=bar; c.fillRect(px-420,py,880,2.4);
  c.restore();
}

function readEmitters({canvas,w,h,pad}) {
  const c=canvas.getContext('2d');
  const {data}=c.getImageData(pad,pad,w,h);
  function at(fixed, start, stop, vertical) {
    const cap=vertical?h:w;
    const from=Math.round(start*(cap-1)), until=Math.round(stop*(cap-1));
    const step=Math.sign(until-from);
    for(let n=from;n!==until;n+=step) {
      const [x,y]=vertical?[fixed,n]:[n,fixed];
      if(data[(y*w+x)*4+3]>=154) return n;
    }
    return null;
  }
  const zones=[
    {from:.39, to:.64, start:0, stop:.22, vertical:true, count:13, tone:'gold', dir:-Math.PI*.59},
    {from:.64, to:.775, start:0, stop:.22, vertical:true, count:10, tone:'teal', dir:-Math.PI*.34},
    {from:.327,to:.464,start:0,stop:.145,vertical:false,count:8,tone:'gold',dir:-Math.PI*.87},
    {from:.09,to:.125,start:.25,stop:.363,vertical:true,count:5,tone:'gold',dir:-Math.PI*.66},
    {from:.59,to:.77,start:1,stop:.7,vertical:false,count:13,tone:'teal',dir:-Math.PI*.065},
    {from:.266,to:.405,start:.46,stop:.671,vertical:true,count:9,tone:'gold',dir:-Math.PI*.82},
  ];
  const result=[];
  for(const zone of zones) {
    const {from,to,start,stop,vertical,count,tone,dir}=zone;
    const axis=vertical?w:h;
    for(let index=0;index<count;index++) {
      const cell=Math.round(mix(from,to,(index+.5)/count)*(axis-1));
      const edge=at(cell,start,stop,vertical);
      if(edge===null) continue;
      const prev=at(cell-4,start,stop,vertical)??edge;
      const next=at(cell+4,start,stop,vertical)??edge;
      const step=Math.sign(stop-start);
      const normal=vertical?Math.atan2(-step,(next-prev)*step/8):Math.atan2((next-prev)*step/8,-step);
      const angle=dir+.54*Math.atan2(Math.sin(normal-dir),Math.cos(normal-dir));
      result.push({x:(vertical?cell:edge)/w,y:(vertical?edge:cell)/h,angle,tone});
    }
  }
  return result;
}

const wavelengths={
  gold:{hue:[255,173,78],bright:'#ffe4a1',color:'#fca951'},
  teal:{hue:[80,230,210],bright:'#b8ffef',color:'#6eebd7'},
};

export function disperseLight(c,portrait,x,y,w,f,visibility=1) {
  const h=w*portrait.image.height/portrait.image.width;
  const last=out((f.time-(f.end-.887))/.83);
  const first=1-.44*out(f.time/.64);
  c.save(); c.globalCompositeOperation='screen'; c.lineCap='round';
  for(const [i,e] of portrait.emitters.entries()) {
    const variation=hash(i+7), phase=hash(i*7+41), sway=hash(i+109)-.5;
    const period=.77+variation*.83;
    const age=((f.time/period+phase)%1+1)%1;
    const flicker=Math.pow(.5+.5*Math.sin(f.time*TAU*(1.4+phase)+i*.9),2);
    const energy=visibility*(.36+.31*flicker+.42*f.pulse+.31*last);
    const [r,g,b]=wavelengths[e.tone].hue;
    const {bright,color}=wavelengths[e.tone];
    const sx=x+e.x*w, sy=y+e.y*h;
    const vx=Math.cos(e.angle+sway*.44),vy=Math.sin(e.angle+sway*.44);
    const reach=(123+variation*174)*(1+.46*last+.18*first);
    const jet=clamp(age*1.13);
    const lead=jet*(.47+.53*jet)*reach;
    const lift=jet*jet*(18+variation*38);
    const bend=jet*jet*sway*72;
    const px=sx+vx*lead-vy*bend, py=sy+vy*lead-lift+vx*bend;
    const flame=Math.sin(Math.PI*clamp(age/.97))**.7;

    if(i%3===0) {
      c.globalAlpha=1;
      glow(c,sx,sy,20+17*variation,`rgba(${r},${g},${b},${.34*energy})`);
    }
    if(i%4===0) {
      const breathe=.5+.5*Math.sin(f.time*TAU*(.62+variation*.32)+i*.87);
      const size=(121+variation*128)*(.68+.36*breathe+.35*last);
      const curve=sway*90;
      const ex=sx+vx*size-vy*curve,ey=sy+vy*size+vx*curve-34;
      const ribbon=c.createLinearGradient(sx,sy,ex,ey);
      ribbon.addColorStop(0,bright);
      ribbon.addColorStop(.22,color);
      ribbon.addColorStop(.67,`rgba(${r},${g},${b},0.48)`);
      ribbon.addColorStop(1,`rgba(${r},${g},${b},0)`);
      c.globalAlpha=visibility*.44+energy*.31;
      c.beginPath(); c.moveTo(sx,sy);
      c.bezierCurveTo(sx+vx*size*.34,sy+vy*size*.34,sx+vx*size*.67-vy*curve*.75,sy+vy*size*.67+vx*curve*.75-11,ex,ey);
      c.strokeStyle=ribbon;
      c.lineWidth=11+variation*8;
      c.globalAlpha*=.32;
      c.stroke();
      c.globalAlpha=visibility*.54+energy*.29;
      c.lineWidth=2.8+variation*3.8;
      c.stroke();
    }
    if(flame<.004) continue;
    const tail=Math.max(0,lead-(20+variation*43));
    const tx=sx+vx*tail-vy*bend*.53,ty=sy+vy*tail-lift*.55+vx*bend*.53;
    const trail=c.createLinearGradient(tx,ty,px,py);
    trail.addColorStop(0,`rgba(${r},${g},${b},0)`);
    trail.addColorStop(.75,color);
    trail.addColorStop(1,bright);
    c.globalAlpha=flame*(visibility*.32+energy*.68);
    c.beginPath(); c.moveTo(tx,ty); c.quadraticCurveTo(px-vx*19,py-vy*19+lift*.18,px,py);
    c.strokeStyle=trail; c.lineWidth=1.8+variation*2.8; c.stroke();
    c.globalAlpha=flame*(visibility*.30+energy*.70);
    oval(c,px,py,1.8+variation*2.2,1.8+variation*2.2,bright,1,true);
    if(i%5===0) {
      c.globalAlpha=1;
      glow(c,px,py,22+variation*19,`rgba(${r},${g},${b},${flame*energy*.35})`);
    }
  }
  c.restore();
}
