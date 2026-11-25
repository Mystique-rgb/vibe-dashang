import { getFrame } from './timeline.js';
import { W,H,TAU,GOLD,CREAM,RED,BLUE,SERIF,MONO,SANS,clamp,out,hash,line,oval,text,glow,card,backdrop } from './fx.js';
import { drawDiagram } from './diagrams.js';
import { panOpeningBackground } from './opening-background.js';
import { drawCueEffects } from './accent-effects.js';
import { createPortrait, lightPortrait, revealLighting, disperseLight, portraitSpace } from './portrait.js';

const orbitCopy = [...'说谎者　人羊　说谎者　人羊　'];
const orbitSteps = 48;

function orbitPoint(angle, lift, radius, tilt, cx, cy) {
  const z=Math.sin(angle);
  const depth=1/(1-z*.31);
  const x=Math.cos(angle)*radius*depth;
  const y=(z*141+Math.cos(angle)*26+lift)*depth;
  return {x:cx+x*Math.cos(tilt)-y*Math.sin(tilt),y:cy+x*Math.sin(tilt)+y*Math.cos(tilt),z,depth};
}

function orbit(c,f,cx,cy,front) {
  const tilt=.21+Math.sin(f.time*1.38)*.09;
  const radius=636+Math.sin(f.time*1.28)*23;
  const phase=f.time*.98+.07*Math.sin(f.time*1.35);
  const half=front?0:Math.PI;
  for(let row=-1;row<=1;row++) {
    c.beginPath();
    for(let step=0;step<=orbitSteps;step++) {
      const angle=half+Math.PI*step/orbitSteps;
      const p=orbitPoint(angle,row*101,radius,tilt,cx,cy);
      if(step===0)c.moveTo(p.x,p.y);else c.lineTo(p.x,p.y);
    }
    c.strokeStyle=front?'#ffd08b9f':'#c18d5d58';
    c.lineWidth=row===0?1:2;
    c.stroke();
  }
  const items=[];
  for(const [index,char] of orbitCopy.entries()) {
    if(char==='　')continue;
    const angle=phase-index*TAU/orbitCopy.length;
    const p=orbitPoint(angle,0,radius,tilt,cx,cy);
    if((p.z>=0)!==front)continue;
    // Fade through each side so crossing the portrait layer never pops a glyph into view.
    const depthDistance=Math.abs(p.z);
    const opacity=depthDistance*(front?.72+.26*depthDistance:.61-.37*depthDistance);
    items.push({...p,char,opacity,lean:Math.cos(angle)*.29+tilt});
  }
  items.sort((a,b)=>a.z-b.z);
  for(const q of items) {
    c.save(); c.translate(q.x,q.y); c.rotate(q.lean);
    c.globalAlpha=q.opacity;
    c.shadowBlur=front?19:12; c.shadowColor=front?'#f58d42':'#8f6652';
    text(c,q.char,0,0,91*q.depth,{family:SERIF,weight:900,color:front?'#fae2ab':'#e2b590',stroke:front?3:1});
    c.restore();
  }
}

function opening(c,f,portrait) {
  const t=f.time;
  const x=1090, y=628, w=1072;
  const h=w*portrait.image.height/portrait.image.width;
  const portraitX=x-w/2, portraitY=y-h*.54;
  const lighting=revealLighting(t);

  portraitSpace(c,f,x,y-104,false);
  glow(c,x+112,y-174,685,'#9b633f7a');
  for(let j=0;j<5;j++) {
    const wave=(t*94+j*98)%490;
    const rx=256+wave;
    c.save(); c.globalAlpha=(1-wave/510)*(.49+f.pulse*.32);
    oval(c,x+35,y-152,rx,rx*.64,j%3===0?BLUE:GOLD,j===0?2.4:1.4);
    c.restore();
  }
  const orbitY = y-1+Math.sin(t*1.8)*37;
  orbit(c,f,x-55,orbitY,false);
  lightPortrait(c,portrait,portraitX,portraitY,w,f,lighting);
  if(lighting.body>0)disperseLight(c,portrait,portraitX,portraitY,w,f,lighting.body);
  orbit(c,f,x-55,orbitY,true);
  portraitSpace(c,f,x,orbitY,true);
  text(c,'十日终焉',136,148,45,{align:'left',family:SERIF,color:'#e9c690',stroke:4});
  line(c,138,192,349,192,'#c791576f',2);
  const n=out((t-.29)/.32);
  c.save(); c.globalAlpha=n;
  const namesX=133;
  text(c,'人',namesX,381,194,{align:'left',family:SERIF,color:'#f3d6a6',stroke:6});
  text(c,'羊',namesX+17,565,194,{align:'left',family:SERIF,color:'#f3d6a6',stroke:6});
  c.restore();
}

function titleBurst(c,f) {
  if(f.kind!=='title' || f.local>.68)return;
  const p=out(f.local/.54);
  const xx=W*.5, yy=H*.47;
  c.save(); c.globalAlpha=(1-p)*.70;
  for(let j=0;j<5;j++) {
    const r=150+j*83+p*610;
    oval(c,xx,yy,r,r*.58,j%2?RED:GOLD,3+(j===0?4:0));
  }
  for(let j=0;j<46;j++) {
    const a=j*TAU/46, r=120+hash(j)*255+p*820;
    const k=35+hash(j+42)*190;
    line(c,xx+Math.cos(a)*r,yy+Math.sin(a)*r*.64,xx+Math.cos(a)*(r+k),yy+Math.sin(a)*(r+k)*.64,j%4?GOLD:RED,1+hash(j+1)*3);
  }
  c.restore();
  if(f.local<.29) {
    const t=out(f.local/.29);
    const plane=1+3.9*t;
    for(const dir of [-1,1]) {
      c.save(); c.translate(xx+dir*(84+t*1130),yy+dir*(-22+f.local*110)); c.rotate(dir*(.11+t*.34));
      card(c,0,0,238*plane,339*plane,{red:dir<0,alpha:1-t*.58,rot:dir*.13}); c.restore();
    }
  }
}

