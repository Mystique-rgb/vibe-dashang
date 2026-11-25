import timeline from './timeline.mjs';
import captions from './captions.mjs';
import {shots} from './shots.mjs';
import {actor,hands,prop} from './cast.mjs';
import {drawEffect} from './effects.mjs';
import {drawAtmosphere,drawWorld} from './world.mjs';
import {dressScene} from './set-dressing.mjs';
import {lightScene} from './lighting.mjs';
import {W,H,box,clamp,grad,glow,label,line,mix,poly,random,smooth} from './palette.mjs';

const length=3653/30;
const camera={
 push:p=>[1.025+.14*p,10-37*p,12-24*p,0],
 slide:p=>[1.072+.054*p,68-138*p,13-22*p,0],
 rush:p=>[1.019+.189*smooth(p*.95),4-15*p,15-36*p,0],
 drift:p=>[1.065+.056*p,-22+46*p,-9+14*p,-.008+.016*p],
 retreat:p=>[1.203-.169*smooth(p),29-44*p,-21+30*p,0],
 roll:p=>[1.14+.04*p,-26+48*p,12-17*p,-.045+.081*p],
 glide:p=>[1.063+.068*p,-59+114*p,8-17*p,0],
 travel:p=>[1.11+.04*p,59-124*p,12+Math.sin(p*7)*14,.011-.02*p],
 shake:p=>[1.13+.11*p,Math.sin(p*48)*25*Math.exp(-p*5)-38*p,Math.cos(p*42)*14*Math.exp(-p*7),-.016+.032*p],
 shock:p=>[1.19-.098*smooth(p)+.064*Math.exp(-p*18),22-37*p,12-17*p,0],
};

function findAt(list,t){
 let low=0,high=list.length-1;
 while(low<high){const m=Math.ceil((low+high)/2);if(list[m].start<=t)low=m;else high=m-1;}
 return low;
}

// Merge the rapid rows into readable captions without changing any approval cut.
const readable=[];
for(const current of captions){
 const previous=readable.at(-1);
 if(previous&&previous.end-previous.start<1.32&&current.start-previous.end<.11&&previous.text.length+current.text.length<32&&![8,15,22,26,27,29,41,51,63,65,66,67,74,78,79].includes(current.id)){
  previous.end=current.end;previous.text+=current.text;
 }else readable.push({...current});
}
if(readable[0])readable[0].start=0;

