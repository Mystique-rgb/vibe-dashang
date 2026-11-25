import { W,H,clamp,cream,gold,serif,text,rect,vertical,vignette } from './art.js';
import { duration,shots } from './timeline.js';
import { scenes } from './scenes.js';

function loadPhoto(path) {
  const image=new Image();
  image.src=path;
  return image.decode().then(()=>image,()=>null);
}

function createPaperTexture() {
  const tile=document.createElement('canvas');
  tile.width=192; tile.height=192;
  const ctx=tile.getContext('2d');
  const pixels=ctx.createImageData(tile.width,tile.height);
  let seed=758;
  for(let i=0;i<pixels.data.length;i+=4){
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    const p=seed>>>24;
    const tone=p<120?13:246;
    pixels.data[i]=tone; pixels.data[i+1]=tone; pixels.data[i+2]=tone;
    pixels.data[i+3]=Math.min(24,Math.abs(p-128)*.19);
  }
  ctx.putImageData(pixels,0,0);
  return tile;
}

function caption(c,time,index,kind,lines,highlight,source) {
  if(!lines.length)return;
  if(kind==='title'||kind==='credit'){
    text(c,'天亮以前',480,272,78,{align:'center',font:serif,weight:700,color:cream,outline:4});
    if(kind==='credit')text(c,'张桂梅',480,329,31,{align:'center',color:gold,outline:3});
    return;
  }
  if(kind==='switch'){
    text(c,'张桂梅',102,266,88,{font:serif,weight:700,color:cream,outline:6});
    text(c,'云南华坪',106,316,32,{color:gold,outline:4});
    return;
  }
  vertical(c,0,384,W,156,'#151b2400','#151b24c7');
  const offset=index===21?3:time;
  lines.forEach((subtitle,i)=>{
    if(i&&offset<.17)return;
    const size=subtitle.length>17?34:39;
    const y=source?479-(lines.length-1-i)*47:505-(lines.length-1-i)*47;
    text(c,subtitle,480,y,size,{align:'center',color:'#fff3dc',outline:5});
    const start=highlight?subtitle.indexOf(highlight):-1;
    if(start<0)return;
    const x=480-c.measureText(subtitle).width/2+c.measureText(subtitle.slice(0,start)).width;
    text(c,highlight,x,y,size,{color:gold});
  });
  if(source)text(c,source,480,510,17,{align:'center',color:'#f1e1c5',outline:3});
}

const schematic=new Set(['map','school','empty','visit','hands','gate','exam','graduate','math','doctor','pass']);

export default async function ({root,width,height}) {
  const canvas=document.createElement('canvas');
  canvas.width=width; canvas.height=height;
  Object.assign(canvas.style,{width:'100%',height:'100%',display:'block'});
  root.appendChild(canvas);
  const c=canvas.getContext('2d',{alpha:false});
  const noise=c.createPattern(createPaperTexture(),'repeat');
  const [reading,group]=await Promise.all([
    loadPhoto(new URL('../assets/archive/day-10.jpg',import.meta.url).href),
    loadPhoto(new URL('../assets/archive/xinhua-09.jpg',import.meta.url).href),
  ]);
  return {
    prepareFrame(time){
      const t=Math.min(duration,Math.max(0,time));
      const index=shots.findLastIndex(([start])=>start<=t+1e-7);
      const [start,kind,lines,highlight,source]=shots[index];
      const local=t-start;
      c.setTransform(width/W,0,0,height/H,0,0);
      c.save();
      const zoom=kind==='title'||kind==='credit'?1:1+Math.min(3,local)*.014;
      c.translate(W/2,H/2); c.scale(zoom,zoom); c.translate(-W/2,-H/2);
      scenes[kind](c,local,{reading,group});
      c.restore();
      vignette(c,.41);
      rect(c,0,0,W,H,noise);
      if(schematic.has(kind))text(c,kind==='map'?'地点示意':'情景示意',914,39,17,{align:'right',outline:3});
      caption(c,local,index,kind,lines,highlight,source);
      if(kind==='credit'&&t>89.1)rect(c,0,0,W,H,`rgba(16,21,28,${clamp((t-89.1)/.9)*.72})`);
    },
    dispose(){canvas.remove();},
  };
}