function beatAccents(c,f) {
  if(f.kind==='intro' || f.kind==='title') return;
  const elapsed=f.beat*f.period;
  if(elapsed>.20) return;
  const k=out(elapsed/.20);
  const x=W*.5+(f.beatIndex%2?33:-33);
  const y=f.kind==='vote'?585:532;
  const hot=['threat','flip','verdict'].includes(f.kind);
  c.save(); c.globalAlpha=(1-k)*(f.beatIndex%2?.35:.56);
  for(let i=0;i<18;i++) {
    const a=i*TAU/18+.3;
    const r=(i%2?616:695)+k*185;
    const tail=20+hash(i+21)*68;
    line(c,x+Math.cos(a)*r,y+Math.sin(a)*r*.58,
      x+Math.cos(a)*(r+tail),y+Math.sin(a)*(r+tail)*.58, hot?RED:GOLD, i%4===0?3:1.5);
  }
  c.restore();
}

function typography(c,f) {
  if(f.kind==='title') return;
  if(f.kind!=='intro') {
    const p=out(f.local/.22);
    const c0=['threat','flip','verdict'].includes(f.kind)?'#ffe2bd':CREAM;
    if(f.kicker) text(c,f.kicker,960,82,37,{color:f.kind==='threat'?RED:GOLD,weight:750,max:1590});
    text(c,f.headline,960,(f.kicker?169:138)+25*(1-p),f.kind==='end'?147:105,
      {family:SERIF,color:c0,stroke:5,max:1690});
  }
  if(!f.caption) return;
  const grad=c.createLinearGradient(0,785,0,1079);
  grad.addColorStop(0,'transparent'); grad.addColorStop(.56,'#080d12c2'); grad.addColorStop(1,'#080d12');
  c.fillStyle=grad; c.fillRect(0,785,W,295);
  if(f.kind!=='intro') line(c,142,865,W-142,865,'#c8a07062',2);
  const color=f.kind==='intro'?'#ffe2a4':CREAM;
  text(c,f.caption,W/2,f.kind==='intro'?960:940,f.kind==='intro'?81:67,
    {color,max:1690,stroke:6,weight:850});
}

function flash(c,f,canvas) {
  const time=f.local;
  if(f.kind==='intro' || time>.115) return;
  const primary=f.kind==='title';
  const k=1-clamp(time/.115);
  c.save();
  if(time<.076){
    for(let i=0;i<(primary?13:7);i++){
      const y=40+hash(i+f.id*17)*(H-100),h=2+hash(i+73)*39;
      const shift=(hash(i+50)-.5)*(primary?356:142)*k;
      c.drawImage(canvas,0,y*(canvas.height/H),canvas.width,h*(canvas.height/H),shift,y,W,h);
      c.fillStyle=i%2?'rgba(255,91,60,0.08)':'rgba(70,207,198,0.1)'; c.fillRect(0,y,W,h);
    }
  }
  c.globalCompositeOperation='screen';
  c.globalAlpha=k*(primary?.43:.17);
  glow(c,910+(f.id%2)*160,510,1270,primary?'#ffd0a4':'#f2b786');
  c.restore();
}

export default async function createScene({root,width,height,pixelRatio=1}) {
  const canvas=document.createElement('canvas');
  canvas.width=Math.round(width*pixelRatio); canvas.height=Math.round(height*pixelRatio);
  canvas.style.cssText='display:block;width:100%;height:100%';
  root.appendChild(canvas);
  const c=canvas.getContext('2d',{alpha:false});
  const image=new Image(); image.src=new URL('../assets/sheep-illustration.png',import.meta.url).href;
  await image.decode();
  const portrait=createPortrait(image);
  await Promise.allSettled([document.fonts.load(`900 100px ${SERIF}`,'说谎者'),document.fonts.load(`800 66px ${SANS}`,'人羊')]);
  return {
    prepareFrame(time) {
      const f=getFrame(time);
      c.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
      c.globalAlpha=1; c.globalCompositeOperation='source-over';
      backdrop(c,f,f.kind==='intro');
      if(f.kind==='intro')panOpeningBackground(c,f);
      c.save();
      if(f.kind==='intro') opening(c,f,portrait);
      else {
        const kick=f.beatIndex%2?.018:.039;
        const k=f.kind==='title' ? 0 : kick*f.pulse + .036*Math.sin(f.local*2.03) + .027*f.progress;
        const drift=f.kind==='title'?0:Math.sin(f.local*1.62+f.id*.8)*31;
        c.translate(960+drift,540+Math.sin(f.local*1.18)*9);
        c.scale(1+k,1+k);
        c.translate(-960,-540);
        drawDiagram(c,f,image);
        drawCueEffects(c,f);
      }
      c.restore();
      if(f.kind==='title') titleBurst(c,f);
      beatAccents(c,f);
      flash(c,f,canvas);
      typography(c,f);
    },
    dispose() {canvas.remove();},
  };
}