function makeGrain(){
 const texture=document.createElement('canvas');texture.width=360;texture.height=203;
 const c=texture.getContext('2d'),data=c.createImageData(texture.width,texture.height);
 for(let i=0;i<data.width*data.height;i++){
  const v=224*random(i+17);const j=i*4;data.data[j]=v;data.data[j+1]=v;data.data[j+2]=v;data.data[j+3]=v>105?42:23;
 }
 c.putImageData(data,0,0);return texture;
}
function worldCamera(c,scale,x,y,r,parallax=1){
 c.translate(W/2+x*parallax,H/2+y*parallax);c.rotate(r*parallax);c.scale(scale,scale);c.translate(-W/2,-H/2);
}
function shotImage(c,shot,frame){
 const {t,p,id}=frame;const [scale,dx,dy,angle]=camera[shot.camera](p);
 c.save();worldCamera(c,Math.max(1.045,scale*.99),dx,dy,angle,.38);
 drawWorld(c,shot.world,frame);dressScene(c,shot.world,frame);lightScene(c,shot.world,frame);c.restore();
 c.save();worldCamera(c,scale,dx,dy,angle,1);
 for(const o of shot.objects){
  if(o.kind==='role'){
    const walk=o.pose==='walk'||o.pose==='run', swim=o.pose==='swim', fallen=o.pose==='fallen';
    const dx=walk?(p-.5)*(o.pose==='run'?165:74)*o.facing:swim?Math.sin(t*.8+id)*17:fallen&&id===55?31*p:0;
    const dy=swim?Math.sin(t*2+id)*17:fallen&&[2,19,47,55].includes(id)?p*96:Math.sin(t*2)*2.8;
    actor(c,o.name,o.x+dx,o.y+dy,o.size,{...o,t,p});
  }else if(o.kind==='item'){
    const motion=o.name==='notebook'&&[3,55].includes(id);const y=motion?o.y+p*p*107:o.y+Math.sin(t*1.8+id)*(o.name==='lamp'?15:3);
    const x=id===7?o.x+(1-smooth(p))*710:id===66?o.x+(p-.5)*463:o.x;
    prop(c,o.name,x,y,o.size,{...o,p,t,angle:o.angle+(motion?p*.68:id===66?p*7.2:0)});
  }else if(o.kind==='hand')hands(c,o.x,o.y,o.size,{variant:o.name,p,t,light:o.light});
  else drawEffect(c,o,frame);
 }
 c.restore();
 c.save();worldCamera(c,1.051,dx,dy,angle,.77);drawAtmosphere(c,shot.world,frame);dressScene(c,shot.world,frame,true);lightScene(c,shot.world,frame,true);c.restore();
}
function grade(c,key,grain,t){
 const g=c.createRadialGradient(960,530,330,960,564,1120);g.addColorStop(0,'rgba(2,0,8,0)');g.addColorStop(.7,'rgba(2,3,13,.055)');g.addColorStop(1,'rgba(2,4,14,.37)');box(c,g,0,0,W,H);
 c.save();c.globalAlpha=key==='dawn'?.12:.21;c.globalCompositeOperation='soft-light';c.imageSmoothingEnabled=false;
 const q=Math.floor(t*12);c.drawImage(grain,-8+Math.floor(random(q)*7),-8+Math.floor(random(q+91)*7),1936,1096);c.restore();
}
function transition(c,shot,{id,age,p}){
 if(id===1&&age<.16){box(c,`rgba(4,7,15,${1-smooth(age/.16)})`,0,0,W,H);}
 if(shot.wipe==='paper'&&age<.29){const q=smooth(age/.29),x=W*(1-q);poly(c,grad(c,x-91,0,x+156,0,'rgba(163,117,120,0)','rgba(230,193,172,.53)','#8b6675'),[[x,-28],[x+270,-24],[x-20,H+30],[x-290,H+30]]);}
 if(shot.wipe==='pillar'&&age<.25){const x=-300+(W+600)*smooth(age/.25);poly(c,grad(c,x-150,0,x+123,0,'rgba(14,18,31,0)','#141528','#292c43','rgba(18,20,33,0)'),[[x-246,-10],[x+38,-10],[x+208,H+10],[x-124,H+10]]);}
 if(shot.wipe==='train'&&age<.23){const x=-240+(W+480)*smooth(age/.23);box(c,'rgba(164,191,209,.13)',x-415,0,360,H);line(c,'rgba(209,229,235,.30)',4,[[x-111,0],[x-142,H]]);}
 if(shot.wipe==='match'&&age<.22){const q=1-smooth(age/.22);glow(c,id===74?'241,196,161':'151,189,226',970,418,624,.35*q);line(c,`rgba(204,220,234,${.3*q})`,1.4,[[0,518],[W,518]]);}
 if([8,14,22,29,53,63,65,74,78].includes(id)&&age<.14){
  const q=Math.exp(-age/.045), rgb=id===53?'248,111,115':id>=74?'255,219,178':'224,231,253';
  box(c,`rgba(${rgb},${(id===63?.24:.061)*q})`,0,0,W,H);
  if(id===63)line(c,`rgba(${rgb},${.5*q})`,5,[[130,495],[1700,488]]);
 }
 if((id===45||id===53)&&p<.37)glow(c,'221,43,70',960,451,820,.1*(1-p/.37));
}
function titleLayer(c,shot,{age,p,id}){
 if(shot.title){
  c.save();c.globalAlpha=clamp(age/.13)*(1-.40*smooth((p-.78)/.22));
  const y=id===63?162:id===20?245:226;
  const size=id===63?86:id===20?91:72;
  const color=id===63?'#ffe2bb':'#f8d8a2';
  label(c,shot.title,960,y+(1-smooth(age/.18))*10,size,color,'center',true);
  const span=(id===63?380:312)*smooth(age/.38);
  line(c,'rgba(247,204,151,.60)',1.4,[[960-span,y+65],[960+span,y+65]]);
  c.restore();
 }
 if(id===54){label(c,'同人结局',1786,116,26,'#e9c4b4','right');}
}
function subtitle(c,t,id){
 const cue=readable[findAt(readable,t)];if(!cue||t<cue.start||t>cue.end+.025)return;if(id===63&&cue.id===63)return;
 const y=id===71||id===50?177:id===78?858:977;
 const size=cue.text.length>26?46:51;
 c.save();
 c.globalAlpha=.94+.06*smooth((t-cue.start)/.075);
 label(c,cue.text,960,y,size,'#fff5e7');c.restore();
}

export default function({root,width,height,pixelRatio}){
 const canvas=document.createElement('canvas');
 canvas.width=Math.round(width*pixelRatio);canvas.height=Math.round(height*pixelRatio);
 Object.assign(canvas.style,{display:'block',width:'100%',height:'100%'});root.style.background='#080c19';root.append(canvas);
 const c=canvas.getContext('2d',{alpha:false});const grain=makeGrain();
 return {
  prepareFrame(time){
   const t=clamp(time,0,length-.00001),idx=findAt(timeline,t),cue=timeline[idx],shot=shots[idx],end=timeline[idx+1]?.start??length;
   const p=clamp((t-cue.start)/(end-cue.start)),frame={t,p,age:t-cue.start,id:cue.id};
   c.resetTransform();c.scale(canvas.width/W,canvas.height/H);c.globalAlpha=1;c.globalCompositeOperation='source-over';c.imageSmoothingEnabled=true;c.lineCap='butt';c.lineJoin='miter';
   box(c,'#12182a',0,0,W,H);shotImage(c,shot,frame);grade(c,shot.world,grain,t);transition(c,shot,frame);titleLayer(c,shot,frame);subtitle(c,t,cue.id);
  },
  dispose(){canvas.remove();},
 };
}
